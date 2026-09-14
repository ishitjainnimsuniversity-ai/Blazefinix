@echo off
echo =========================================================================
echo Starting Hybrid Classical-Quantum Clinical AI Platform
echo =========================================================================
echo.

:: Start FastAPI Backend in Background
echo [1/2] Starting Python FastAPI Backend on http://localhost:8000 ...
start "Clinical QML Backend" cmd /k "python -m uvicorn app.backend.main:app --host 0.0.0.0 --port 8000"

:: Wait 3 seconds for backend initialization
timeout /t 3 /nobreak >nul

:: Start Vite React Frontend
echo [2/2] Starting Vite Frontend on http://localhost:3000 ...
cd app\frontend
start "Clinical QML Frontend" cmd /k "npm run dev"

echo.
echo =========================================================================
echo Platform successfully launched!
echo Backend API & Docs: http://localhost:8000/docs
echo Frontend Dashboard: http://localhost:3000
echo =========================================================================
pause
