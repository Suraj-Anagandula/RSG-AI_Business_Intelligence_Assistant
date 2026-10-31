@echo off
cd /d "%~dp0\.."
echo ==========================================
echo  Starting AI Business Intelligence Assistant
echo ==========================================

echo [1/2] Starting FastAPI Backend on port 8000...
start "BI Assistant Backend" cmd /k "set PYTHONPATH=backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Frontend on port 5173...
start "BI Assistant Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo  Application is running!
echo  - Frontend: http://localhost:5173
echo  - Backend API: http://localhost:8000
echo  - Swagger Docs: http://localhost:8000/docs
echo ==========================================

