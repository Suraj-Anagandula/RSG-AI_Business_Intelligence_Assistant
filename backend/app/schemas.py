"""
Pydantic Schemas for Request and Response Models.
Simple, beginner-friendly data validation models.
"""
from pydantic import BaseModel
from typing import Optional, Any


class QuestionRequest(BaseModel):
    """Schema for incoming user question."""
    question: str


class QuestionResponse(BaseModel):
    """Structured response returned by the backend."""
    question: str
    answer: str
    sql_query: Optional[str] = None
    data: Optional[list[dict[str, Any]]] = None
    query_type: Optional[str] = None
    is_success: bool = True
    error_message: Optional[str] = None
    execution_time_ms: Optional[float] = 0.0
    engine_source: Optional[str] = "Deterministic Engine"
    suggested_followups: Optional[list[str]] = []



class SampleQuestionItem(BaseModel):
    """Schema for preset example questions."""
    id: int
    question: str
    category: str


class BusinessSummaryResponse(BaseModel):
    """Schema for high-level business KPI metrics."""
    total_revenue: float
    total_orders: int
    completed_orders: int
    returned_orders: int
    top_product: str
    top_region: str


class CsvUploadResponse(BaseModel):
    """Schema for CSV upload and database export result."""
    message: str
    total_raw_rows: int
    dropped_rows: int
    imputed_rows: int
    loaded_records: int
    is_success: bool

