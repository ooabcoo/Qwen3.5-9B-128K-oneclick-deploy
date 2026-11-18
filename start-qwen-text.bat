@echo off
REM ============================================================
REM  Qwen3.5-9B 纯文本模式一键启动器
REM ============================================================
REM 本程序启动不带视觉能力的 Qwen 模型服务
REM 适用于只需要文本对话的场景，节省内存和加载时间

REM 检查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] Node.js is not installed or not in PATH
    echo [!] Please install Node.js and restart this window
    pause
    exit /b 1
)

REM 检查 PowerShell
powershell -Command "$null = [System.Management.Automation.PowerShell]::GetCommand('Invoke-WebRequest') 2>$null"
if errorlevel 1 (
    echo [!] PowerShell is not available
    pause
    exit /b 1
)

REM 检查必要文件
if not exist "qwen-deploy.ps1" (
    echo [!] qwen-deploy.ps1 not found
    pause
    exit /b 1
)

if not exist "traffic-proxy.js" (
    echo [!] traffic-proxy.js not found
    pause
    exit /b 1
)

REM 检查 8080 端口
for /f "tokens=5" %%i in ('netstat -a ^| findstr ":8080.*LISTENING"') do (
    set "PORT8080=1"
)
if defined PORT8080 (
    echo [OK] Model service is already running on port 8080
) else (
    echo [*] Starting Qwen service (port 8080) in background...
    powershell -ExecutionPolicy Bypass -File "%~dp0qwen-deploy.ps1" -Background -MMProj "" -NoBrowser
    timeout /t 10 /nobreak >nul
)

REM 检查 8081 端口
for /f "tokens=5" %%i in ('netstat -a ^| findstr ":8081.*LISTENING"') do (
    set "PORT8081=1"
)
if defined PORT8081 (
    echo [OK] Token proxy is already running on port 8081
) else (
    echo [*] Starting Token Dashboard...
    cd /d "%~dp0"
    node traffic-proxy.js
)

REM 打开统计页面
start http://127.0.0.1:8081/

echo.
echo ============================================================
echo   Qwen3.5-9B Text-Only Mode Ready
echo ============================================================
echo   Token Dashboard : http://127.0.0.1:8081/
echo   Model API       : http://127.0.0.1:8080/v1
echo   Stop All        : stop-all.bat
echo ============================================================
echo.

echo [i] Services are running in the background.
echo [i] Closing this window will NOT stop the services.
echo [i] To stop everything, run stop-all.bat
echo.

REM 保持窗口打开
timeout /t 0 /nobreak >nul
