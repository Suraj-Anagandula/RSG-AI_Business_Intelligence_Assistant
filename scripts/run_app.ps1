Set-Location -Path (Resolve-Path "$PSScriptRoot\..").Path

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting AI Business Intelligence Assistant" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "[1/2] Starting FastAPI Backend on port 8000..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "set PYTHONPATH=backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/2] Starting React Frontend on port 5173..." -ForegroundColor Green
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "cd frontend && npm run dev"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Application is running!" -ForegroundColor Yellow
Write-Host " - Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host " - Backend API: http://localhost:8000" -ForegroundColor Yellow
Write-Host " - Swagger Docs: http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

