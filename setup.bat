@echo off
echo ====================================
echo AdViewer - Installation Script
echo ====================================
echo.

echo [1/3] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [2/3] Checking environment file...
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
)
echo.

echo [3/3] Setup complete!
echo.
echo ====================================
echo Next steps:
echo ====================================
echo 1. Edit .env file and update SECRET_KEY and JWT_SECRET_KEY
echo 2. (Optional) Add Google OAuth credentials to .env
echo 3. Run: python app.py
echo.
echo The app will be available at: http://localhost:5000
echo ====================================
pause
