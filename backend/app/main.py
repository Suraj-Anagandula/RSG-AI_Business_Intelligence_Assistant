"""
FastAPI Main Application Entry Point.
Provides REST API endpoints for the Mini AI Business Intelligence Assistant.
"""
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import (
    QuestionRequest,
    QuestionResponse,
    SampleQuestionItem,
    BusinessSummaryResponse,
    CsvUploadResponse
)
from app.analytics_service import process_user_query, get_business_kpis
from app.data_cleaner import clean_sales_dataframe, load_cleaned_data_to_db

# Initialize FastAPI application
app = FastAPI(
    title="AI Business Intelligence Assistant API",
    description="Backend API for querying sales transactions using natural language and deterministic SQL analytics.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def check_health():
    """Health check endpoint to verify backend service is running."""
    return {"status": "ok", "service": "AI BI Assistant Backend"}


@app.get("/api/sample-questions", response_model=list[SampleQuestionItem])
def get_sample_questions():
    """
    Returns the preset challenge questions for easy one-click testing in the UI.
    """
    return [
        {"id": 1, "question": "What is the total revenue?", "category": "Revenue"},
        {"id": 2, "question": "Which product generated the highest revenue?", "category": "Products"},
        {"id": 3, "question": "What is the monthly revenue trend?", "category": "Trends"},
        {"id": 4, "question": "Which region generated the highest sales?", "category": "Regions"},
        {"id": 5, "question": "How did revenue change between two months?", "category": "Comparison"}
    ]


@app.get("/api/summary", response_model=BusinessSummaryResponse)
def get_summary_kpis():
    """Returns top-level business KPI metrics for dashboard header."""
    try:
        kpis = get_business_kpis()
        return kpis
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


@app.post("/api/ask", response_model=QuestionResponse)
def ask_sales_question(payload: QuestionRequest):
    """
    Accepts natural language question, processes query via deterministic rules or AI text-to-SQL,
    validates SQL safety, executes against PostgreSQL, and returns structured answer.
    """
    if not payload.question or not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    result = process_user_query(payload.question)
    return result


@app.post("/api/upload-csv", response_model=CsvUploadResponse)
async def upload_and_ingest_csv(file: UploadFile = File(...)):
    """
    One-click export/load to database:
    Accepts any new CSV file, cleans with Pandas/NumPy, and loads into PostgreSQL.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    try:
        contents = await file.read()
        df_raw = pd.read_csv(io.StringIO(contents.decode("utf-8", errors="ignore")))
        
        # Clean dataframe using modular data_cleaner
        df_clean, stats = clean_sales_dataframe(df_raw)
        
        # Ingest into database
        loaded_count = load_cleaned_data_to_db(df_clean)
        
        return {
            "message": f"Successfully processed and loaded {loaded_count} records into the database.",
            "total_raw_rows": stats["total_raw_rows"],
            "dropped_rows": stats["dropped_rows"],
            "imputed_rows": stats["imputed_rows"],
            "loaded_records": loaded_count,
            "is_success": True
        }
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV file: {str(err)}")

