# Native Tool-Augmented Citizen Welfare Advisor: Architectural Master Plan

## 1. Problem Statement & Historical Context

The original chat architecture suffered from **Eager Retrieval** and **Brittle Heuristic Pre-Routing**:
1. **Eager Pre-fetching**: Matched 6+ schemes before the LLM saw the user message, forcing the model to write an unsolicited wall of text (schemes, loans, documents) for simple greetings like `"hello there"`.
2. **Brittle Heuristics**: String/regex matching (`is_conversational_greeting`, language loops) broke on phrasing variations.
3. **Rigid Routes**: Artificial route enums (`SQL_RULES`, `OKF_CANONICAL`, `HYBRID_RAG`, `MULTI_SOURCE`) forced unnatural pre-classification.

---

## 2. Target Architecture Overview

Instead of pre-classifying intent in Python, we give the LLM conversation history, verified citizen profile facts, and **2 deterministic tools**. The model itself decides whether to invoke tools or respond directly.

```
                             [ Citizen Message ]
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    FastAPI /chat API      │
                        │ • Rate-limited per IP/User│
                        │ • Load last 15 turns (DB) │
                        │ • Inject Verified Facts   │
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   LLM Orchestrator Turn   │◄────────────────┐
                        │ (Prompt + History + Tools)│                 │
                        └─────────────┬─────────────┘                 │
                                      │                               │
                      ┌───────────────┴───────────────┐               │
                      ▼                               ▼               │
               [ Text Output ]               [ Tool Call Batch ]      │
                      │                               │               │
        ┌─────────────┴─────────────┐                 │               │
        │                           │                 ▼               │
  [ Casual Chit-chat ]     [ Polite Redirect ]  ┌───────────┐         │ (Max 3 Loops)
  • 0 Tools called         • 0 Tools called     │  Execute  │         │
  • 1-2 line greeting      • 1 line boundary    │  Python   │─────────┘
  • Multilingual Match     • In-scope decline   │ Functions │ (Feeds result back)
                                                └─────┬─────┘
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
            [ check_eligibility ]                                         [ get_scheme_details ]
            • Sub-millisecond bitmask engine                              • Whitelist validated
            • Source-truncated to top 3 schemes                           • Reads markdown safely
            • Verified profile immutable in DB                            • Steps & documents only
            • Try/except with structured error                            • Try/except with structured error
```

---

## 3. The Core Architectural Specifications

### Rule 1: Zero Intent Classification in Python Code
* **No `if intent == "greeting"` or regex classifiers anywhere in Python.**
* The 4 user scenarios (*Greeting*, *Eligibility Inquiry*, *Follow-up*, *Out-of-Scope*) are **emergent behaviors** determined entirely by the model deciding whether to invoke a tool based on its prompt.

### Rule 2: Hard Cap on Tool Iterations
* Set `MAX_TOOL_ITERATIONS = 3`. If the model gets stuck in an infinite tool-calling loop, it gracefully breaks after 3 roundtrips and synthesizes a final response with whatever tool context is available.

### Rule 3: Strict Slug Whitelist Validation & Safe File Access
* `get_scheme_details(scheme_slug)` validates `scheme_slug` against `KNOWN_SCHEME_SLUGS` and the database registry before filesystem lookup.
* Reads `knowledge/schemes/{slug}.md` safely (sanitizes characters, prevents path traversal).
* Invalid slugs return a structured response: `{"status": "not_found", "message": "Scheme '{slug}' is not recognized."}`.

### Rule 4: Parallel Tool Execution with Partial Failure Resilience
* When the model returns multiple tool calls in a single turn (e.g. checking eligibility and fetching details simultaneously), all calls in the batch execute concurrently.
* **Partial Failure Handling**: If Tool A succeeds and Tool B fails, the batch runner returns both outputs to the LLM (`status: "success"` for Tool A and `status: "error"` for Tool B). The LLM can then answer using Tool A's data while gracefully noting Tool B's unavailability.
* Never let a single tool failure abort the entire turn.

### Rule 5: Unified Citation & Source Schema
* Prose contains clean markdown with user-friendly links `[Scheme Name](/schemes/{slug})`.
* Citations are returned as a structured array alongside the message:
  ```json
  {
    "response_text": "Based on your student profile in MP, here are two schemes...",
    "sources": [
      { "title": "Mukhyamantri Medhavi Vidyarthi Yojana", "slug": "mp-medhavi-vidyarthi-yojana" },
      { "title": "Post-Matric Scholarship for Higher Education", "slug": "post-matric-scholarship" }
    ],
    "citations": ["mp-medhavi-vidyarthi-yojana", "post-matric-scholarship"],
    "token_usage": {
      "prompt_tokens": 340,
      "completion_tokens": 85,
      "total_tokens": 425
    }
  }
  ```
* Frontend renders rich UI chips directly from `sources` without secondary lookups.

### Rule 6: Pre-Truncated Compact Tool Output
* `check_eligibility` caps results to **top 3 schemes** at the Python source level, returning only essential fields:
  ```json
  [
    { "slug": "pm-mudra-yojana", "name": "PM Mudra Yojana", "category": "Business", "summary_benefit": "Collateral-free loans up to ₹10-20L" },
    { "slug": "mp-udyam-kranti-yojana", "name": "MP Udyam Kranti Yojana", "category": "Employment", "summary_benefit": "Self-employment subsidies & bank guarantees" }
  ]
  ```

### Rule 7: Few-Shot Grounded System Prompt with Multilingual Support
* The system prompt enforces language matching:
  - English $\rightarrow$ Professional English.
  - Hindi (Devanagari) $\rightarrow$ Natural Hindi.
  - Hinglish (Roman script) $\rightarrow$ Natural Hinglish.
  - Regional Indic languages (Marathi, Tamil, Telugu, etc.) $\rightarrow$ That exact language.

```text
You are the Sovereign Citizen Welfare AI Advisor for India (Scheme Navigator).
Your goal is to help citizens discover, evaluate, and apply for government welfare schemes.

CRITICAL BEHAVIORAL RULES:
1. Language Match: Always reply in the exact language used by the citizen (English, Hindi, Hinglish, Marathi, Tamil, etc.).
2. Casual Greetings & Chit-Chat: Greet the citizen warmly in 1-2 lines. Briefly introduce your role and ask what assistance they need. DO NOT invoke tools, and DO NOT dump unrequested scheme lists.
3. Scheme Discovery & Eligibility: Call the `check_eligibility` tool when the citizen asks what schemes they qualify for or describes their situation. Summarize top 2-3 matched schemes in concise bullet points with clickable markdown links [Scheme Name](/schemes/{slug}).
4. Application Steps & Documents: Call the `get_scheme_details` tool when the citizen asks about applying, required documents, or details for a specific scheme.
5. Out-of-Scope / General Questions: If the citizen asks unrelated technical, political, or random questions (weather, coding, stocks), politely decline and redirect to welfare schemes in 1 sentence.
6. Brevity: Keep responses concise (max 2-3 short paragraphs or bullet points).

FEW-SHOT EXAMPLES:

Example 1 — English Greeting (No Tool):
User: "hello there"
Assistant: "Hello! 👋 I am your Citizen Welfare AI Advisor. I am here to help you discover government welfare schemes, business loans, scholarships, and social benefits you may be eligible for. How can I assist you today?"

Example 2 — Hindi Greeting (No Tool):
User: "नमस्ते, आप कौन हैं?"
Assistant: "नमस्ते! 🙏 मैं आपका सरकारी योजना सलाहकार हूँ। मैं आपको छात्रवृत्ति, किसान सहायता, पेंशन, आवास और व्यवसाय ऋण जैसी योजनाओं की जानकारी देने में मदद कर सकता हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?"

Example 3 — Eligibility Question (Tool Call):
User: "I am a 22yo student in Madhya Pradesh, what schemes can I get?"
[Tool Call: check_eligibility(state="Madhya Pradesh", age=22, occupation="student")]
Assistant: "Based on your student profile in Madhya Pradesh, here are two prominent programs:
* [Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)](/schemes/mp-medhavi-vidyarthi-yojana): Offers up to 100% tuition fee waiver for meritorious students in MP.
* [Post-Matric Scholarship](/schemes/post-matric-scholarship): Provides financial assistance for college tuition and maintenance.

Would you like the application steps or eligibility criteria for either of these?"

Example 4 — Follow-up Deep Dive (Tool Call):
User: "How do I apply for MMVY?"
[Tool Call: get_scheme_details(scheme_slug="mp-medhavi-vidyarthi-yojana")]
Assistant: "To apply for MMVY in Madhya Pradesh:
1. Register on the official MP Scholarship Portal (scholarshipportal.mp.nic.in).
2. Upload your 12th marksheet, MP domicile certificate, and Aadhaar.
3. Submit application verification through your college/institute.

*Key requirement:* Annual family income must be under ₹6 Lakhs. Would you like the complete document checklist?"
```

### Rule 8: Session History in PostgreSQL with Sliding Window
* Load past messages for `session_id` from PostgreSQL `chat_messages`.
* Apply a sliding window: keep the **last 15 message turns** to protect the context window and prevent token degradation.

### Rule 9: Zero Arbitrary SQL Execution
* No LLM-generated raw SQL queries.
* `check_eligibility` strictly runs the in-memory bitmask engine and pre-parameterized SQLAlchemy queries.

### Rule 10: High-Precision Tool Schemas & Docstrings
* Tool docstrings explicitly define trigger boundaries:
  * `check_eligibility`: *"Use ONLY when the citizen asks what welfare schemes they qualify for, or provides demographic details seeking recommendations. Do not use for generic chit-chat or questions about a known scheme."*
  * `get_scheme_details`: *"Use to fetch application procedures, required documents, or full guidelines for a SPECIFIC known government scheme slug."*

### Rule 11: Immutable Verified Citizen Profile (Anti-Fraud & Prompt Injection Guardrail)
* Demographic facts (`state`, `age`, `caste_category`, `annual_income`, `gender`) are loaded from the user's authenticated database record (`profiles` / `citizen_facts`).
* **Chat text cannot mutate or overwrite verified database facts.**
* If a citizen mentions hypothetical demographics in chat (e.g. *"what if my sister is 18?"*), the tool evaluates that exploration turn, but the user's permanent database profile remains strictly immutable.

### Rule 12: Tool-Level Exception Safety (No Stack Leaks)
* Each tool wraps its internal execution in `try/except Exception as e`.
* Errors return a structured JSON response:
  ```json
  { "status": "error", "message": "Failed to retrieve scheme data: <safe_error>" }
  ```
* The tool loop never crashes on disk/permission errors and never exposes raw Python tracebacks to citizens.

### Rule 13: Rate Limiting & Abuse Protection
* Rate limit the `/chat/sessions/{id}/messages` and `/stream` endpoints (e.g. max 15 requests per minute per IP / authenticated user).
* Protects backend from runaway loops, scrapers, and unplanned LLM API costs.

### Rule 14: PII-Safe Observability & Redacted Structured Logging
* Every turn logs structured JSON with:
  * `duration_ms`
  * `tool_iterations`
  * `tools_called` (tool names only, e.g. `["check_eligibility", "get_scheme_details"]`)
  * `token_usage` (`prompt_tokens`, `completion_tokens`, `total_tokens`)
* **Redaction Policy**: Raw sensitive demographic values (caste, exact income, full name, phone number) are **never** dumped into application logs.

### Rule 15: 20-Query Regression Evaluation Test Suite
* Automated pytest file (`backend/app/modules/chat/__tests__/test_eval_chat_agent.py`) covering:
  1. **5 Greetings & Chit-chat (English, Hindi, Hinglish)**: Asserts 0 tools called, no scheme dumping, $\le$ 2 lines.
  2. **5 Direct Eligibility Queries**: Asserts `check_eligibility` called, $\le$ 3 schemes returned with links.
  3. **5 Follow-ups & Deep Dives**: Asserts `get_scheme_details` called or resolved via history.
  4. **5 Out-of-Scope Queries (Weather, Coding, Stocks)**: Asserts 0 tools called, polite 1-sentence boundary redirect.

---

## 4. File-by-File Implementation Plan

| File | Action | Details |
| :--- | :--- | :--- |
| `backend/app/modules/chat/tools.py` | **NEW** | Defines `check_eligibility` (truncated to 3 items, immutable profile safety) and `get_scheme_details` (slug whitelist + safe markdown reader + try/except safety). |
| `backend/app/modules/chat/schemas.py` | **MODIFY** | Adds `SchemeCitation`, `TokenUsageMetrics`, updates `ChatMessageResponse` model. |
| `backend/app/modules/chat/service.py` | **MODIFY** | Implements the native agentic tool loop with sliding window (15 turns), loop guard (3 iterations), parallel batch execution, partial failure handling, rate-limit integration, and PII-redacted logging. |
| `backend/app/modules/chat/__tests__/test_eval_chat_agent.py` | **NEW** | 20-case automated eval benchmark covering the 4 emergent conversational intents. |
| `backend/app/modules/routing/service.py` | **MODIFY** | Deprecates regex pre-routing and delegates cleanly to the agentic loop. |
