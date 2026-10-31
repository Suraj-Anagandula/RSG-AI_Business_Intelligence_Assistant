#!/bin/bash
# Convenient runner script to start Database, Backend, and Frontend

PROJECT_DIR="/home/user/suraj_project"
cd "$PROJECT_DIR" || exit 1

echo "=========================================="
echo " Starting AI Business Intelligence Assistant"
echo "=========================================="

# 1. Start PostgreSQL
echo "[1/3] Ensuring PostgreSQL is running..."
bash "$PROJECT_DIR/scripts/start_postgres.sh"

# 2. Start Backend
echo "[2/3] Starting FastAPI Backend on port 8000..."
source "$PROJECT_DIR/venv/bin/activate"
export PYTHONPATH="$PROJECT_DIR/backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "Backend running with PID: $BACKEND_PID"

# 3. Start Frontend
echo "[3/3] Starting React Frontend on port 5173..."
cd "$PROJECT_DIR/frontend" || exit 1
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!
echo "Frontend running with PID: $FRONTEND_PID"

echo "=========================================="
echo " Application is running!"
echo " - Frontend: http://localhost:5173"
echo " - Backend API: http://localhost:8000"
echo " - Swagger Docs: http://localhost:8000/docs"
echo " Press CTRL+C to terminate all processes."
echo "=========================================="

trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT SIGTERM
wait

