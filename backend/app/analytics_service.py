"""
Analytics Service Module.
Executes SQL queries against PostgreSQL and provides deterministic handlers
for the 5 core business intelligence questions, alongside AI fallback.
"""
import time
import datetime
from decimal import Decimal
from sqlalchemy import text
from app.database import engine
from app.query_validator import validate_sql_query
from app.ai_service import generate_sql_from_question, generate_natural_answer



def execute_raw_sql(sql_query: str) -> list[dict]:
    """
    Executes a validated read-only SQL query against PostgreSQL.
    Returns list of dictionaries representing row records.
    """
    with engine.connect() as connection:
        result = connection.execute(text(sql_query))
        keys = result.keys()
        rows = [dict(zip(keys, row)) for row in result.fetchall()]
        
        formatted_rows = []
        for r in rows:
            formatted_item = {}
            for k, v in r.items():
                if isinstance(v, Decimal):
                    formatted_item[k] = float(v)
                elif isinstance(v, (datetime.date, datetime.datetime)):
                    formatted_item[k] = v.isoformat()
                elif isinstance(v, (int, float, str, bool)) or v is None:
                    formatted_item[k] = v
                else:
                    formatted_item[k] = str(v)
            formatted_rows.append(formatted_item)
        return formatted_rows



def handle_total_revenue() -> dict:
    """1. What is the total revenue?"""
    sql = """
    SELECT 
        ROUND(SUM(net_revenue)::numeric, 2) AS total_revenue,
        COUNT(*) AS total_completed_orders,
        SUM(quantity) AS total_units_sold
    FROM sales_records 
    WHERE status = 'Completed';
    """
    data = execute_raw_sql(sql)
    tot = data[0]["total_revenue"] if data else 0
    orders = data[0]["total_completed_orders"] if data else 0
    units = data[0]["total_units_sold"] if data else 0
    
    answer = f"The total revenue across all completed sales is ${tot:,.2f}, generated from {orders} orders and {units} total units sold."
    return {
        "query_type": "total_revenue",
        "sql_query": sql.strip(),
        "data": data,
        "answer": answer
    }


def handle_highest_revenue_product() -> dict:
    """2. Which product generated the highest revenue?"""
    sql = """
    SELECT 
        product,
        category,
        ROUND(SUM(net_revenue)::numeric, 2) AS total_revenue,
        SUM(quantity) AS total_units_sold
    FROM sales_records 
    WHERE status = 'Completed'
    GROUP BY product, category
    ORDER BY total_revenue DESC;
    """
    data = execute_raw_sql(sql)
    if data:
        top_prod = data[0]["product"]
        top_rev = data[0]["total_revenue"]
        answer = f"The product with the highest revenue is '{top_prod}' generating ${top_rev:,.2f} across all completed sales."
    else:
        answer = "No sales records found."

    return {
        "query_type": "highest_revenue_product",
        "sql_query": sql.strip(),
        "data": data,
        "answer": answer
    }


def handle_monthly_revenue_trend() -> dict:
    """3. What is the monthly revenue trend?"""
    sql = """
    SELECT 
        TO_CHAR(order_date, 'YYYY-MM') AS month,
        ROUND(SUM(net_revenue)::numeric, 2) AS monthly_revenue,
        COUNT(*) AS total_orders
    FROM sales_records 
    WHERE status = 'Completed'
    GROUP BY month
    ORDER BY month ASC;
    """
    data = execute_raw_sql(sql)
    if data:
        summary_points = [f"{d['month']}: ${d['monthly_revenue']:,.0f}" for d in data]
        answer = f"Monthly revenue trend ({data[0]['month']} to {data[-1]['month']}): " + ", ".join(summary_points) + "."
    else:
        answer = "No monthly data available."

    return {
        "query_type": "monthly_revenue_trend",
        "sql_query": sql.strip(),
        "data": data,
        "answer": answer
    }


def handle_highest_sales_region() -> dict:
    """4. Which region generated the highest sales?"""
    sql = """
    SELECT 
        region,
        ROUND(SUM(net_revenue)::numeric, 2) AS total_sales,
        COUNT(*) AS total_orders
    FROM sales_records 
    WHERE status = 'Completed'
    GROUP BY region
    ORDER BY total_sales DESC;
    """
    data = execute_raw_sql(sql)
    if data:
        top_region = data[0]["region"]
        top_sales = data[0]["total_sales"]
        answer = f"The '{top_region}' region generated the highest sales at ${top_sales:,.2f} with {data[0]['total_orders']} orders."
    else:
        answer = "No regional sales data available."

    return {
        "query_type": "highest_sales_region",
        "sql_query": sql.strip(),
        "data": data,
        "answer": answer
    }


def handle_revenue_change_between_months() -> dict:
    """5. How did revenue change between two months?"""
    sql = """
    WITH monthly_sales AS (
        SELECT 
            TO_CHAR(order_date, 'YYYY-MM') AS month,
            SUM(net_revenue) AS revenue
        FROM sales_records 
        WHERE status = 'Completed'
        GROUP BY month
        ORDER BY month ASC
    )
    SELECT 
        month,
        ROUND(revenue::numeric, 2) AS revenue,
        ROUND((revenue - LAG(revenue) OVER (ORDER BY month))::numeric, 2) AS revenue_change,
        ROUND((((revenue - LAG(revenue) OVER (ORDER BY month)) / NULLIF(LAG(revenue) OVER (ORDER BY month), 0)) * 100)::numeric, 2) AS percentage_change
    FROM monthly_sales;
    """
    data = execute_raw_sql(sql)
    if len(data) >= 2:
        m1 = data[0]["month"]
        m2 = data[1]["month"]
        chg = data[1]["revenue_change"]
        pct = data[1]["percentage_change"]
        dir_word = "increased" if chg >= 0 else "decreased"
        answer = (
            f"Between {m1} and {m2}, revenue {dir_word} by ${abs(chg):,.2f} ({pct:+.2f}%). "
            f"Full month-over-month comparisons are listed in the table below."
        )
    else:
        answer = "Insufficient data to compute monthly change."

    return {
        "query_type": "revenue_change_between_months",
        "sql_query": sql.strip(),
        "data": data,
        "answer": answer
    }


def get_business_kpis() -> dict:
    """Calculates overall KPI summary cards."""
    sql = """
    SELECT 
        ROUND(COALESCE(SUM(CASE WHEN status = 'Completed' THEN net_revenue ELSE 0 END), 0)::numeric, 2) AS total_revenue,
        COUNT(*) AS total_orders,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed_orders,
        COUNT(CASE WHEN status = 'Returned' THEN 1 END) AS returned_orders
    FROM sales_records;
    """
    data = execute_raw_sql(sql)
    kpis = data[0] if data else {
        "total_revenue": 0.0,
        "total_orders": 0,
        "completed_orders": 0,
        "returned_orders": 0
    }
    
    # Get top product
    top_p_data = execute_raw_sql("SELECT product FROM sales_records WHERE status = 'Completed' GROUP BY product ORDER BY SUM(net_revenue) DESC LIMIT 1;")
    kpis["top_product"] = top_p_data[0]["product"] if top_p_data else "N/A"
    
    # Get top region
    top_r_data = execute_raw_sql("SELECT region FROM sales_records WHERE status = 'Completed' GROUP BY region ORDER BY SUM(net_revenue) DESC LIMIT 1;")
    kpis["top_region"] = top_r_data[0]["region"] if top_r_data else "N/A"

    return kpis


def process_user_query(question: str) -> dict:
    """
    Main query processing coordinator:
    1. Checks for match with core 5 questions (deterministic, zero-hallucination).
    2. Falls back to AI text-to-SQL with safety guardrail.
    3. Handles out-of-scope or destructive queries safely.
    4. Computes execution latency and attaches follow-up suggestions.
    """
    start_time = time.time()
    q_lower = question.lower().strip()

    def finalize_response(res_dict):
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        res_dict["execution_time_ms"] = elapsed_ms
        if "engine_source" not in res_dict:
            res_dict["engine_source"] = "Deterministic Engine"
        if "suggested_followups" not in res_dict:
            res_dict["suggested_followups"] = []
        return res_dict

    # Pre-defined deterministic matching
    if any(phrase in q_lower for phrase in ["total revenue", "overall revenue", "total sales"]):
        res = handle_total_revenue()
        res["question"] = question
        res["is_success"] = True
        res["engine_source"] = "Deterministic SQL Engine"
        res["suggested_followups"] = [
            "Which product generated the highest revenue?",
            "What is the monthly revenue trend?",
            "Which region generated the highest sales?"
        ]
        return finalize_response(res)

    if any(phrase in q_lower for phrase in ["highest revenue", "top product", "best selling product", "most revenue"]):
        res = handle_highest_revenue_product()
        res["question"] = question
        res["is_success"] = True
        res["engine_source"] = "Deterministic SQL Engine"
        res["suggested_followups"] = [
            "What is the total revenue?",
            "Which region generated the highest sales?",
            "What is the monthly revenue trend?"
        ]
        return finalize_response(res)

    if any(phrase in q_lower for phrase in ["monthly revenue trend", "monthly trend", "revenue trend", "sales over time"]):
        res = handle_monthly_revenue_trend()
        res["question"] = question
        res["is_success"] = True
        res["engine_source"] = "Deterministic SQL Engine"
        res["suggested_followups"] = [
            "How did revenue change between two months?",
            "Which product generated the highest revenue?",
            "Which region generated the highest sales?"
        ]
        return finalize_response(res)

    if any(phrase in q_lower for phrase in ["highest sales", "which region", "top region", "sales by region", "best region"]):
        res = handle_highest_sales_region()
        res["question"] = question
        res["is_success"] = True
        res["engine_source"] = "Deterministic SQL Engine"
        res["suggested_followups"] = [
            "What is the total revenue?",
            "Which product generated the highest revenue?",
            "What is the monthly revenue trend?"
        ]
        return finalize_response(res)

    if any(phrase in q_lower for phrase in ["change between two months", "between two months", "revenue change", "month over month", "mom change"]):
        res = handle_revenue_change_between_months()
        res["question"] = question
        res["is_success"] = True
        res["engine_source"] = "Deterministic SQL Engine"
        res["suggested_followups"] = [
            "What is the monthly revenue trend?",
            "What is the total revenue?",
            "Which region generated the highest sales?"
        ]
        return finalize_response(res)

    # Check for obvious destructive or injection keywords before AI
    for bad_word in ["drop", "delete", "truncate", "update", "insert", "alter"]:
        if bad_word in q_lower.split():
            res = {
                "question": question,
                "answer": "Security Alert: Destructive database modifications are strictly prohibited.",
                "sql_query": None,
                "data": None,
                "query_type": "security_violation",
                "is_success": False,
                "error_message": f"Operation '{bad_word.upper()}' is not permitted.",
                "engine_source": "Security Guardrail"
            }
            return finalize_response(res)

    # Dynamic AI-assisted SQL Generation
    generated_sql = generate_sql_from_question(question)
    
    if generated_sql == "CANNOT_ANSWER" or not generated_sql:
        res = {
            "question": question,
            "answer": "I can only answer questions related to sales transactions, products, categories, regions, and revenue. Please ask a business-related question.",
            "sql_query": None,
            "data": None,
            "query_type": "out_of_scope",
            "is_success": False,
            "error_message": "Question is out of scope.",
            "engine_source": "Gemini Schema Grounding Guardrail"
        }
        return finalize_response(res)

    # Validate generated SQL with strict safety rules
    is_valid, error_reason = validate_sql_query(generated_sql)
    if not is_valid:
        res = {
            "question": question,
            "answer": f"The generated query did not pass our security validation: {error_reason}",
            "sql_query": generated_sql,
            "data": None,
            "query_type": "invalid_sql",
            "is_success": False,
            "error_message": error_reason,
            "engine_source": "SQL Safety Validator"
        }
        return finalize_response(res)

    # Execute validated SQL
    try:
        data = execute_raw_sql(generated_sql)
        if not data:
            res = {
                "question": question,
                "answer": "The query executed successfully, but no matching sales records were found.",
                "sql_query": generated_sql,
                "data": [],
                "query_type": "custom_ai",
                "is_success": True,
                "engine_source": "Gemini 3.5 Flash-Lite (Text-to-SQL)"
            }
            return finalize_response(res)

        # Generate natural language summary using Gemini
        natural_answer = generate_natural_answer(question, data[:5])
        if not natural_answer:
            natural_answer = f"Found {len(data)} matching records in the sales database."

        res = {
            "question": question,
            "answer": natural_answer,
            "sql_query": generated_sql,
            "data": data,
            "query_type": "custom_ai",
            "is_success": True,
            "engine_source": "Gemini 3.5 Flash-Lite (Text-to-SQL)",
            "suggested_followups": [
                "What is the total revenue?",
                "Which product generated the highest revenue?"
            ]
        }
        return finalize_response(res)
    except Exception as exec_err:
        res = {
            "question": question,
            "answer": "An error occurred while executing the database query.",
            "sql_query": generated_sql,
            "data": None,
            "query_type": "execution_error",
            "is_success": False,
            "error_message": str(exec_err),
            "engine_source": "Database Engine"
        }
        return finalize_response(res)

