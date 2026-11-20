# Token Usage Proxy

## Overview

- Forwards all requests to `http://127.0.0.1:8080/`
- Reads real token counts from the API response `usage` field (not estimated from bytes)
- Handles both non-stream (JSON) and stream (SSE `data:` chunks) responses
- Auto-injects `stream_options.include_usage=true` into streamed chat requests so usage is reported
- Creates a new log file every day; data survives restarts
- **Top card is split into two side-by-side sections**: `今天统计` / `Today's Usage` shows aggregated metrics
- Bilingual dashboard at `http://127.0.0.1:8081/` - **Chinese by default**, switchable to English
- **Upstream context compression**: clients like WorkBuddy inject huge system context (the proxy compresses it before forwarding)
- **Token generation speed**: displays `tok/s` on each request row and average output speed on the dashboard

## Upstream context compression

Chat clients (WorkBuddy / CodeBuddy) inject a `<system-reminder>` block containing identity and skill context. When token usage exceeds a threshold, the proxy compresses the request body before forwarding:

1. **Line-level dedup** - identical non-empty lines kept once
2. **Heading-index mode** - markdown headings, XML tags, and short lines (≤120 chars) are indexed but not expanded
3. **User prompt protected** - everything between `<user_query>` and `</user_query>` is kept verbatim, so the actual question is never trimmed
4. **Multimodal protected** - image/audio parts in array content are passed through untouched
5. **Tool calls protected** - `tool_calls[].function.arguments` JSON strings are never text-truncated (preserves parseable parameters)
6. **No user message fallback** - if a request has no user message (tool continuation), a minimal one is appended

**Real-world result**: 137,544 token requests that would be rejected as "400 Over limit" are now compressed to ~20,000 tokens and forwarded successfully. 373K → ~102K actual prompt tokens (verified via upstream `usage.prompt_tokens`).

### Compression triggers (v2.0)

- **True tokenizer counting**: uses upstream `/tokenize` endpoint for accurate token counts
- **Output reservation**: input budget = `CTX_BUDGET - OUTPUT_RESERVE` (default: 131072 - 8192 = 122880)
- **70% waterline**: triggers compression when true token count ≥ 70% of input budget (default: ~91,750 tokens)
- **Post-compression verification**: re-counts after compression; if still over budget, drops oldest history rounds until it fits
- **Lazy precheck**: small requests (< 20% of budget in char-est) bypass tokenizer round-trip for zero extra latency

### Compression protection guarantees

1. **User query always preserved** - the current question is never trimmed
2. **Tool call arguments never corrupted** - JSON strings passed through verbatim; oversized tool rounds dropped as units
3. **Pairing maintained** - `tool` messages are kept with their preceding `assistant(tool_calls)` messages
4. **No user message fallback** - if after all compression rounds there's no user message, append `{role:"user",content:"请继续处理上述任务。"}` (fixes Qwen Jinja "No user query found" 500 error)

### Config (environment variables)

| Variable | Default | Meaning |
|----------|---------|---------|
| `COMPRESS_CONTEXT` | `1` | Set to `0` to disable compression entirely |
| `CTX_BUDGET` | `120000` | True-token threshold that triggers compression (derived from `MODEL_CTX - OUTPUT_RESERVE`) |
| `OUTPUT_RESERVE` | `8192` | Output token reservation from context window |
| `COMPRESS_TRIGGER` | `70%` of budget | True-token count at which compression triggers |
| `CHARS_PER_TOKEN` | `3.2` | Only used for lazy precheck estimation (fallback if tokenizer fails) |

Compressed requests are tagged in two ways:
- A `已压缩上行` / `Prompt compressed` badge in the dashboard (with `before`/`after` token counts)
- `compressed=true` in `traffic.json` with `before` (true count before compression) and `after` (true count after)

## Endpoints

| URL | Purpose |
|-----|---------|
| `http://127.0.0.1:8081/` | Token dashboard, **Chinese by default** (auto-refresh every 10s) |
| `http://127.0.0.1:8081/?lang=en` | Same dashboard in **English** |
| `http://127.0.0.1:8081/?lang=zh-CN` | Force Chinese |
| `http://127.0.0.1:8081/traffic.json` | Raw stats in JSON |
| `http://127.0.0.1:8081/v1/...` | Forwarded to the LLM API (counted) |
| `http://127.0.0.1:8081/__stats` | Statistics for dashboard (auth required) |
| `http://127.0.0.1:8081/__shutdown?key=qwen-proxy-stop` | Graceful shutdown endpoint |

Only forwarded API requests are counted. Visiting the dashboard itself does not add traffic.

## Dashboard Language

- **Default is Chinese** on every visit, regardless of the browser's `Accept-Language` header
- Click the button in the top-right corner of the page to switch: it shows `English` on hover
- Switching works by setting the `lang` query parameter and reloading. Because the page is server-rendered, the `?lang=` parameter is only read by the local dashboard routes (`/`, `/stats`, `/index.html`)
- All labels are translated, including card titles, table headers, the empty-state message, and status badges

## Token Generation Speed (v2.0)

The dashboard now displays token generation speed:

- **Per-request row**: Shows `tok/s` with mouse hover revealing the exact duration in milliseconds
- **Top card**: Shows "平均输出速度" / `Avg Output Speed` - weighted average across all requests (longer requests contribute more)
- **Note**: This speed is slightly lower than llama-server's `predicted_per_second` because it includes prefill time (processing your input tokens)

## Start

```bash
node traffic-proxy.js
```

Or use a custom port:

```bash
set PROXY_PORT=9000
node traffic-proxy.js
```

## Log Files

```
./traffic-stats/YYYY-MM-DD/traffic.json          # per-day stats (rolls over at midnight)
./.total-tokens-since-start.json                 # legacy lifetime counter (written but not shown on dashboard)
```

The dashboard's top card sums today's and yesterday's daily files (`shiftDate()` computes the previous day's file path).

## Statistics Fields

`traffic.json` contains:

- `totalTokens`, `promptTokens`, `completionTokens`, `cachedTokens`: token totals
- `requests`: number of requests
- `startTime`, `lastUpdate`: timestamps (UTC in JSON; rendered in Shanghai time on the page)
- `details`: array of per-request records (newest first), each with:
  - `time`, `method`, `path`, `status`
  - `hasUsage`: whether the response contained a `usage` field
  - `promptTokens`, `completionTokens`, `totalTokens`, `cachedTokens`
  - `promptContent`: the upstream prompt text (last user message), shown as "上行（提示词）"
  - `responseContent`: the downstream reply text, shown as "下行（回复内容）"
  - `stream`: whether the response was streamed
  - `durationMs`: request duration in milliseconds
  - `compressed`: whether the request was compressed (`true`/`false`)
  - `before`/`after`: token counts before/after compression (if compressed)
  - `exact`: whether true tokenizer counting was used (fallback to char estimation if tokenizer fails)
  - `userPatched`: whether a user message was appended (fixes "No user query" 500 error)

Content is parsed for readability rather than storing raw JSON: the last `user` message is extracted and shown as a summary.

**Note:** llama.cpp only reports `usage` for streamed responses when `stream_options.include_usage=true` is set in the request. Non-stream requests always report usage.

## Batched Writes & Graceful Shutdown

To avoid synchronous disk IO blocking request forwarding, writes are batched:

- Each request only marks the in-memory state dirty; a background timer flushes to disk every `SAVE_INTERVAL_MS` (default 5000ms)
- The dashboard always reads live in-memory data, so it updates instantly even before the disk write
- On exit the pending data is flushed via `SIGINT`, `SIGTERM`, `uncaughtException`, and a final `exit` hook
- `stop-proxy.bat` / `stop-all.bat` call a local `GET /__shutdown?key=qwen-proxy-stop` endpoint to trigger graceful shutdown
- The shutdown endpoint only accepts loopback requests with the correct key (403 otherwise)

## Stop

Press `Ctrl+C`, or run `stop-proxy.bat` / `stop-all.bat`. Pending data is saved automatically in both cases.

## Environment Variables

- `PROXY_PORT`: proxy listen port (default 8081)
- `SAVE_INTERVAL_MS`: batch disk-write interval in ms (default 5000)
- `SHUTDOWN_KEY`: key required by `/__shutdown` (default `qwen-proxy-stop`)
- `MODEL_CTX`: upstream context window size (default 131072)
- `OUTPUT_RESERVE`: output token reservation (default 8192)
- `CTX_BUDGET`: input budget = `MODEL_CTX - OUTPUT_RESERVE`
- `COMPRESS_TRIGGER`: true token count at which compression triggers (default: 70% of `CTX_BUDGET`)

## Troubleshooting

### 500 "No user query found in messages"

This error occurs when a request has no user message. The proxy now automatically appends a minimal user message to fix this.

- Is the proxy running? (`netstat -ano | findstr :8081`)
- Are there any requests in the dashboard?
- Check `traffic.json` for `userPatched=true` entries (indicates the fix worked)

### 400 "使用量已超出频率限制"

This indicates the request was too large. The proxy should have compressed it. If it still appears:

- Check if `compressed=true` in the dashboard
- Verify `COMPRESS_CONTEXT=1` is set
- Check if the upstream API key has rate limits

### Compression not triggering

If requests are not being compressed despite being large:

- Check `COMPRESS_TRIGGER` environment variable (should be ~70% of `CTX_BUDGET`)
- Verify `CTX_BUDGET` matches `MODEL_CTX - OUTPUT_RESERVE`
- Check `traffic.json` for `compressed=false` entries with high token counts

### Dashboard not updating

The dashboard reads from in-memory data, so it should update instantly. If not:

- Check browser console for errors
- Verify the proxy is running on port 8081
- Try hard refresh (Ctrl+F5)

## Known Issues

1. **Image token estimation**: Images are passed through without compression; upstream counts them. Large image requests may still approach the limit.
2. **Tool call arguments size**: Very large tool arguments may cause compression to drop entire tool rounds. This is by design to preserve pairing.
3. **Token speed includes prefill**: The displayed `tok/s` includes prefill time, so it's slightly lower than pure decoding speed.

## Changelog

### v2.0 (2026-11-20)

- **True tokenizer counting**: Replaces `chars/3.2` estimation with upstream `/tokenize` for accurate counts
- **Output reservation**: Input budget = `CTX_BUDGET - OUTPUT_RESERVE`
- **70% waterline**: Triggers compression at 70% of budget, not 100%
- **Tool call protection**: Never text-truncate `tool_calls[].function.arguments`
- **No user message fallback**: Appends minimal user message if missing (fixes 500 error)
- **Drop history with pairing**: Maintains `tool` ↔ `assistant(tool_calls)` pairing
- **Token speed display**: Per-request `tok/s` and dashboard average
- **Bug fixes**: Three 500 errors (#1: 400 超限，#2: 参数解析，#3: 模板异常)

### v1.x

- Initial release with context compression and dashboard
