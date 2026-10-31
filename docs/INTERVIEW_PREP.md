# Interview Preparation Guide: AI & BI Architecture

This guide covers the core concepts highlighted in the assignment guidelines to help you excel during the technical interview.

---

## 1. Generative AI vs. Agentic AI

| Feature | Generative AI (Passive) | Agentic AI (Active) |
| :--- | :--- | :--- |
| **Workflow** | Single-turn Input $\rightarrow$ Output (e.g. text completion). | Multi-step reasoning loops (Observe $\rightarrow$ Reason $\rightarrow$ Act $\rightarrow$ Verify). |
| **Tool Use** | None or static API calls. | Dynamic tool selection, SQL query execution, and error recovery. |
| **Autonomy** | Responds only when prompted. | Proactively identifies missing context, validates queries, and suggests follow-up actions. |
| **In this Project** | Synthesizes natural language answers from query rowsets. | Manages the end-to-end cycle: inspects input, validates SQL safety, executes queries against PostgreSQL, handles errors, and suggests proactive business follow-ups. |

---

## 2. RAG vs. Vectorless RAG

### Traditional Vector RAG
* **How it works**: Embeds text chunks into high-dimensional vector spaces (e.g., cosine similarity).
* **Limitation**: Ineffective for numerical data. Asking *"What is the total revenue?"* fails because vector search retrieves semantically similar rows rather than calculating a sum across all records.

### Vectorless RAG (Used in this Project)
* **How it works**: Uses structured metadata (database schemas, column descriptions, value ranges, business rules) as the context injected into the LLM prompt.
* **Advantage**: The LLM translates business intent into precise SQL syntax (`SUM`, `AVG`, `GROUP BY`), which is executed deterministically by a relational database engine (PostgreSQL).
* **Guarantees**: 100% mathematical accuracy with zero arithmetic hallucinations.

---

## 3. Comparison of Agentic Frameworks

### 1. LangChain / LangGraph
* **Strengths**: Extensive ecosystem, hundreds of third-party integrations, flexible state machine architecture in LangGraph for complex cyclical workflows.
* **Drawbacks**: High abstraction overhead, frequent breaking changes, debugging complex chains can be challenging.

### 2. Google Agent Development Kit (Google ADK / GenAI SDK)
* **Strengths**: Native integration with Gemini models, built-in support for structured function calling, low latency, robust SDK typing.
* **Drawbacks**: Google Cloud/Gemini-centric ecosystem.

### 3. Dify
* **Strengths**: Visual, low-code workflow builder for enterprise teams, built-in prompt orchestration, RAG pipelines, and API lifecycle management.
* **Drawbacks**: Less flexibility for low-level custom Python heuristics compared to native code.

### Architectural Decision in this Project:
We implemented a **modular, framework-agnostic architecture** using FastAPI, SQLAlchemy, and Google GenAI SDK. This avoids framework bloat while providing complete control over query validation, execution guardrails, and deterministic fallbacks.

---

## 4. Key Questions & Defenses for Your Interview

### Q1: "How did you ensure the AI doesn't hallucinate numbers?"
> *"I implemented a Vectorless RAG pattern. The LLM is never asked to calculate numbers or estimate totals. Instead, the LLM generates a SQL query grounded in our database schema. That query is validated by our safety module and executed directly by PostgreSQL. The LLM only receives the verified result to format it into a business-friendly sentence."*

### Q2: "How do you protect the database against SQL injection or accidental deletion?"
> *"We enforce multi-layer defense in depth:*
> 1. *Read-Only Enforcement: Only queries starting with `SELECT` or `WITH` are allowed.*
> 2. *Keyword Blacklist: Hard rejection of destructive keywords like `DROP`, `DELETE`, `UPDATE`, `INSERT`, `TRUNCATE`, `ALTER`.*
> 3. *Multi-Statement Block: Prevents semicolon chaining.*
> 4. *Table Whitelist: Strictly enforces that only the `sales_records` table is queryable.*
> 5. *Database User Permissions: The database role is restricted from accessing system catalogs."*

### Q3: "What data quality issues were in the raw CSV, and how did you handle them?"
> *"We audited the raw dataset with Pandas and identified three critical issues:*
> 1. *Row 34 had Quantity = 0: Dropped as an invalid non-viable order.*
> 2. *Row 51 had a missing Unit Price for 'Laptop Stand': Imputed using the median unit price of Laptop Stand ($1,200) across the rest of the dataset.*
> 3. *Row 33 was marked as 'Returned': Preserved in the database for full transaction auditing, but filtered out with `status = 'Completed'` when computing revenue metrics."*

