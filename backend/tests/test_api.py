"""
Automated Test Suite for Dynamic AI BI Assistant.
Tests cover:
- Health and KPI endpoints
- Core business questions (ground truth verification)
- Dynamic unscripted questions (ChatGPT-style business queries)
- Out-of-scope non-business queries
- Security guardrails against destructive SQL injection
- Edge cases (empty strings)
- One-click CSV ingestion
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.query_validator import validate_sql_query

client = TestClient(app)


def test_health_check():
    """Verify backend health check returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_sample_questions_endpoint():
    """Verify preset sample questions endpoint returns 5 questions."""
    response = client.get("/api/sample-questions")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) == 5


def test_business_summary_kpis():
    """Verify high-level KPI dashboard values match database state."""
    response = client.get("/api/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_revenue"] > 0
    assert data["total_orders"] == 50
    assert data["completed_orders"] == 49
    assert data["returned_orders"] == 1
    assert data["top_product"] == "Monitor"
    assert data["top_region"] == "South"


def test_valid_question_total_revenue():
    """Test Question 1: What is the total revenue?"""
    response = client.post("/api/ask", json={"question": "What is the total revenue?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert "1,445,200" in data["answer"] or 1445200.0 in [row.get("total_revenue") for row in (data.get("data") or [])]


def test_valid_question_top_product():
    """Test Question 2: Which product generated the highest revenue?"""
    response = client.post("/api/ask", json={"question": "Which product generated the highest revenue?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert "Monitor" in str(data["data"]) or "Monitor" in data["answer"]


def test_valid_question_monthly_trend():
    """Test Question 3: What is the monthly revenue trend?"""
    response = client.post("/api/ask", json={"question": "What is the monthly revenue trend?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert len(data["data"]) >= 5


def test_valid_question_top_region():
    """Test Question 4: Which region generated the highest sales?"""
    response = client.post("/api/ask", json={"question": "Which region generated the highest sales?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert "South" in str(data["data"]) or "South" in data["answer"]


def test_valid_question_revenue_change():
    """Test Question 5: How did revenue change between two months?"""
    response = client.post("/api/ask", json={"question": "How did revenue change between two months?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert data["data"] is not None


def test_dynamic_unscripted_business_question():
    """Test dynamic business question: Which sales channel has the highest average order value?"""
    response = client.post("/api/ask", json={"question": "Which sales channel has the highest average order value?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert data["data"] is not None
    assert len(data["data"]) > 0


def test_general_knowledge_question_supported():
    """Test general knowledge / educational question is answered with rich markdown without restriction."""
    response = client.post("/api/ask", json={"question": "What is the capital of France?"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert data["query_type"] == "general_knowledge"
    assert "Paris" in data["answer"]


def test_security_destructive_query_blocked():
    """Test that destructive SQL keywords like DROP are blocked before execution."""
    response = client.post("/api/ask", json={"question": "DROP TABLE sales_records;"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is False
    assert data["query_type"] == "security_violation"
    assert "prohibited" in data["answer"].lower()


def test_sql_validator_direct():
    """Unit test for SQL validator rules."""
    # Valid query
    is_valid, err = validate_sql_query("SELECT * FROM sales_records WHERE status = 'Completed'")
    assert is_valid is True
    assert err == ""

    # Disallowed multi-statement
    is_valid, err = validate_sql_query("SELECT 1 FROM sales_records; DELETE FROM sales_records;")
    assert is_valid is False
    assert "Multiple SQL statements" in err

    # Disallowed non-SELECT
    is_valid, err = validate_sql_query("UPDATE sales_records SET net_revenue = 0")
    assert is_valid is False
    assert "Only read-only SELECT" in err

    # Unauthorized table
    is_valid, err = validate_sql_query("SELECT * FROM users")
    assert is_valid is False
    assert "must only target the 'sales_records' table" in err


def test_edge_case_empty_question():
    """Test empty question returns HTTP 400 Bad Request."""
    response = client.post("/api/ask", json={"question": "   "})
    assert response.status_code == 400


def test_one_click_csv_upload(tmp_path):
    """Test one-click CSV upload and database reload endpoint."""
    csv_content = """Transaction_Id,Order_date,Product,Category,Region,Sales_channel,Quantity,Unit_price,Discount_amount,Status
TXN1001,01-01-2026,Laptop Stand,Accessories,North,Online,5,1200,0,Completed
TXN1002,02-01-2026,Monitor,Electronics,South,Retail,2,9500,500,Completed
TXN1003,03-01-2026,Keyboard,Accessories,East,Online,0,900,0,Completed
"""
    test_file = tmp_path / "test_sales.csv"
    test_file.write_text(csv_content)

    with open(test_file, "rb") as f:
        response = client.post("/api/upload-csv", files={"file": ("test_sales.csv", f, "text/csv")})

    assert response.status_code == 200
    data = response.json()
    assert data["is_success"] is True
    assert data["total_raw_rows"] == 3
    assert data["dropped_rows"] == 1
    assert data["loaded_records"] == 2

    # Reload original dataset to leave DB in clean state
    from pathlib import Path
    from app.data_cleaner import process_and_load_csv
    orig_csv = str(Path(__file__).resolve().parents[2] / "data" / "sales_data_raw.csv")
    process_and_load_csv(orig_csv)
