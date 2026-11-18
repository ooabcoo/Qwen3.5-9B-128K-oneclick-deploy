# Launcher Tools

## Quick Start

```bat
one-click-start.bat   :: start model (with vision) + token dashboard
stop-all.bat          :: stop both
```

That is the whole daily workflow. The first run downloads the runtime and model (10-20 min); later runs start in seconds.

## Tool Overview

### 1. one-click-start.bat  -  One-Click Launcher (recommended)
Starts the complete stack in one double-click:

- Checks environment (Node.js, PowerShell, required files)
- Model service on port 8080: reuses it if running, otherwise starts it via `qwen-deploy.ps1 -Background` and waits until ready
- Vision is auto-enabled when a `mmproj-*.gguf` file is present next to the model
- Token dashboard on port 8081: reuses it if running, otherwise starts `traffic-proxy.js`
- Opens the dashboard in the browser

### 2. stop-all.bat  -  Stop Everything
- Stops the proxy by finding the process listening on port 8081
- Stops the model service via `qwen-deploy.ps1 -Stop`

### 3. stop-proxy.bat  -  Stop Proxy Only
- Stops just the token proxy on port 8081
- Leaves the model service on 8080 running

### 4. start-qwen.bat  -  Model Service Direct Control
- Advanced control of the model service only
- `start-qwen.bat`              - start with `-Background -ApiTest`
- `start-qwen.bat -Stop`        - stop the model
- `start-qwen.bat -Status`      - check status
- Not needed for normal use; `one-click-start.bat` covers it

## View Token Statistics

Open in a browser:
```
http://127.0.0.1:8081/
```

Raw JSON:
```
http://127.0.0.1:8081/traffic.json
```

Daily files on disk:
```
./traffic-stats/YYYY-MM-DD/traffic.json
```

## Port Information

| Service | Port | Purpose |
|---------|------|---------|
| Token dashboard | 8081 | Proxy + per-request token stats (client connects here) |
| Qwen model | 8080 | Local LLM API (OpenAI-compatible) |

## File Structure

```
./
├── one-click-start.bat      # One-click launcher (recommended)
├── stop-all.bat             # Stop both services
├── stop-proxy.bat           # Stop proxy only
├── start-qwen.bat           # Model service direct control
├── qwen-deploy.ps1          # Model deploy/start script (vision auto-detect)
├── traffic-proxy.js         # Token statistics proxy
├── traffic-proxy.md         # Proxy documentation
├── one-click-start.md       # Launcher documentation
├── README-START.md          # This file
├── api-key.txt              # API key
└── traffic-stats/           # Daily statistics
    └── YYYY-MM-DD/
        └── traffic.json
```

## Troubleshooting

### Dashboard shows "-" for tokens
The response had no `usage` field. The proxy auto-injects `stream_options.include_usage` for streamed chat requests, so browsers work too. Direct calls to port 8080 bypass the proxy and are never counted.

### Vision not working / "image input is not supported"
Make sure `llama.cpp/models/mmproj-F16.gguf` exists. The deploy script auto-detects `mmproj-*.gguf` and adds `--mmproj`. Check the server log under `llama.cpp/logs/` for `loaded multimodal model`.

### Model service fails to start
Check the log under `llama.cpp/logs/`. Do not use `-Force` for a normal restart; it re-downloads the whole runtime.

### Port already in use
Run `stop-all.bat`, then start again.

### Environment variable error on start
`qwen-deploy.ps1` already removes duplicate uppercase proxy variables (`HTTPS_PROXY` etc.) at startup. If you still see "item already added", close the terminal and start from a fresh window.
