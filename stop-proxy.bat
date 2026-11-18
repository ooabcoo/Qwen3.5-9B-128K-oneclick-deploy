@echo off
chcp 65001 >nul

echo ========================================
echo   Stop Token Proxy
echo ========================================
echo.

echo [i] Searching for the process on port 8081...
set "FOUND=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%P >nul 2>&1
    if not ERRORLEVEL 1 (
        echo [OK] Stopped proxy process  PID %%P
        set "FOUND=1"
    )
)

if "%FOUND%"=="0" echo [i] No proxy found on port 8081
echo.
echo [i] The model service on port 8080 is left running.
echo [i] To stop everything, run stop-all.bat instead.
echo.
pause >nul
