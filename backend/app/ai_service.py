"""
AI Service Module using Google Gemini.
Handles natural language to SQL translation and natural language answer generation.
Includes grounding against the sales_records database schema and business rules.
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

# Database schema representation for system prompt grounding
DATABASE_SCHEMA_PROMPT = """
You are a specialized business intelligence SQL assistant.
You translate natural language questions into PostgreSQL queries for the table `sales_records`.

Table: sales_records
Columns:
- id: integer (primary key)
- transaction_id: varchar (e.g. 'TXN0001')
- order_date: date (format: YYYY-MM-DD, e.g. '2026-01-03')
- product: varchar (e.g. 'Laptop Stand', 'Wireless Mouse', 'Office Chair', 'Monitor', 'Keyboard', 'Desk', 'USB-C Hub')
- category: varchar (e.g. 'Accessories', 'Furniture', 'Electronics')
- region: varchar (e.g. 'North', 'South', 'East', 'West')
- sales_channel: varchar (e.g. 'Online', 'Retail')
- quantity: integer (number of units)
- unit_price: double precision
- discount_amount: double precision
- status: varchar ('Completed' or 'Returned')
- net_revenue: double precision (pre-calculated: (quantity * unit_price) - discount_amount)

CRITICAL BUSINESS RULES:
1. Always filter by `status = 'Completed'` for all sales, revenue, and product rankings, unless the user specifically asks about 'Returned' items.
2. For monthly trend or grouping by month, use `TO_CHAR(order_date, 'YYYY-MM') AS month`.
3. Output ONLY the raw SQL query. Do NOT include markdown formatting like ```sql or ```.
4. Do NOT include any explanations or conversational text.
5. Destructive operations (DROP, DELETE, INSERT, UPDATE, ALTER) are strictly forbidden. Only generate SELECT queries.
6. If the question is completely unrelated to sales, companies, products, or transactions (e.g. "tell me a joke", "what is the capital of France"), respond with exactly: CANNOT_ANSWER
"""


MODELS_TO_TRY = [GEMINI_MODEL, "gemini-3.1-flash-lite", "gemini-flash-latest"]


def generate_sql_from_question(user_question: str) -> str:
    """
    Translates a natural language question into a safe PostgreSQL SELECT query.
    Attempts secondary models if the primary model is temporarily busy (503).
    """
    if not ai_client:
        return ""

    prompt = f"{DATABASE_SCHEMA_PROMPT}\n\nUser Question: {user_question}\nSQL Query:"
    
    for model_name in MODELS_TO_TRY:
        try:
            response = ai_client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            raw_output = response.text.strip()
            
            if "CANNOT_ANSWER" in raw_output:
                return "CANNOT_ANSWER"

            # Clean markdown code fences if present
            clean_sql = re.sub(r"^```(sql)?", "", raw_output, flags=re.IGNORECASE).strip()
            clean_sql = re.sub(r"```$", "", clean_sql).strip()
            return clean_sql
        except Exception as e:
            print(f"[AI Service] Model '{model_name}' error: {e}. Trying fallback...")
            continue

    return ""



def generate_natural_answer(user_question: str, query_data: list[dict]) -> str:
    """
    Generates a clear, professional 1-2 sentence business explanation of the query results.
    """
    if not ai_client or not query_data:
        return ""

    prompt = f"""
You are a business intelligence assistant (like ChatGPT for business).
A user asked: "{user_question}"
The database returned the following data records:
{query_data}

Provide a concise, professional 1-2 sentence natural language summary answering the user's question directly with figures.
Do not mention SQL or technical database terms. Format monetary values with commas or dollar signs if applicable.
"""
    try:
        response = ai_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"[AI Service] Error generating natural answer: {e}")
        return ""


def generate_followup_questions(user_question: str, answer: str) -> list[str]:
    """
    Generates 2-3 dynamic follow-up business questions related to the conversation.
    """
    if not ai_client:
        return []

    prompt = f"""
You are an AI business intelligence advisor.
The user asked: "{user_question}"
Your answer was: "{answer}"

Suggest 3 short, insightful follow-up business questions that the user might want to ask next based on this data.
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


