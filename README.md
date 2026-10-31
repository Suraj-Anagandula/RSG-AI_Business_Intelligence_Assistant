# AI Business Intelligence Assistant

An AI-powered Business Intelligence (BI) application that allows business users to query sales data using natural language and receive verified answers backed by database execution.

Built strictly according to the **GET AI-Assisted Development Challenge** specifications.

---

## Key Features

1. **Natural Language Querying**:
   - Ask questions like *"What is the total revenue?"*, *"Which product generated the highest revenue?"*, or custom inquiries like *"What is the average discount amount?"*.
2. **Vectorless RAG Architecture**:
   - Tabular metadata and schema grounding convert user questions into exact SQL queries executed directly against PostgreSQL, avoiding arithmetic hallucinations common in traditional vector embeddings.
3. **Safety & Guardrails**:
   - Multi-layer SQL safety validator disallows destructive operations (`DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`), prevents multi-statement injections, and whitelists table access to `sales_records`.
4. **Deterministic & AI Hybrid Execution**:
   - Instant zero-latency responses for standard core business questions, with fallback to Google Gemini (`gemini-3.5-flash-lite`) for custom natural language queries.
5. **Interactive React UI**:
   - Real-time KPI summary cards.
   - Quick-click preset chips for the 5 assignment questions.
   - Expandable SQL query viewer and execution telemetry badge (latency and engine type).
   - Monthly revenue bar chart visualizer.
   - Supporting data table with 1-click **Export to CSV**.
   - 1-click **Upload & Database Ingestion** for new CSV files.
6. **Robust Testing**:
   - 13 automated Pytest test cases covering ground truth validation, edge cases, out-of-scope queries, and security injections.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Database** | PostgreSQL 16 |
| **Backend API** | FastAPI (Python 3.12) |
| **Data Cleaning** | Pandas & NumPy |
| **AI / LLM** | Google Gemini API (`gemini-3.5-flash-lite`) via `google-genai` SDK |
| **Frontend** | React 18, Vite, Lucide Icons |
| **ORM & DB Driver** | SQLAlchemy 2.0, Psycopg2 |
| **Testing** | Pytest, FastAPI TestClient |

---

## Project Structure

```text
ai_bi_assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entrypoint and routes
│   │   ├── config.py                # Environment configuration & DB settings
│   │   ├── database.py              # PostgreSQL database engine and session
│   │   ├── models.py                # SQLAlchemy model for sales_records
│   │   ├── schemas.py               # Pydantic request and response models
│   │   ├── data_cleaner.py          # Pandas/NumPy CSV cleaning & ingestion pipeline
│   │   ├── query_validator.py       # SQL safety guardrail (SELECT-only whitelist)
│   │   ├── ai_service.py            # Gemini text-to-SQL and natural summary
│   │   └── analytics_service.py     # Deterministic query executor and coordinator
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_api.py              # Automated test suite
│   └── requirements.txt             # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main dashboard layout & state
│   │   ├── components/
│   │   │   ├── ChartVisualizer.jsx  # Interactive trends and charts
│   │   │   ├── ErrorBoundary.jsx    # React UI error boundary
│   │   │   └── MarkdownResponse.jsx # Formatted answer response renderer
│   │   ├── services/
│   │   │   └── apiService.js        # API caller to backend
│   │   ├── index.css                # Monochromatic modern styling
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── ARCHITECTURE.md              # System design & Vectorless RAG architecture
│   ├── AI_DEVELOPMENT_LOG.md        # AI tools, challenges, debugging, and future work
│   └── INTERVIEW_PREP.md            # Answers for interview topics (Agentic AI, RAG, etc.)
├── scripts/
│   ├── start_postgres.sh            # Script to initialize and start local PostgreSQL (Linux/macOS)
│   ├── run_app.sh                   # Runner script starting DB, backend, and frontend (Linux/macOS)
│   ├── run_app.bat                  # One-click runner script for Windows
│   └── run_app.ps1                  # PowerShell runner script for Windows
├── data/
│   └── sales_data_raw.csv           # Raw sales CSV file
├── README.md                        # Documentation
├── .env.example                     # Environment template (safe for VCS)
└── .gitignore                       # Ignored files (secrets, venv, node_modules)
```

---

## Quick Start Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ and npm
* PostgreSQL 16

### 1. Start Database & Backend & Frontend in One Command
Run the runner script:
```bash
./scripts/run_app.sh
```
This script automatically:
1. Starts the PostgreSQL service on port `5433` and verifies the database.
2. Starts the FastAPI backend at `http://localhost:8000`.
3. Starts the React development server at `http://localhost:5173`.

---

### Manual Step-by-Step Setup

#### Step 1: Initialize Database & Ingest Data
```bash
# Start PostgreSQL cluster
./scripts/start_postgres.sh

# Run data cleaner and database loader
source venv/bin/activate
export PYTHONPATH=backend
python backend/app/data_cleaner.py
```

#### Step 2: Start Backend
```bash
source venv/bin/activate
export PYTHONPATH=backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at:
- Swagger UI: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`

#### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

To execute the Pytest test suite:
```bash
source venv/bin/activate
export PYTHONPATH=backend
pytest backend/tests/test_api.py -v
```
All **13 test cases** will run and verify:
- Backend health and KPI endpoints
- All 5 assignment ground truth questions
- Out-of-scope question handling
- Destructive SQL injection prevention
- Input boundary edge cases (empty strings)
- 1-click CSV ingestion and database reload

---

## Data Cleaning Methodology

When loading `ai_bi_assistant_sales_data - GET.csv` (51 rows), the pipeline applies the following cleaning logic using **Pandas & NumPy**:
1. **Missing Unit Price Imputation**:
   - Row 51 (`TXN0051`, Laptop Stand) had a missing unit price. The cleaner computes the median unit price for Laptop Stand across all other transactions (`$1,200`) and imputes it.
2. **Invalid Quantity Removal**:
   - Row 34 (`TXN0034`, Keyboard) had `Quantity = 0`. Dropped as a non-viable transaction.
3. **Transaction Status Handling**:
   - Row 33 (`TXN0033`, Monitor) was marked as `Returned`. Retained in the database for auditing purposes, but excluded via `status = 'Completed'` when calculating sales and revenue.
4. **Date Standardization**:
   - Converted `DD-MM-YYYY` string format to standard ISO `YYYY-MM-DD` date objects for indexing and SQL date extraction.
5. **Pre-calculated Metric**:
   - Derived `net_revenue = (quantity * unit_price) - discount_amount`.

---

## Supported Core Questions

The application supports all 5 challenge questions with verified ground truth:

| # | Question | Ground Truth Result |
| :--- | :--- | :--- |
| **1** | *"What is the total revenue?"* | **\$1,445,200.00** across 49 completed orders and 638 total units sold. |
| **2** | *"Which product generated the highest revenue?"* | **Monitor** with **\$473,000.00** total revenue. |
| **3** | *"What is the monthly revenue trend?"* | Jan (\$210,250), Feb (\$234,600), Mar (\$223,900), Apr (\$240,700), May (\$318,500), Jun (\$217,250). |
| **4** | *"Which region generated the highest sales?"* | **South** region with **\$411,200.00** across 13 orders. |
| **5** | *"How did revenue change between two months?"* | Jan to Feb increased by **+\$24,350.00 (+11.58%)**. |

---

## Known Limitations

1. **Single Table Scope**: The query generator currently targets the `sales_records` table and is not yet mapped to multi-table joins.
2. **Stateless Conversational Context**: Each natural language question is processed independently; multi-turn pronoun resolutions (e.g., *"What about last month?"*) are not yet linked to session state.
3. **Regional Grouping Granularity**: The current dataset contains region names (North, South, East, West) without postal or city-level geo-coordinates.

