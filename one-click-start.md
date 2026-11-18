# One-Click Launcher

## Overview

`one-click-start.bat` starts the whole stack with a single double-click:

1. **Environment check**
   - Node.js and Windows PowerShell
   - Required files: `qwen-deploy.ps1`, `traffic-proxy.js`

2. **Model service on port 8080**
   - If already running, it is reused (no duplicate start)
   - Otherwise `qwen-deploy.ps1 -Background` is called, which downloads the runtime/model on first run and waits until the service is ready
   - Vision support is auto-detected: when a `mmproj-*.gguf` file sits next to the model, the deploy script adds `--mmproj` automatically, so the model can read images

3. **Token dashboard on port 8081**
   - If already running, it is reused
   - Otherwise `traffic-proxy.js` is started in the background
   - The dashboard opens in your browser automatically

No manual `start-qwen.bat` step is needed any more.

## Usage

**Start everything:**
```bat
one-click-start.bat
```

**Stop everything:**
```bat
stop-all.bat
```

**Stop only the proxy (keep the model running):**
```bat
stop-proxy.bat
```

## What you get

| Address | Purpose |
|---------|---------|
| `http://127.0.0.1:8081/` | Token dashboard (per-request input/output/total tokens, prompt & reply text) |
| `http://127.0.0.1:8081/traffic.json` | Raw statistics in JSON (UTC timestamps) |
| `http://127.0.0.1:8080/v1` | OpenAI-compatible model API |

To have tokens counted, point your client at **port 8081**, not 8080. Direct calls to 8080 bypass the proxy and cannot be measured.

## Log directory

Per-day statistics are written to:
```
./traffic-stats/YYYY-MM-DD/traffic.json
```

Data is loaded from disk on start, so restarting never resets the counters.

## Notes

- The launcher window can be closed; both services keep running in the background.
- `start-qwen.bat -Stop` / `-Status` still work for advanced model control.
- Do not pass `-Force` to the deploy script for a normal restart: it forces a full re-download of the runtime.
