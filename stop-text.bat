@echo off
REM ============================================================
REM  停止纯文本模式服务
REM ============================================================

echo [*] Stopping services...

REM 停止 8081 代理
for /f "tokens=5" %%i in ('netstat -a ^| findstr ":8081.*LISTENING"') do (
    for /f "tokens=3" %%j in ("%%i") do (
        set "PID=%%j"
    )
)
if defined PID (
    taskkill /F /PID %PID% 2>nul
    echo [OK] Stopped proxy on port 8081
) else (
    echo [!] No proxy found on port 8081
)

REM 停止 8080 模型服务
call "%~dp0stop-all.bat" -Stop

echo.
echo [OK] All services stopped
echo.
pause
