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
    engine_source: Optional[str] = "Gemini AI"
    suggested_followups: Optional[list[str]] = []
    visualization_type: Optional[str] = "table"
    business_insight: Optional[str] = None




class SampleQuestionItem(BaseModel):
    """Schema for preset example questions."""
    id: int
    question: str
    category: str


class BusinessSummaryResponse(BaseModel):
    """Schema for high-level business KPI metrics and executive dashboard cards."""
    total_revenue: float
    total_orders: int
    completed_orders: int
    returned_orders: int
    completion_rate: Optional[float] = 98.0
    top_product: str
    top_product_revenue: Optional[float] = 0.0
    top_region: str
    top_region_revenue: Optional[float] = 0.0
    monthly_trend: Optional[list[dict[str, Any]]] = []
    channel_stats: Optional[list[dict[str, Any]]] = []
    records: Optional[list[dict[str, Any]]] = []


class CsvUploadResponse(BaseModel):
    """Schema for CSV upload and database export result."""
    message: str
    total_raw_rows: int
    dropped_rows: int
    imputed_rows: int
    loaded_records: int
    is_success: bool

