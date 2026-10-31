# AI Development Log & Reflection Document

This document fulfills the assignment deliverable requirement to detail the AI tools used, development methodology, challenges encountered, debugging processes, and future improvements.

---

## 1. AI Tools Used
During the development of this challenge, the following AI tools and models were utilized:
* **Antigravity (Google DeepMind Agentic Coding Assistant)**: Used as the primary pair-programming agent for codebase architecture, iterative development, scaffolding, and verification.
* **Google Gemini API (`gemini-3.5-flash-lite`)**: Integrated directly into the runtime backend for real-time Text-to-SQL generation, schema-grounded intent extraction, and natural language summary generation.
* **GitHub Copilot / LLM Code Assistants**: Employed for boilerplate generation, regex crafting for SQL validation, and Pytest test case design.

---

## 2. How AI Was Used During Development

1. **Dataset Anomaly Discovery**:
   - Used python inspection scripts suggested by AI to scan the raw CSV for null bytes, empty strings, non-positive quantities, and unstandardized dates.
   - Identified Row 33 (`Returned` status), Row 34 (Quantity 0), and Row 51 (missing unit price).

2. **Schema & Prompt Engineering**:
   - Structured the system prompt for Gemini with exact database schemas, data types, and mandatory business rules (e.g., enforcing `status = 'Completed'` for revenue metrics).

3. **Guardrail & Security Design**:
   - Developed regular expressions and token parsers with AI assistance to ensure that any AI-generated query is strictly a read-only `SELECT` and cannot touch unauthorized tables.

4. **Component Generation**:
   - Generated modular React UI components (Dashboard cards, table with CSV export, visual chart, and proactive agentic follow-up chips).

5. **Test Generation**:
   - Crafted 13 automated test cases covering valid ground truth questions, edge cases, destructive SQL injection attempts, and file upload endpoints.

---

## 3. Problems Encountered & Debugging Processes

### Problem 1: System PostgreSQL Peer Authentication Failure
- **Symptom**: Attempting to connect to the pre-existing system PostgreSQL on port `5432` failed with `FATAL: Peer authentication failed for user "postgres"`, and `sudo` required a password.
- **Root Cause**: The system PostgreSQL installation had `peer` authentication configured for local unix sockets, which requires matching OS user accounts or root privilege.
- **Debugging & Resolution**: Created an independent, user-owned PostgreSQL 16 cluster in `/home/user/suraj_project/postgres_data` using `/usr/lib/postgresql/16/bin/initdb` with `--auth=trust` on dedicated port `5433`. Automated this into `scripts/start_postgres.sh`.

### Problem 2: SQLAlchemy 2.0 Driver Default Behavior
- **Symptom**: SQLAlchemy failed with `ModuleNotFoundError: No module named 'psycopg'` when connecting to PostgreSQL.
- **Root Cause**: In SQLAlchemy 2.0+, `postgresql://` defaults to the newer `psycopg` (v3) rather than `psycopg2`.
- **Debugging & Resolution**: Updated the connection string in `config.py` to explicitly use `postgresql+psycopg2://`, matching the installed `psycopg2-binary` package.

### Problem 3: Python String Format Error on PostgreSQL Decimal Types
- **Symptom**: FastAPI threw HTTP 500 error `ValueError: Unknown format code 'f' for object of type 'str'` when formatting `tot`.
- **Root Cause**: PostgreSQL `ROUND(SUM(...)::numeric, 2)` queries return Python `decimal.Decimal` objects. In the raw SQL serializer, non-standard types were falling into an `else` branch and converted into `str`, causing string interpolation `f"${tot:,.2f}"` to crash.
- **Debugging & Resolution**: Explicitly handled `Decimal` in `execute_raw_sql()` by casting `Decimal` to `float` prior to formatting.

### Problem 4: Model Deprecation Notice from Gemini API
- **Symptom**: API call to `gemini-2.5-flash` returned `404 NOT_FOUND` indicating the model was no longer available to new users.
- **Root Cause**: The upstream Gemini API transitioned to newer generation models.
- **Debugging & Resolution**: Inspected available models via `client.models.list()`, identified `gemini-3.5-flash-lite`, tested connectivity, and updated `.env` configuration.

---

## 4. What Would Be Improved with Another Day of Work

1. **Multi-Turn Conversation Memory**:
   - Implement session-based chat history so the user can ask context-dependent follow-up questions (e.g., *"How does that compare to the previous year?"* or *"Break that down by online vs retail"*).

2. **Query Result Caching (Redis / In-Memory LRU)**:
   - Cache frequent deterministic queries to reduce database load and achieve sub-millisecond response times.

3. **Advanced Semantic Graph & Ontology (Agentic RAG)**:
   - Introduce an ontology layer mapping business synonyms (e.g., "sales", "turnover", "gross receipts", "top sellers") to ensure 100% semantic recall without relying on pure text-matching.

4. **Interactive Multi-Chart Dashboard Builder**:
   - Provide user options to pivot charts between Bar, Line, Pie, and Area charts, with downloadable PDF business reports.

5. **Role-Based Access Control (RBAC)**:
   - Introduce authentication (JWT) and column/row-level security so regional managers can only query transactions within their assigned territory.
