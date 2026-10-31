"""
Analytics Service Module.
Dynamic, ChatGPT-like AI Assistant for Business Intelligence.
Translates any natural language question to SQL, validates safety, executes queries,
and formats conversational business answers with dynamic follow-up suggestions.
"""
import time
import datetime
from decimal import Decimal
from sqlalchemy import text
from app.database import engine
from app.query_validator import validate_sql_query
from app.ai_service import (
    generate_sql_from_question,
    generate_natural_answer,
    generate_followup_questions
)


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


def get_business_kpis() -> dict:
    """Calculates overall KPI summary cards for dashboard header."""
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

    # Top revenue product
    top_p = execute_raw_sql("SELECT product FROM sales_records WHERE status = 'Completed' GROUP BY product ORDER BY SUM(net_revenue) DESC LIMIT 1;")
    kpis["top_product"] = top_p[0]["product"] if top_p else "N/A"

    # Top revenue region
    top_r = execute_raw_sql("SELECT region FROM sales_records WHERE status = 'Completed' GROUP BY region ORDER BY SUM(net_revenue) DESC LIMIT 1;")
    kpis["top_region"] = top_r[0]["region"] if top_r else "N/A"

    return kpis


def determine_visualization_and_insight(data: list[dict], sql_query: str) -> tuple[str, str]:
    """
    Intelligently determines the most suitable pictorial representation and
    derives strategic business insights hidden in the analytical logic.
    """
    if not data:
        return "table", ""

    first_row = data[0]
    cols = list(first_row.keys())
    cols_lower = [c.lower() for c in cols]
    sql_lower = (sql_query or "").lower()

    # 1. Single KPI Metric representation
    if len(data) == 1 and len(cols) <= 3:
        val = list(first_row.values())[0]
        if isinstance(val, (int, float)):
            insight = f"Core performance metric confirmed from verified transactional database records."
            return "kpi", insight

    # 2. Monthly Trend representation
    if any(c in ["month", "order_date", "date"] for c in cols_lower):
        if len(data) >= 2:
            rev_col = next((c for c in cols if "rev" in c.lower() or "sale" in c.lower()), None)
            if rev_col and isinstance(data[0].get(rev_col), (int, float)):
                v_first = data[0][rev_col]
                v_last = data[-1][rev_col]
                pct = ((v_last - v_first) / max(v_first, 1)) * 100
                direction = "expansion" if pct >= 0 else "contraction"
                insight = f"Revenue reflects a net {abs(pct):.1f}% {direction} across the recorded timeline."
                return "trend", insight
        return "trend", "Timeline progression tracks sales performance continuity."

    # 3. Product Ranking / Leaderboard representation
    if any("product" in c for c in cols_lower):
        top_item = first_row.get("product", "Leading Product")
        insight = f"'{top_item}' commands top market velocity and drives prime transaction volume."
        return "ranking", insight

    # 4. Regional or Channel Distribution representation
    if any(c in ["region", "sales_channel", "category"] for c in cols_lower):
        dim_col = next(c for c in cols if c in ["region", "sales_channel", "category"])
        top_name = first_row.get(dim_col, "Top Segment")
        insight = f"'{top_name}' represents the highest concentration segment in this breakdown."
        return "distribution", insight

    return "table", "Structured record view from PostgreSQL transactional store."

FALLBACK_PRESETS = {
    "total_revenue": (
        "SELECT ROUND(SUM(net_revenue)::numeric, 2) AS total_revenue, COUNT(*) AS completed_orders FROM sales_records WHERE status = 'Completed';",
        "total_revenue"
    ),
    "highest_revenue_product": (
        "SELECT product, category, ROUND(SUM(net_revenue)::numeric, 2) AS total_revenue FROM sales_records WHERE status = 'Completed' GROUP BY product, category ORDER BY total_revenue DESC LIMIT 5;",
        "highest_revenue_product"
    ),
    "monthly_revenue_trend": (
        "SELECT TO_CHAR(order_date, 'YYYY-MM') AS month, ROUND(SUM(net_revenue)::numeric, 2) AS monthly_revenue FROM sales_records WHERE status = 'Completed' GROUP BY month ORDER BY month ASC;",
        "monthly_revenue_trend"
    ),
    "highest_sales_region": (
        "SELECT region, ROUND(SUM(net_revenue)::numeric, 2) AS total_sales, COUNT(*) AS orders FROM sales_records WHERE status = 'Completed' GROUP BY region ORDER BY total_sales DESC;",
        "highest_sales_region"
    ),
    "revenue_change_between_months": (
        "WITH m AS (SELECT TO_CHAR(order_date, 'YYYY-MM') AS month, SUM(net_revenue) AS revenue FROM sales_records WHERE status = 'Completed' GROUP BY month ORDER BY month ASC) SELECT month, ROUND(revenue::numeric, 2) AS revenue, ROUND((revenue - LAG(revenue) OVER (ORDER BY month))::numeric, 2) AS revenue_change FROM m;",
        "revenue_change_between_months"
    )
}


def process_user_query(question: str) -> dict:
    """
    Processes ANY natural language business question dynamically like ChatGPT.
    1. Validates query against security blacklist.
    2. Uses Gemini to dynamically generate the exact SQL query.
    3. Validates SQL for read-only safety.
    4. Executes SQL against PostgreSQL.
    5. Uses Gemini to generate conversational answer and follow-up suggestions.
    """
    start_time = time.time()
    q_clean = question.strip()
    q_lower = q_clean.lower()

    def make_response(answer, sql=None, data=None, q_type="dynamic_ai", success=True, err=None, engine_src="Gemini 3.5 Flash-Lite", followups=None, vis_type="table", insight=None):
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "question": q_clean,
            "answer": answer,
            "sql_query": sql,
            "data": data,
            "query_type": q_type,
            "is_success": success,
            "error_message": err,
            "execution_time_ms": elapsed_ms,
            "engine_source": engine_src,
            "suggested_followups": followups or [],
            "visualization_type": vis_type,
            "business_insight": insight
        }


    # Security check: disallow destructive SQL commands
    destructive_words = ["drop", "delete", "truncate", "update", "insert", "alter", "shutdown"]
    for word in destructive_words:
        if word in q_lower.split():
            return make_response(
                answer="Security Notice: Destructive database modifications are strictly prohibited.",
                q_type="security_violation",
                success=False,
                err=f"Keyword '{word.upper()}' is not allowed.",
                engine_src="Security Guardrail"
            )

    # Dynamic AI Text-to-SQL generation (No fixed questions)
    generated_sql = generate_sql_from_question(q_clean)

    # Check if question is completely non-business / out of scope
    if generated_sql == "CANNOT_ANSWER":
        return make_response(
            answer="I am your Sales BI Assistant. I can answer questions about sales, revenue, products, channels, discounts, and regional performance. Please ask a business question.",
            q_type="out_of_scope",
            success=False,
            err="Question is out of scope.",
            engine_src="AI Schema Grounding Guardrail"
        )

    # Fallback to verified SQL only if LLM is temporarily unreachable (network timeout / rate limit)
    if not generated_sql:
        if "revenue" in q_lower and ("total" in q_lower or "overall" in q_lower):
            generated_sql = FALLBACK_PRESETS["total_revenue"][0]
        elif "product" in q_lower and ("highest" in q_lower or "top" in q_lower or "revenue" in q_lower):
            generated_sql = FALLBACK_PRESETS["highest_revenue_product"][0]
        elif "trend" in q_lower or ("month" in q_lower and "revenue" in q_lower):
            generated_sql = FALLBACK_PRESETS["monthly_revenue_trend"][0]
        elif "region" in q_lower and ("highest" in q_lower or "sales" in q_lower or "top" in q_lower):
            generated_sql = FALLBACK_PRESETS["highest_sales_region"][0]
        elif "change" in q_lower or "between" in q_lower or "month over month" in q_lower:
            generated_sql = FALLBACK_PRESETS["revenue_change_between_months"][0]


    if not generated_sql:
        return make_response(
            answer="I was unable to interpret that question into a database query. Could you please rephrase your business question?",
            q_type="uninterpreted_query",
            success=False,
            err="Failed to generate SQL.",
            engine_src="AI Assistant"
        )

    # Validate SQL safety (must be a SELECT on sales_records)
    is_valid, validation_error = validate_sql_query(generated_sql)
    if not is_valid:
        return make_response(
            answer=f"The query could not be executed due to security constraints: {validation_error}",
            sql=generated_sql,
            q_type="invalid_sql",
            success=False,
            err=validation_error,
            engine_src="SQL Safety Validator"
        )

    # Execute validated SQL on PostgreSQL
    try:
        data = execute_raw_sql(generated_sql)
        if not data:
            return make_response(
                answer="The database query returned zero matching records for your request.",
                sql=generated_sql,
                data=[],
                q_type="dynamic_ai",
                success=True,
                engine_src="Gemini 3.5 Flash-Lite"
            )

        # Generate conversational ChatGPT-style natural language response
        natural_answer = generate_natural_answer(q_clean, data[:5])
        if not natural_answer:
            # Deterministic, reliable answer formatter from data row if LLM is rate-limited
            first_row = data[0]
            items = []
            for k, v in first_row.items():
                k_label = k.replace("_", " ")
                if isinstance(v, (int, float)):
                    items.append(f"{k_label}: ${v:,.2f}" if "rev" in k or "price" in k or "sale" in k else f"{k_label}: {v:,}")
                else:
                    items.append(f"{k_label}: {v}")
            natural_answer = f"The database query returned: {', '.join(items)}."


        # Dynamically generate follow-up recommendations
        followups = generate_followup_questions(q_clean, natural_answer)

        # Intelligently determine suitable pictorial visualization and business insight
        vis_type, insight = determine_visualization_and_insight(data, generated_sql)

        return make_response(
            answer=natural_answer,
            sql=generated_sql,
            data=data,
            q_type=vis_type,
            success=True,
            engine_src="Gemini 3.5 Flash-Lite (ChatGPT Mode)",
            followups=followups,
            vis_type=vis_type,
            insight=insight
        )


    except Exception as exec_error:
        return make_response(
            answer="An error occurred while executing the query on the database.",
            sql=generated_sql,
            q_type="execution_error",
            success=False,
            err=str(exec_error),
            engine_src="Database Engine"
        )
