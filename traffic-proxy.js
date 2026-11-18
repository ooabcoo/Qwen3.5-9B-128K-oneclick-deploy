/**
 * Token usage proxy
 *
 * Forwards all requests to the local LLM API and records token usage per day.
 * - Upstream: http://127.0.0.1:8080/
 * - Listen on: 8081 (override with PROXY_PORT)
 * - Reads token counts from the API response "usage" field (both JSON and SSE)
 * - http://127.0.0.1:8081/               -> Chinese token dashboard
 *   http://127.0.0.1:8081/traffic.json   -> raw stats JSON (with details)
 *   everything else                      -> forwarded to upstream
 * - Daily file under ./traffic-stats/YYYY-MM-DD/traffic.json
 * - Data survives restarts (loaded from disk on startup)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const UPSTREAM_HOST = '127.0.0.1';
const UPSTREAM_PORT = 8080;
const PROXY_PORT = process.env.PROXY_PORT || 8081;
const LOG_DIR = path.join(process.cwd(), 'traffic-stats');
const MAX_DETAILS = 2000; // keep newest 2000 requests to bound file size

// Use LOCAL date, not UTC (UTC would give yesterday before 08:00 in GMT+8)
function getLocalDate() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function statsFileFor(dateStr) {
    return path.join(LOG_DIR, dateStr, 'traffic.json');
}

function newStats() {
    const now = new Date().toISOString();
    return {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        cachedTokens: 0,
        requests: 0,
        startTime: now,
        lastUpdate: now,
        details: []
    };
}

function loadStats(dateStr) {
    try {
        const parsed = JSON.parse(fs.readFileSync(statsFileFor(dateStr), 'utf8'));
        // Only keep token fields; drop any legacy byte fields from older files
        const loaded = Object.assign(newStats(), {
            totalTokens: parsed.totalTokens,
            promptTokens: parsed.promptTokens,
            completionTokens: parsed.completionTokens,
            cachedTokens: parsed.cachedTokens,
            requests: parsed.requests,
            startTime: parsed.startTime,
            details: parsed.details
        }, { lastUpdate: new Date().toISOString() });
        if (!Array.isArray(loaded.details)) loaded.details = [];
        return loaded;
    } catch (e) {
        return newStats();
    }
}

let currentDate = getLocalDate();
let stats = loadStats(currentDate);

function saveStats() {
    try {
        const dir = path.join(LOG_DIR, currentDate);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        stats.lastUpdate = new Date().toISOString();
        fs.writeFileSync(statsFileFor(currentDate), JSON.stringify(stats, null, 2));
    } catch (e) {
        console.error(`[!] Failed to save stats: ${e.message}`);
    }
}

// Roll over to a new file when the date changes at midnight
function rolloverIfNeeded() {
    const today = getLocalDate();
    if (today !== currentDate) {
        saveStats();
        currentDate = today;
        stats = loadStats(currentDate);
        console.log(`[i] New day: ${currentDate}`);
    }
}

// Normalize the "usage" object from OpenAI-compatible APIs
function normalizeUsage(usage) {
    if (!usage || typeof usage !== 'object') return null;
    const prompt = Number(usage.prompt_tokens) || 0;
    const completion = Number(usage.completion_tokens) || 0;
    const total = Number(usage.total_tokens) || (prompt + completion);
    const cached = Number(usage.prompt_tokens_details && usage.prompt_tokens_details.cached_tokens) || 0;
    return { promptTokens: prompt, completionTokens: completion, totalTokens: total, cachedTokens: cached };
}

// Extract token usage from a response body.
// Handles both plain JSON (non-stream) and SSE "data:" chunks (stream).
function extractUsage(body) {
    const text = body.toString('utf8');

    // 1) Non-stream: whole body is a JSON object
    try {
        const obj = JSON.parse(text);
        if (obj && obj.usage) return normalizeUsage(obj.usage);
    } catch (e) {
        // not a single JSON object, fall through to SSE parsing
    }

    // 2) Stream (SSE): scan every "data:" line, keep the last one with usage
    let found = null;
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
            const obj = JSON.parse(payload);
            if (obj && obj.usage) found = normalizeUsage(obj.usage);
        } catch (e) {
            // ignore malformed chunks
        }
    }
    if (found) return found;

    return null; // request did not report usage (e.g. /v1/models, errors, stream without include_usage)
}

// Pull a human-readable text out of a message content value (string or multimodal array)
function contentToText(content) {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map((p) => (p && typeof p.text === 'string') ? p.text : '').filter(Boolean).join(' ');
    }
    return '';
}

// Extract the user prompt text from a chat/completions request body
function extractPromptText(body) {
    try {
        const obj = JSON.parse(body.toString('utf8'));
        if (obj && Array.isArray(obj.messages)) {
            // Prefer the last user message, fall back to the last message overall
            const userMsgs = obj.messages.filter((m) => m && m.role === 'user');
            const target = userMsgs.length ? userMsgs[userMsgs.length - 1] : obj.messages[obj.messages.length - 1];
            const text = contentToText(target && target.content);
            if (text) return text;
        }
        if (obj && typeof obj.prompt === 'string') return obj.prompt; // legacy completions API
        return '';
    } catch (e) {
        return '';
    }
}

// Extract the assistant reply text from a response body (JSON or SSE stream)
function extractResponseText(body) {
    const text = body.toString('utf8');

    // 1) Non-stream JSON
    try {
        const obj = JSON.parse(text);
        if (obj && obj.choices && obj.choices[0]) {
            const msg = obj.choices[0].message || {};
            const out = contentToText(msg.content) || contentToText(msg.reasoning_content);
            if (out) return out;
            if (typeof obj.choices[0].text === 'string') return obj.choices[0].text;
        }
    } catch (e) {
        // fall through to SSE parsing
    }

    // 2) SSE stream: concatenate every delta.content
    let acc = '';
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
            const obj = JSON.parse(payload);
            const delta = obj && obj.choices && obj.choices[0] && obj.choices[0].delta;
            if (delta) acc += contentToText(delta.content) || contentToText(delta.reasoning_content);
        } catch (e) {
            // ignore malformed chunks
        }
    }
    return acc;
}

// Force streamed chat requests to ask the upstream for a usage chunk.
// llama.cpp only emits `usage` in the final SSE chunk when the client sends
// stream_options.include_usage=true. Browsers/WebUIs usually omit it, so we
// inject it here and statistics work without client-side changes.
function injectUsageOption(body, urlPath) {
    if (!urlPath.includes('/chat/completions')) return body;
    try {
        const obj = JSON.parse(body.toString('utf8'));
        if (!obj || obj.stream !== true) return body; // only streamed requests need this
        if (!obj.stream_options || typeof obj.stream_options !== 'object') {
            obj.stream_options = {};
        }
        obj.stream_options.include_usage = true;
        return Buffer.from(JSON.stringify(obj), 'utf8');
    } catch (e) {
        return body; // non-JSON body, forward untouched
    }
}

function addUsage(entry) {
    stats.requests += 1;
    stats.totalTokens += entry.totalTokens || 0;
    stats.promptTokens += entry.promptTokens || 0;
    stats.completionTokens += entry.completionTokens || 0;
    stats.cachedTokens += entry.cachedTokens || 0;
    stats.details.unshift(entry); // newest first
    if (stats.details.length > MAX_DETAILS) {
        stats.details.length = MAX_DETAILS;
    }
    saveStats();
}

function formatNum(n) {
    return (Number(n) || 0).toLocaleString('zh-CN');
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Shanghai is fixed UTC+8 (no DST), so add 8h and read UTC components.
// This avoids depending on the machine's locale/ICU implementation.
function formatShanghai(iso, withDate) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '-';
    const sh = new Date(d.getTime() + 8 * 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    const hhmmss = `${pad(sh.getUTCHours())}:${pad(sh.getUTCMinutes())}:${pad(sh.getUTCSeconds())}`;
    if (withDate) {
        return `${sh.getUTCFullYear()}-${pad(sh.getUTCMonth() + 1)}-${pad(sh.getUTCDate())} ${hhmmss}`;
    }
    return hhmmss;
}

function formatTime(iso) {
    return formatShanghai(iso, false);
}

// A cell that shows "-" when the request did not report usage
function tokenCell(d, key) {
    if (!d.hasUsage) return '<td class="num" style="color:#484f58">-</td>';
    return `<td class="num">${formatNum(d[key])}</td>`;
}

// Truncate content for display and escape HTML
function truncateContent(text, maxLen = 100) {
    if (!text) return '<span class="nowrap" style="color:#8b949e">-</span>';
    if (text.length <= maxLen) return escapeHtml(text);
    return escapeHtml(text.substring(0, maxLen)) + '<span class="nowrap" style="color:#8b949e">...</span>';
}

// Live dashboard shown at http://127.0.0.1:8081/
function buildStatsPage() {
    // Skip "blank" rows: requests that reported neither usage nor any prompt/reply text
    const visible = stats.details.filter((d) => d.hasUsage || d.promptContent || d.responseContent);
    const detailRows = visible.map((d) => {
        const promptText = truncateContent(d.promptContent, 120);
        const responseText = truncateContent(d.responseContent, 120);
        return `<tr>
  <td class="nowrap">${escapeHtml(formatTime(d.time))}</td>
  <td class="pre" title="${escapeHtml(d.promptContent || '')}">${promptText}</td>
  <td class="pre" title="${escapeHtml(d.responseContent || '')}">${responseText}</td>
  ${tokenCell(d, 'promptTokens')}
  ${tokenCell(d, 'completionTokens')}
  ${d.hasUsage ? `<td class="num total">${formatNum(d.totalTokens)}</td>` : '<td class="num" style="color:#484f58">-</td>'}
  ${d.hasUsage && d.cachedTokens ? `<td class="num" style="color:#3fb950">${formatNum(d.cachedTokens)}</td>` : '<td class="num" style="color:#484f58">-</td>'}
</tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="10">
<title>Token 统计代理</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; padding:32px 20px; background:#0d1117; color:#e6edf3;
         font-family:-apple-system,"Segoe UI","Microsoft YaHei","PingFang SC",Roboto,sans-serif; }
  .wrap { max-width:1150px; margin:0 auto; }
  h1 { font-size:24px; margin:0 0 6px; }
  .sub { color:#8b949e; font-size:13px; margin-bottom:24px; line-height:1.7; }
  .card { background:#161b22; border:1px solid #30363d; border-radius:10px;
          padding:18px 22px; margin-bottom:16px; }
  .label { color:#8b949e; font-size:12px; letter-spacing:.05em; }
  .value { font-size:30px; font-weight:600; margin-top:6px; color:#58a6ff; }
  .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .row { display:flex; justify-content:space-between; padding:6px 0;
         border-bottom:1px solid #21262d; font-size:14px; }
  .row:last-child { border-bottom:none; }
  .k { color:#8b949e; }
  code { background:#21262d; padding:2px 6px; border-radius:4px; font-size:12px; }
  h2 { font-size:17px; margin:28px 0 12px; }
  .tablewrap { overflow-x:auto; background:#161b22; border:1px solid #30363d; border-radius:10px; }
  table { width:100%; border-collapse:collapse; font-size:13px; }
  th, td { padding:9px 12px; text-align:left; border-bottom:1px solid #21262d; white-space:nowrap; }
  th { color:#8b949e; font-weight:600; background:#161b22; position:sticky; top:0; }
  tr:last-child td { border-bottom:none; }
  tr:hover td { background:#1c2128; }
  td.num { text-align:right; font-variant-numeric:tabular-nums; }
  td.total { color:#58a6ff; font-weight:600; }
  .nowrap { color:#8b949e; }
  .pre { font-family:Consolas,"Courier New",monospace; line-height:1.45;
         white-space:normal; word-break:break-word; min-width:180px; max-width:280px;
         color:#c9d1d9; font-size:12px; }
  td.pre:hover { background:#1c2128; }
  .empty { padding:24px; color:#8b949e; text-align:center; }
  .hint { color:#8b949e; font-size:12px; font-weight:400; }
</style>
</head>
<body>
<div class="wrap">
  <h1>Token 统计代理</h1>
  <div class="sub">日期 <b>${currentDate}</b> &nbsp;&middot;&nbsp; 每 10 秒自动刷新
    &nbsp;&middot;&nbsp; 上游 <code>http://${UPSTREAM_HOST}:${UPSTREAM_PORT}/</code></div>

  <div class="card">
    <div class="label">今日总 Token</div>
    <div class="value">${formatNum(stats.totalTokens)}</div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="label">输入 Token（prompt）</div>
      <div class="value" style="color:#3fb950">${formatNum(stats.promptTokens)}</div>
    </div>
    <div class="card">
      <div class="label">输出 Token（completion）</div>
      <div class="value" style="color:#d29922">${formatNum(stats.completionTokens)}</div>
    </div>
    <div class="card">
      <div class="label">缓存命中 Token</div>
      <div class="value" style="color:#a371f7">${formatNum(stats.cachedTokens)}</div>
    </div>
  </div>

  <div class="card">
    <div class="row"><span class="k">请求次数</span><span>${formatNum(stats.requests)}</span></div>
    <div class="row"><span class="k">开始时间（上海）</span><span>${formatShanghai(stats.startTime, true)}</span></div>
    <div class="row"><span class="k">最后更新（上海）</span><span>${formatShanghai(stats.lastUpdate, true)}</span></div>
  </div>

  <h2>每次请求 Token 明细 <span class="hint">（最新在前，最多保留 ${MAX_DETAILS} 条；悬停可查看完整内容；"-" = 该请求未上报 usage）</span></h2>
  ${detailRows ? `<div class="tablewrap"><table>
<thead><tr>
  <th>时间（上海）</th>
  <th style="text-align:left">上行（提示词）</th>
  <th style="text-align:left">下行（回复内容）</th>
  <th style="text-align:right">输入</th><th style="text-align:right">输出</th>
  <th style="text-align:right">总计</th><th style="text-align:right">缓存</th>
</tr></thead>
<tbody>${detailRows}</tbody>
</table></div>` : '<div class="tablewrap"><div class="empty">暂无请求记录。通过代理访问一次 API 后，这里会显示每次请求的 Token 用量。</div></div>'}

  <div class="sub" style="margin-top:20px">日志文件：<code>${path.join(LOG_DIR, currentDate, 'traffic.json')}</code></div>
</div>
</body>
</html>`;
}

// Return true if the request was handled locally (not forwarded)
function handleLocalRoute(req, res, urlPath) {
    if (urlPath === '/' || urlPath === '/stats' || urlPath === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildStatsPage());
        return true;
    }
    if (urlPath === '/traffic.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(stats, null, 2));
        return true;
    }
    return false;
}

function sendBadGateway(res, message) {
    if (res.headersSent) return;
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
}

function proxyRequest(req, res) {
    rolloverIfNeeded();

    const urlPath = (req.url || '/').split('?')[0];
    if (handleLocalRoute(req, res, urlPath)) return;

    const startedAt = Date.now();
    const reqChunks = [];
    req.on('data', (chunk) => reqChunks.push(chunk));

    req.on('end', () => {
        const originalBody = Buffer.concat(reqChunks);
        const promptContent = extractPromptText(originalBody);
        const requestBody = injectUsageOption(originalBody, urlPath);

        const upstreamReq = http.request({
            hostname: UPSTREAM_HOST,
            port: UPSTREAM_PORT,
            path: req.url,
            method: req.method,
            headers: Object.assign({}, req.headers, {
                host: `${UPSTREAM_HOST}:${UPSTREAM_PORT}`,
                // Body may have grown after injecting stream_options; keep length in sync
                'content-length': requestBody.length
            })
        }, (upstreamRes) => {
            const resChunks = [];
            upstreamRes.on('data', (chunk) => resChunks.push(chunk));

            upstreamRes.on('end', () => {
                const body = Buffer.concat(resChunks);
                const responseContent = extractResponseText(body);
                const usage = extractUsage(body);
                const contentType = String(upstreamRes.headers['content-type'] || '');

                addUsage({
                    time: new Date().toISOString(),
                    method: req.method,
                    path: req.url,
                    status: upstreamRes.statusCode,
                    hasUsage: !!usage,
                    promptTokens: usage ? usage.promptTokens : 0,
                    completionTokens: usage ? usage.completionTokens : 0,
                    totalTokens: usage ? usage.totalTokens : 0,
                    cachedTokens: usage ? usage.cachedTokens : 0,
                    stream: contentType.includes('text/event-stream'),
                    durationMs: Date.now() - startedAt,
                    promptContent: promptContent,
                    responseContent: responseContent
                });

                res.writeHead(upstreamRes.statusCode, upstreamRes.headers);
                res.end(body);
            });

            upstreamRes.on('error', (err) => {
                console.error(`[!] Upstream response error: ${err.message}`);
                sendBadGateway(res, 'Upstream service error');
            });
        });

        upstreamReq.on('error', (err) => {
            console.error(`[!] Proxy request error: ${err.message}`);
            sendBadGateway(res, 'Proxy error');
        });

        upstreamReq.end(requestBody);
    });

    req.on('error', (err) => {
        console.error(`[!] Incoming request error: ${err.message}`);
        sendBadGateway(res, 'Bad request');
    });
}

const server = http.createServer(proxyRequest);

server.listen(PROXY_PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('  Token usage proxy started');
    console.log(`  Dashboard  : http://127.0.0.1:${PROXY_PORT}/`);
    console.log(`  Raw JSON   : http://127.0.0.1:${PROXY_PORT}/traffic.json`);
    console.log(`  Upstream   : http://${UPSTREAM_HOST}:${UPSTREAM_PORT}/`);
    console.log(`  Log dir    : ${LOG_DIR}`);
    console.log('========================================');
    console.log('');
    console.log('Press Ctrl+C to stop. Data is saved automatically.');
    console.log('');
});

process.on('SIGINT', () => {
    console.log('\nStopping service...');
    saveStats();
    server.close(() => {
        console.log('Service stopped. Stats saved.');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    console.error(`[!] Uncaught exception: ${err.message}`);
    saveStats();
});

// Save once at startup so the daily file always exists
saveStats();
