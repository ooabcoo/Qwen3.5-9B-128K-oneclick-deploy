# Token Usage Proxy

## Overview

- Forwards all requests to `http://127.0.0.1:8080/`
- Reads real token counts from the API response `usage` field (not estimated from bytes)
- Handles both non-stream (JSON) and stream (SSE `data:` chunks) responses
- Auto-injects `stream_options.include_usage=true` into streamed chat requests so usage is reported even when the client (e.g. a browser WebUI) omits it
- Creates a new log file every day; data survives restarts
- Chinese dashboard at `http://127.0.0.1:8081/`

## Endpoints

| URL | Purpose |
|-----|---------|
| `http://127.0.0.1:8081/` | Token dashboard in Chinese (auto-refresh every 10s) |
| `http://127.0.0.1:8081/traffic.json` | Raw stats in JSON |
| `http://127.0.0.1:8081/v1/...` | Forwarded to the LLM API (counted) |

Only forwarded API requests are counted. Visiting the dashboard itself does not add traffic.

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
./traffic-stats/YYYY-MM-DD/traffic.json
```

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
  - `durationMs`

Content is parsed for readability rather than storing raw JSON: the last `user` message is taken from the request, and `choices[0].message.content` (or `reasoning_content` / SSE `delta.content` chunks) from the response. The dashboard truncates long text at 120 chars; hover a cell to see the full value.

Rows that report neither usage nor any prompt/reply text (e.g. `/v1/models`, health checks) are hidden from the dashboard table. Requests without `usage` show "-" in the token columns and do NOT add to token totals. Up to 2000 most-recent requests are kept.

**Note:** llama.cpp only reports `usage` for streamed responses when `stream_options.include_usage=true` is set. The proxy injects this automatically for streamed `chat/completions`, so no client change is needed. For non-proxy direct calls to port 8080, the client must send the option itself.

## Stop

Press `Ctrl+C` - the latest data is saved automatically.

## Environment Variables

- `PROXY_PORT`: proxy listen port (default 8081)
