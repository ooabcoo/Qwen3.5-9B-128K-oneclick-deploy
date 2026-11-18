@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Qwen One-Click Launcher

echo ========================================
echo   One-Click Launcher
echo   Model Service + Vision + Token Stats
echo ========================================
echo.

rem Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :NO_NODE

rem Check PowerShell
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 goto :NO_PS

set "SCRIPT_DIR=%~dp0"

rem Check required files
if not exist "%SCRIPT_DIR%qwen-deploy.ps1" goto :NO_DEPLOY
if not exist "%SCRIPT_DIR%traffic-proxy.js" goto :NO_PROXY

echo [OK] Environment check passed
echo.

rem ------------------------------------------------------- Step 1: model service
echo ========================================
echo   [1/2] Model Service   port 8080
echo ========================================
echo.

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 goto :MODEL_READY

echo [i] Model service is not running. Starting it now...
echo [i] Vision support is auto-detected from the mmproj file.
echo [i] First run downloads the runtime and model. Please wait.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%qwen-deploy.ps1" -Background -NoBrowser
if %ERRORLEVEL% NEQ 0 goto :MODEL_FAIL

netstat -ano | findstr ":8080" | findstr "LISTENING" >nul
if %ERRORLEVEL% NEQ 0 goto :MODEL_FAIL

:MODEL_READY
echo [OK] Model service is listening on port 8080
echo.

rem ------------------------------------------------------- Step 2: token dashboard proxy
echo ========================================
echo   [2/2] Token Dashboard   port 8081
echo ========================================
echo.

netstat -ano | findstr ":8081" | findstr "LISTENING" >nul
if %ERRORLEVEL% EQU 0 goto :PROXY_READY

start "Token-Proxy" /B node "%SCRIPT_DIR%traffic-proxy.js"
echo [OK] Token proxy started
goto :PROXY_DONE

:PROXY_READY
echo [OK] Token proxy is already running on port 8081

:PROXY_DONE
echo.

rem ------------------------------------------------------- Done
echo ========================================
echo   Launch Complete
echo ========================================
echo.
echo [i] Dashboard : http://127.0.0.1:8081/
echo [i] Model API : http://127.0.0.1:8080/v1
echo [i] Vision    : on when a mmproj file is present
echo [i] Log dir   : %SCRIPT_DIR%traffic-stats
echo.
echo [i] Opening the dashboard in your browser...
start "" "http://127.0.0.1:8081/"
echo.
echo [i] This window stays open. Closing it will NOT stop the services.
echo [i] To stop everything, run stop-all.bat
echo.
pause >nul
exit /b 0

rem ------------------------------------------------------- Error handlers
:NO_NODE
echo [X] Node.js is not installed.
echo     Download it from https://nodejs.org/
goto :FAIL

:NO_PS
echo [X] Windows PowerShell is not installed.
goto :FAIL

:NO_DEPLOY
echo [X] qwen-deploy.ps1 was not found next to this script.
goto :FAIL

:NO_PROXY
echo [X] traffic-proxy.js was not found next to this script.
goto :FAIL

:MODEL_FAIL
echo.
echo [X] Model service failed to start on port 8080.
echo     Check the log under llama.cpp\logs\
goto :FAIL

:FAIL
echo.
echo [i] Press any key to close this window.
pause >nul
exit /b 1
