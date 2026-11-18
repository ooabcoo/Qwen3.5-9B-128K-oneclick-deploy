@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Stop All Services
echo ========================================
echo.

rem ------------------------------------------------------- Stop token proxy on 8081
echo [i] Stopping token proxy on port 8081...
set "PROXY_FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%P >nul 2>&1
    if not ERRORLEVEL 1 (
        echo [OK] Stopped proxy  PID %%P
        set "PROXY_FOUND=1"
    )
)
if "%PROXY_FOUND%"=="0" echo [i] No proxy running on port 8081
echo.

rem ------------------------------------------------------- Stop model service via deploy script
echo [i] Stopping model service on port 8080...
if not exist "%~dp0qwen-deploy.ps1" goto :NO_DEPLOY
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0qwen-deploy.ps1" -Stop
if %ERRORLEVEL% NEQ 0 goto :STOP_WARN
echo [OK] Model service stop command completed
goto :DONE

:NO_DEPLOY
echo [W] qwen-deploy.ps1 not found. Kill port 8080 manually if still running.
goto :DONE

:STOP_WARN
echo [W] Model stop returned an error. It may already be stopped.

:DONE
echo.
echo ========================================
echo   All services stopped
echo ========================================
echo.
echo [i] Restart anytime with one-click-start.bat
echo.
pause >nul
