@echo off
chcp 65001 >nul
echo ========================================
echo GLM-4.1V-9B-Thinking Deployment
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.8+
    pause
    exit /b 1
)
echo Python found!

echo.
echo Creating virtual environment...
call python -m venv glm_env
if errorlevel 1 (
    echo Failed to create virtual environment
    pause
    exit /b 1
)
echo Virtual environment created!

echo.
echo Activating virtual environment...
call glm_env\Scripts\activate.bat

echo Installing dependencies...
echo.

call glm_env\Scripts\pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
call glm_env\Scripts\pip install transformers accelerate huggingface_hub

echo.
echo Dependencies installed!

echo.
echo Downloading model...
call glm_env\Scripts\pip install huggingface-hub --quiet
call glm_env\Scripts\python -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='THUDM/GLM-4.1V-9B-Thinking', filename='model.safetensors', local_dir='E:/glm-4-1v-9b-thinking')"

echo.
echo ========================================
echo Deployment completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run example: .\glm_env\Scripts\python GLM-4.1V-9B-Thinking-示例代码.py
echo.
pause
