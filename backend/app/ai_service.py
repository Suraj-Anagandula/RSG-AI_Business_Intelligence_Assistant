"""
AI Service Module using Google Gemini.
Implements the 10-point Business AI Assistant system prompt.
Handles:
1. Intent classification (General Knowledge vs Database Inquiry).
2. Natural language to safe PostgreSQL SELECT translation.
3. Grounded business intelligence synthesis with structured Markdown.
4. General knowledge, educational, analytical, and interview answers.
5. Dynamic follow-up recommendations.
"""
import os
import re
from google import genai
from app.config import GEMINI_API_KEY, GEMINI_MODEL

# Initialize Gemini Client if API key is provided
ai_client = None
if GEMINI_API_KEY:
    try:
        ai_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as err:
        print(f"[AI Service] Warning: Failed to initialize Gemini client: {err}")

# System prompt exactly as specified
SYSTEM_PROMPT = """You are an intelligent Business AI Assistant.

Your responsibilities:

1. Understand the actual intent behind every user question.
2. Answer general knowledge, educational, interview,
   analytical and business-related questions.
3. Never restrict responses to information directly
   available in the business database.
4. Use general knowledge when the question does not
   require private business data.
5. When business data is required:
   - Retrieve relevant records.
   - Combine information from multiple sources.
   - Perform calculations using Python or SQL.
   - Compare trends and identify patterns.
   - Explain conclusions using evidence.
6. Distinguish facts, assumptions and predictions.
7. Never invent business metrics or claim that
   unavailable data was retrieved.
8. If information is insufficient, explain what is
   missing and provide the best possible partial answer.
9. For complex questions, break the problem into
   smaller reasoning steps.
10. Give clear, relevant, well-structured answers.

Response requirements:
- Use meaningful Markdown.
- Use headings, lists and tables where appropriate.
- Explain technical concepts in understandable language.
- Include examples when useful.
- Avoid unnecessary repetition."""

# Schema instructions for SQL generation targeting sales_records
SQL_TRANSLATION_PROMPT = """You are a specialized SQL translator for PostgreSQL.
Convert natural language questions into safe, read-only SELECT queries for table `sales_records`.

Table: sales_records
Columns:
- id: integer (primary key)
- transaction_id: varchar (e.g. 'TXN0001')
- order_date: date (YYYY-MM-DD)
- product: varchar ('Monitor', 'Keyboard', 'Office Chair', 'Desk', 'Laptop Stand', etc.)
- category: varchar ('Electronics', 'Furniture', 'Accessories')
- region: varchar ('North', 'South', 'East', 'West')
- sales_channel: varchar ('Online', 'Retail')
- quantity: integer
- unit_price: double precision
- discount_amount: double precision
- status: varchar ('Completed' or 'Returned')
- net_revenue: double precision (pre-calculated: (quantity * unit_price) - discount_amount)

CRITICAL RULES:
1. Filter by `status = 'Completed'` for all sales, revenue, rankings, and trends, unless the user asks specifically about returns.
2. For monthly trends or grouping by month, use `TO_CHAR(order_date, 'YYYY-MM') AS month`.
3. When comparing channels, regions, categories, or products (e.g. 'Online vs Retail', 'regional sales', 'monthly trend'), GROUP BY the entity and do NOT add 'LIMIT 1' unless the user specifically asks for 'only top 1'.
4. Output ONLY the raw SQL query. Do NOT include markdown fences, comments, or explanations.
5. Destructive queries (DROP, DELETE, UPDATE, INSERT) are strictly prohibited. Only generate SELECT queries.
"""

MODELS_TO_TRY = [GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-flash-latest"]


def classify_question_intent(user_question: str) -> str:
    """
    Determines whether a question requires private company business records
    from `sales_records` or is a general knowledge / educational / interview query.
    Returns: 'DATABASE' or 'GENERAL'
    """
    q_lower = user_question.lower().strip()

    # Clear general knowledge / educational / interview signals
    if any(k in q_lower for k in [
        "interview", "prepare for", "career", "resume",
        "concept", "algorithm", "theory", "what is vectorless",
        "capital of", "who is", "tell me a joke", "how to prepare"
    ]):
        return "GENERAL"

    # Specific company database query signals (actual data metrics)
    db_metrics = [
        "total revenue", "highest revenue", "top product", "monthly trend",
        "sales channel", "which region", "highest sales", "returned orders",
        "units sold", "our sales", "our company", "txn", "sales records",
        "revenue change", "how did revenue change", "average order value",
        "profitability: online", "list all products", "how many units"
    ]
    if any(m in q_lower for m in db_metrics):
        return "DATABASE"

    # General concept signals (e.g. "what is gross margin", "explain inflation")
    if any(q_lower.startswith(prefix) for prefix in [
        "what is ", "what are ", "explain ", "how does ", "why does ", "difference between "
    ]) and not any(k in q_lower for k in ["revenue", "sales", "product", "channel", "region", "order"]):
        return "GENERAL"

    # Fast LLM classification if ambiguous
    if ai_client:
        prompt = (
            f"Determine if the user's question requires querying a private database table of sales transactions "
            f"(e.g. company revenue numbers, order quantities, top selling items in our store) "
            f"or if it is a general knowledge / educational / conceptual / interview question.\n\n"
            f"User Question: \"{user_question}\"\n\n"
            f"Reply with exactly one word: 'DATABASE' or 'GENERAL'."
        )
        try:
            resp = ai_client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
            verdict = resp.text.strip().upper()
            if "GENERAL" in verdict:
                return "GENERAL"
            if "DATABASE" in verdict:
                return "DATABASE"
        except Exception:
            pass

    # Default fallback
    return "DATABASE" if any(w in q_lower for w in ["revenue", "sales", "order", "product", "region", "channel"]) else "GENERAL"


def generate_sql_from_question(user_question: str) -> str:
    """
    Translates a natural language question into a safe PostgreSQL SELECT query.
    """
    if not ai_client:
        return ""

    prompt = f"{SQL_TRANSLATION_PROMPT}\n\nUser Question: {user_question}\nSQL Query:"

    for model_name in MODELS_TO_TRY:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_output = response.text.strip()
            clean_sql = re.sub(r"^```(sql)?", "", raw_output, flags=re.IGNORECASE).strip()
            clean_sql = re.sub(r"```$", "", clean_sql).strip()
            return clean_sql
        except Exception as e:
            print(f"[AI Service] SQL Gen '{model_name}' error: {e}. Trying fallback...")
            continue

    return ""


def generate_grounded_business_answer(user_question: str, data: list[dict], sql_query: str) -> str:
    """
    Synthesizes a rich, structured Markdown answer grounded in the retrieved database records,
    strictly adhering to the 10-point system prompt.
    """
    if not ai_client:
        return ""

    prompt = f"""{SYSTEM_PROMPT}

User Question: {user_question}
SQL Query Executed: {sql_query}
Database Records Retrieved:
{data}

Instructions:
1. Provide a well-structured response using Markdown.
2. Include a clear title/heading (e.g. ## Revenue Analysis or ## Product Performance).
3. If the data has multiple records, time periods, or comparative categories, include a Markdown table (e.g. | Month | Revenue | or | Product | Revenue |).
4. Include a section for ### Key Insights with bullet points comparing trends and explaining conclusions using evidence.
5. In accordance with rule 6, briefly distinguish facts, assumptions, and predictions.
6. Do NOT mention internal database table names or SQL jargon in the prose.
"""

    for model_name in MODELS_TO_TRY:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[AI Service] Grounded Answer '{model_name}' error: {e}. Trying fallback...")
            continue

    return ""


def generate_general_knowledge_answer(user_question: str) -> str:
    """
    Answers general knowledge, educational, interview, or analytical questions
    using the 10-point system prompt and general knowledge.
    """
    if not ai_client:
        return ""

    prompt = f"""{SYSTEM_PROMPT}

User Question: {user_question}

Instructions:
- Provide a clear, relevant, well-structured answer.
- Use meaningful Markdown (headings, bullet lists, bold highlights, tables where appropriate).
- Explain technical concepts in understandable language.
- Include concrete examples when useful.
- Avoid unnecessary repetition.
"""

    for model_name in MODELS_TO_TRY:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            print(f"[AI Service] General Knowledge '{model_name}' error: {e}. Trying fallback...")
            continue

    return ""


def generate_followup_questions(user_question: str, answer: str) -> list[str]:
    """
    Generates 2-3 dynamic follow-up business or exploration questions.
    """
    if not ai_client:
        return []

    prompt = f"""You are an intelligent Business AI Assistant.
The user asked: "{user_question}"
Your response was: "{answer[:300]}..."

Suggest 3 short, relevant follow-up questions that the user might want to ask next.
Return ONLY 3 questions, one per line. Do not number them or add bullet points.
"""
    try:
        response = ai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        lines = [line.strip().lstrip("123456789.-* ") for line in response.text.strip().split("\n") if line.strip()]
        return lines[:3]
    except Exception as e:
        print(f"[AI Service] Error generating follow-ups: {e}")
        return []
