"""
SQL Query Safety Validator.
Ensures that all generated or executed SQL queries are read-only (SELECT)
and do not contain destructive operations or unauthorized table access.
"""
import re

# Blacklisted destructive and modification SQL keywords
DISALLOWED_KEYWORDS = [
    "drop", "delete", "update", "insert", "alter", "truncate",
    "create", "replace", "grant", "revoke", "exec", "execute",
    "shutdown", "into outfile", "pg_sleep", "information_schema", "pg_catalog"
]

# Only this table is allowed to be queried
ALLOWED_TABLES = ["sales_records"]


def validate_sql_query(sql_query: str) -> tuple[bool, str]:
    """
    Validates a SQL query for safety.
    Returns:
        (True, "") if safe.
        (False, error_reason) if unsafe or invalid.
    """
    if not sql_query or not sql_query.strip():
        return False, "Query is empty."

    # Remove extra spaces and strip trailing semicolon
    cleaned_query = sql_query.strip()
    if cleaned_query.endswith(";"):
        cleaned_query = cleaned_query[:-1].strip()

    # Disallow multiple queries (semicolon inside statement)
    if ";" in cleaned_query:
        return False, "Multiple SQL statements are not permitted."

    # Check if the query starts with SELECT or WITH (for Common Table Expressions)
    lower_query = cleaned_query.lower()
    if not (lower_query.startswith("select") or lower_query.startswith("with")):
        return False, "Only read-only SELECT queries are permitted."

    # Check for destructive keywords
    tokens = re.findall(r"\b[a-zA-Z_]+\b", lower_query)
    for token in tokens:
        if token in DISALLOWED_KEYWORDS:
            return False, f"Destructive or unauthorized keyword detected: '{token}'."

    # Verify that the query references the allowed table
    found_allowed_table = any(table in lower_query for table in ALLOWED_TABLES)
    if not found_allowed_table:
        return False, "Query must only target the 'sales_records' table."

    return True, ""

