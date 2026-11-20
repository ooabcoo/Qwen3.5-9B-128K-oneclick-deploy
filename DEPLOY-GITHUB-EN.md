# Qwen3.5-9B 128K Local Deployment - GitHub Deployment Guide

> This guide is for users pulling from GitHub, detailing the complete process of deployment and usage from scratch.

---

## Table of Contents

- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Configuration Guide](#configuration-guide)
- [Usage Guide](#usage-guide)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## System Requirements

### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **GPU** | NVIDIA GTX 1060 (6GB) | NVIDIA RTX 3060 or higher (12GB+) |
| **VRAM** | 6 GB | 12 GB+ |
| **CPU** | Intel i5 / AMD Ryzen 5 | Intel i7 / AMD Ryzen 7 |
| **RAM** | 16 GB | 32 GB+ |
| **Disk** | 10 GB free space | 50 GB+ SSD |

### Software Requirements

- **OS**: Windows 10/11 (64-bit)
- **Node.js**: v18+ (for token proxy)
- **PowerShell**: Windows PowerShell 5.1+
- **CUDA**: Driver auto-installed (via script)

---

## Quick Start

### Step 1: Clone Repository

```bash
git clone https://github.com/ooabcoo/Qwen3.5-9B-128K-oneclick-deepseek-main.git
cd Qwen3.5-9B-128K-oneclick-deepseek-main
```

### Step 2: First Launch (Auto-download Environment + Model)

**Method A: Double-click to launch (Recommended for beginners)**

```bash
# Full version (with vision recognition)
start-qwen.bat

# Or light version (text-only, faster startup)
start-qwen-text.bat
```

**Method B: Command line launch**

```powershell
# Background launch (recommended for first time)
.\qwen-deploy.ps1 -Background

# Foreground launch (view detailed progress)
.\qwen-deploy.ps1
```

### Step 3: Wait for Download

First launch will automatically:
1. Download llama.cpp runtime (~550MB)
2. Download model files (~5.6GB)
3. Auto-configure CUDA environment
4. Start the service

**Progress indicator**: Window will show download progress. Please wait patiently.

### Step 4: Verify Service

After startup, the browser will automatically open the dashboard:
- **Dashboard**: http://127.0.0.1:8081/
- **API**: http://127.0.0.1:8080/v1

If not auto-opened, manually visit the above addresses.

### Step 5: Test API

```powershell
# Use PowerShell to test
powershell -ExecutionPolicy Bypass -File qwen-deploy.ps1 -ApiTest
```

Expected output:
```
[OK] API test passed: 200 OK
```

---

## Detailed Deployment Steps

### Pre-deployment Check

#### 1. Check Environment

```powershell
# Check Node.js
node --version

# Check PowerShell
powershell --version

# Check CUDA
nvidia-smi
```

#### 2. Check Disk Space

```powershell
# Ensure at least 10GB free space
Get-Volume | Where-Object { $_.DriveLetter -eq 'C:' } | Select-Object FileSystemLabel,Size,Used,Free
```

#### 3. Choose Deployment Directory

**Important**: Do not deploy to read-only locations (e.g., C:\, Program Files).

Recommended directories:
- `E:\Qwen\Qwen3.5-9B-128K-oneclick-deepseek-main\`
- `D:\models\Qwen\`

### First Deployment Process

#### Method 1: Use One-click Script (Recommended)

```bash
# Enter project directory
cd Qwen3.5-9B-128K-oneclick-deepseek-main

# Run startup script
start-qwen.bat
```

The script will automatically:
1. Check environment (Node.js, PowerShell, core files)
2. Download llama.cpp runtime (if not exists)
3. Download model files (if not exists)
4. Configure CUDA environment
5. Start model service (port 8080)
6. Start token proxy (port 8081)
7. Auto-open dashboard browser

#### Method 2: Use PowerShell Script

```powershell
# Background launch (recommended, won't block command line)
.\qwen-deploy.ps1 -Background

# Foreground launch (view detailed logs)
.\qwen-deploy.ps1

# Launch with parameters
.\qwen-deploy.ps1 -Background -Ctx 98304 -Tools read_file,grep_search
```

### Deployment Parameter Guide

#### Core Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Background` | False | Background launch, won't block CLI |
| `-NoBrowser` | False | Don't auto-open browser |
| `-ApiTest` | False | Auto-test API after launch |
| `-Status` | - | Check service status |
| `-Stop` | - | Stop service |

#### Model Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Model` | `unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL` | Model repository address |
| `-ModelPath` | `` | Local model path (skip download if used) |
| `-Ctx` | `131072` | Context window size (128K) |
| `-Cuda` | `cuda-13.4` | CUDA version (cuda-12.4 or cuda-13.4) |

#### Tool Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-Tools` | `read_file,file_glob_search,grep_search,get_info` | Enabled tool list |
| `-Listen` | `127.0.0.1` | Listen address (local or 0.0.0.0) |

#### Vision Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `-MMProj` | Auto-detect | Vision projector file path |

### Launch Mode Comparison

| Mode | Startup Time | VRAM Usage | Use Case |
|------|--------------|------------|----------|
| **Full Mode** (`start-qwen.bat`) | ~6 min | ~6.5GB | Vision recognition needed |
| **Text Mode** (`start-qwen-text.bat`) | ~4.5 min | ~5.6GB | Pure text tasks |

---

## Configuration Guide

### Modify Context Window Size

#### Method 1: Edit Deployment Script

Edit line 70 in `qwen-deploy.ps1`:

```powershell
[int]$Ctx = 98304  # Change to 96K or 65536
```

#### Method 2: Specify at Launch

```powershell
.\qwen-deploy.ps1 -Ctx 98304
```

#### Synchronize Proxy Configuration

After modifying model context window, **must** also modify proxy environment variables:

```bat
# Set before launching proxy
set MODEL_CTX=98304
set OUTPUT_RESERVE=8192
set CTX_BUDGET=90112
set COMPRESS_TRIGGER=63078
one-click-start.bat
```

### Modify API Key

Edit `api-key.txt`:

```
sk-178212e1b4a88d12xhajde052356647hp
```

**Security Warning**: Do not upload custom keys to GitHub!

### Modify Listen Address (LAN Access)

Default only listens on localhost (127.0.0.1). For LAN access:

```powershell
.\qwen-deploy.ps1 -Listen 0.0.0.0
```

**Firewall Configuration**:
1. Allow ports 8080 and 8081 through firewall
2. Restrict to local network only

### Enable/Disable Tools

#### Enable All Tools (Trusted Environment Only)

```powershell
.\qwen-deploy.ps1 -Tools all
```

#### Disable All Tools

```powershell
.\qwen-deploy.ps1 -Tools ''
```

#### Custom Tool List

```powershell
.\qwen-deploy.ps1 -Tools read_file,grep_search
```

**Available Tools**:
- `read_file` - Read file
- `file_glob_search` - File glob search
- `grep_search` - Content search
- `get_info` - Get file info
- `write_file` - Write file (DANGEROUS!)
- `edit_file` - Edit file (DANGEROUS!)
- `exec_shell_command` - Execute shell command (DANGEROUS!)

---

## Usage Guide

### Using Dashboard

1. Visit http://127.0.0.1:8081/
2. Enter your prompt in the input box
3. Click Send
4. View token statistics

### Using API

#### Basic Request

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "Hello"}
    ],
    "max_tokens": 100
  }'
```

#### Using Tools

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "Search .md files in current directory"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "grep_search",
          "parameters": {
            "type": "object",
            "properties": {
              "pattern": {"type": "string"},
              "path": {"type": "string"}
            },
            "required": ["pattern", "path"]
          }
        }
      }
    ]
  }'
```

#### Vision Recognition

```bash
curl http://127.0.0.1:8080/v1/chat/completions ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer sk-your-key" ^
  -d '{
    "model": "qwen3.5-9b",
    "messages": [
      {"role": "user", "content": "<image>Analyze this image</image>"}
    ],
    "max_tokens": 200
  }'
```

### Token Statistics

Visit http://127.0.0.1:8081/ to view:

- **Today's Stats**: Total tokens used today
- **Request List**: Detailed info for each request
- **Compression Logs**: Requests that were compressed
- **Token Speed**: Real-time output speed

### Viewing Logs

- **Service Logs**: `llama.cpp/logs/`
- **Proxy Stats**: `traffic-stats/YYYY-MM-DD/traffic.json`
- **Runtime Logs**: `llama.cpp/logs/run-YYYYMMDD-HHMMSS.log`

---

## Troubleshooting

### Issue 1: Download Stuck or Failed

**Symptom**: Window shows "Downloading..." but no progress after 15 minutes

**Solution**:

1. Check network connection
2. Check if firewall is blocking download
3. Manually download model:
   ```powershell
   # Stop background service
   taskkill /F /IM node.exe /FI "WINDOWTITLE eq traffic-proxy*"
   taskkill /F /IM llama-server.exe
   
   # Manual download
   Invoke-WebRequest -Uri "https://huggingface.co/unsloth/Qwen3.5-9B-GGUF/resolve/main/Qwen3.5-9B-UD-Q4_K_XL.gguf" -OutFile ".\llama.cpp\models\Qwen3.5-9B-UD-Q4_K_XL.gguf"
   ```

4. Retry after clearing cache

### Issue 2: Service Exits Immediately

**Symptom**: Window flashes and closes

**Solution**:

1. Check logs in `llama.cpp/logs/server-*.log`
2. Verify sufficient disk space
3. Run as administrator if permission issues

### Issue 3: API Returns 401 Error

**Symptom**: `Authorization: Bearer xxx` fails

**Solution**:

1. Check if `api-key.txt` exists
2. Verify API key is correct
3. Use correct key in curl request

### Issue 4: Dashboard Not Updating

**Symptom**: Statistics numbers don't change

**Solution**:

1. Check if proxy is running: `netstat -ano | findstr :8081`
2. Hard refresh browser (Ctrl+F5)
3. Check browser console for errors

### Issue 5: Vision Recognition Not Working

**Symptom**: Model cannot recognize uploaded images

**Solution**:

1. Check if `mmproj-*.gguf` file exists in model directory
2. Explicitly specify vision projector:
   ```powershell
   .\qwen-deploy.ps1 -MMProj .\llama.cpp\models\mmproj-F16.gguf
   ```
3. Check startup logs for mmproj loading info

### Issue 6: Context Compression Not Triggered

**Symptom**: Long conversations not compressed, resulting in 400 errors

**Solution**:

1. Check if proxy is running: `netstat -ano | findstr :8081`
2. Look for "Compressed" badge on dashboard
3. Check compression logs in `traffic-stats/` directory
4. Check proxy logs: `node traffic-proxy.js 2>&1 | findstr [compress]`

### Issue 7: 500 Error

**Symptom**: Request returns 500 error

**Solution**:

1. Check dashboard error message
2. Check proxy logs in `traffic-stats/` directory
3. Restart proxy service:
   ```bash
   stop-proxy.bat
   # Then restart
   node traffic-proxy.js
   ```

---

## FAQ

### Q1: How long does first launch take?

**A**: First launch takes:
- Download environment: ~5 minutes (550MB)
- Download model: ~10 minutes (5.6GB, depends on network)
- Total: ~15 minutes

Subsequent launches only start the service (~1 minute).

### Q2: Can I download only the model, not the runtime?

**A**: Yes, but you need to download the runtime manually:

```powershell
# Download runtime
Invoke-WebRequest -Uri "https://github.com/ggml-org/llama.cpp/releases/download/b11669/llama-server-windows-cuda-13.4.zip" -OutFile ".\llama.cpp\llama-server-windows-cuda-13.4.zip"

# Extract to llama.cpp directory
Expand-Archive .\llama.cpp\llama-server-windows-cuda-13.4.zip -DestinationPath .\llama.cpp
```

### Q3: How to switch between different GPUs?

**A**: Modify line 76 in `qwen-deploy.ps1`:

```powershell
[string]$Cuda = 'cuda-12.4'  # or 'cuda-13.4'
```

### Q4: Model exists, why is it downloading again?

**A**: This is normal behavior. The script checks if the model file exists:

```powershell
if (Test-Path $ModelFile) {
    # Model exists, skip download
} else {
    # Model doesn't exist, start download
}
```

If still showing download, check the model file path is correct.

### Q5: How to view the current model being used?

**A**: Visit dashboard homepage, or run:

```powershell
.\qwen-deploy.ps1 -Status
```

### Q6: Can I customize the model?

**A**: Yes, modify line 65 in `qwen-deploy.ps1`:

```powershell
[string]$Model = 'your-model-huggingface:tag'
```

Or use local model:

```powershell
.\qwen-deploy.ps1 -ModelPath "E:\models\my-model.gguf"
```

### Q7: How to backup and migrate?

**A**: 

**Backup**:
```powershell
# Copy entire project directory
Copy-Item -Path "E:\Qwen" -Destination "E:\Qwen-Backup" -Recurse
```

**Migrate**:
```powershell
# In new machine, extract backup
Copy-Item -Path "E:\Qwen-Backup" -Destination "E:\Qwen" -Recurse

# Launch
cd E:\Qwen
start-qwen.bat
```

### Q8: Can I change model precision?

**A**: Yes, modify line 65 in `qwen-deploy.ps1`:

```powershell
# Q4_K_XL - Recommended (balance speed and precision)
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:UD-Q4_K_XL'

# Q8_0 - Highest precision, high VRAM usage
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:Q8_0'

# Q2_K - Fastest, lower precision
[string]$Model = 'unsloth/Qwen3.5-9B-GGUF:Q2_K'
```

### Q9: How to disable token statistics?

**A**: Stop proxy service:

```bash
stop-proxy.bat
```

### Q10: Can I change Dashboard language?

**A**: Yes, add parameter when visiting:

- English: http://127.0.0.1:8081/?lang=en
- Chinese: http://127.0.0.1:8081/?lang=zh-CN

---

## Performance Optimization

### 1. Reduce Startup Time

Use text mode (text-only):

```bash
start-qwen-text.bat
```

### 2. Reduce VRAM Usage

- Use smaller model precision (Q2_K, Q3_K)
- Reduce context window size (`-Ctx 98304`)

### 3. Improve Inference Speed

- Use CUDA 13.4 (if supported)
- Enable quantization (Q4_K_XL recommended)

### 4. Reduce Download Time

- Use high-speed network
- Consider using domestic mirror source

---

## Security Recommendations

1. **API Key**: Do not upload custom keys to GitHub
2. **Tool Permissions**: Only enable needed tools, don't enable `write_file`, `exec_shell_command`
3. **Network Access**: Allow only local access (127.0.0.1), don't expose to public internet
4. **Permission Control**: Run as regular user, don't use administrator privileges

---

## Update Log

- **2026-11-20 (v2.0)**: 
  - Major upgrade to context compression mechanism
  - Real tokenizer for precise counting
  - Solves estimation error for Chinese + code mixed requests
  - Output reservation with post-compression review
  - Token generation speed display

- **2025-08-17 (v1.0)**: 
  - Initial release
  - One-click deployment
  - Token statistics dashboard

---

## Support

- View `README.md` for detailed documentation
- View `.github/RELEASE_NOTES.md` for update history
- Check `traffic-stats/` directory for request statistics
- Check `llama.cpp/logs/` for service logs

---

**Version**: v2.0  
**Last Updated**: 2026-11-20  
**Maintained by**: Qwen Community
