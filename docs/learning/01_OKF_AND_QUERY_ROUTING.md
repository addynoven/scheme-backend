# 📖 Chapter 1: Open Knowledge Framework (OKF) & Intelligent Query Router

> **Milestone:** V2.5 / Phase 5  
> **Core Concept:** How to structure canonical government knowledge for AI agents and route user queries without hallucinations.

---

## 1. The Core Problem: Why Neither SQL nor Naive RAG is Enough

When developers build AI systems for government benefits, they usually fall into one of two traps:

### Trap 1: "Put Everything in PostgreSQL Columns"
```sql
CREATE TABLE schemes (
  id INT,
  name TEXT,
  how_to_apply TEXT, -- Unstructured paragraph
  exceptions TEXT,   -- 50-line edge cases
  grievance_steps TEXT
);
```
- **Why it breaks:** Government rules have rich contextual hierarchies, contact tables, multi-step grievance workflows, and edge cases that relational tables struggle to represent cleanly.

### Trap 2: "Throw All PDFs into a Vector Database (Naive RAG)"
```text
Government PDF ──▶ Chunk every 500 chars ──▶ Vector DB ──▶ Cosine Search
```
- **Why it breaks:** Blindly chopping documents destroys context. A paragraph saying *"Applicants must be under 35 years"* gets disconnected from the header *"Section 4.2: Applicable only to SC/ST category"*. The LLM hallucinates because it receives fragmented text.

---

## 2. What is OKF (Open Knowledge Framework)?

**OKF is the Goldilocks zone:** A standardized, human-readable AND machine-readable knowledge hierarchy stored as versioned Markdown files with strict YAML frontmatter.

```text
knowledge/
├── index.md
├── schemes/
│   ├── pm-kisan.md
│   ├── ladli-behna.md
│   └── sukanya-samriddhi.md
├── documents/
│   ├── income-certificate.md
│   ├── caste-certificate.md
│   └── domicile-certificate.md
└── ministries/
    ├── ministry-of-agriculture.md
    └── women-and-child-development.md
```

### Anatomy of an OKF File (`knowledge/schemes/pm-kisan.md`)

```markdown
---
id: "pm-kisan"
slug: "pm-kisan-samman-nidhi"
title: "Pradhan Mantri Kisan Samman Nidhi"
ministry: "Ministry of Agriculture and Farmers Welfare"
government_level: "central"
benefit_type: "Direct Benefit Transfer (DBT)"
benefit_amount_inr: 6000
benefit_frequency: "Yearly (₹2,000 every 4 months)"
official_portal: "https://pmkisan.gov.in"
last_verified_at: "2026-08-01"
source_circular_no: "AGRI/2019/PK-889"
related_documents:
  - "aadhaar-card"
  - "land-record-khasra"
  - "bank-passbook"
tags:
  - "farmer"
  - "agriculture"
  - "income-support"
---

# Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)

## 1. Overview
PM-KISAN is a Central Sector Scheme providing income support of ₹6,000 per year to all landholding farmer families across India.

## 2. Key Eligibility Criteria
1. The family must own cultivable agricultural land.
2. The landholder must not be a serving or retired government employee.
3. Institutional landholders are excluded.

## 3. Step-by-Step Application Process
1. Visit the official portal [pmkisan.gov.in](https://pmkisan.gov.in).
2. Click on **"Farmers Corner"** -> **"New Farmer Registration"**.
3. Enter your Aadhaar number and State.
4. Upload your Land Record (Khasra/Khatauni) copy.
5. Submit the application and save the registration ID.

## 4. Grievance Redressal
- **Toll-Free Helpline:** `155261` / `011-24300606`
- **Email:** `pmkisan-ict@gov.in`
```

### Why AI Agents Love OKF:
1. **Zero Hallucination:** The YAML header provides deterministic metadata (Ministry, Amount, Verified date).
2. **Structural Integrity:** Headings (`## 1. Overview`, `## 3. Application Process`) preserve semantic context.
3. **Version Controlled:** Every policy change is tracked in Git with author and timestamp.

---

## 3. What is a Query Router?

A **Query Router** is a traffic controller that inspects an incoming user question and decides **which subsystem can answer it most reliably**.

```text
                                CITIZEN QUESTION
                                       │
                                       ▼
                              QUERY ROUTER (Intent)
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
  PATH 1: SQL / RULES            PATH 2: OKF CANONICAL          PATH 3: HYBRID RAG
  "Am I eligible for PM Kisan?"  "How do I apply for Ladli?"    "What is clause 4.2 exception?"
        │                              │                              │
        ▼                              ▼                              ▼
  PostgreSQL Rules Engine        Read structured .md            Retrieve vector chunks + BM25
        │                              │                              │
        └──────────────────────────────┼──────────────────────────────┘
                                       │
                                       ▼
                             CONSOLIDATED ANSWER
                           + MANDATORY SOURCE CITATION
```

---

## 4. How the Query Router Decides

| User Query | Detected Intent | Route | Why This Route? |
| :--- | :--- | :--- | :--- |
| *"I am 24 years old with 1.5 Lakh income, what schemes can I get?"* | `ELIGIBILITY_CHECK` | **SQL & Rules Engine** | Requires dynamic filtering (`age >= 18`, `income <= 200000`) on verified facts. |
| *"What documents do I need for Ladli Behna Yojana?"* | `SCHEME_REQUIREMENTS` | **OKF Canonical** | Directly answered by `knowledge/schemes/ladli-behna.md` frontmatter & body. |
| *"Who is the grievance officer for agriculture schemes in Sehore district?"* | `CONTACT_MINISTRY` | **OKF Canonical** | Answered by `knowledge/ministries/` hierarchy. |
| *"Can my second cousin inherit pension if the land deed was stamped before 1998?"* | `UNSTRUCTURED_EDGE_CASE` | **Hybrid RAG** | Unstructured legal edge case not in canonical summary; requires document chunk retrieval. |

---

## 5. Pragmatic Implementation (Python Fast Pattern)

```python
from enum import Enum
from pydantic import BaseModel

class RouteTarget(str, Enum):
    SQL_RULES = "sql_rules"
    OKF_CANONICAL = "okf_canonical"
    HYBRID_RAG = "hybrid_rag"

class RouteDecision(BaseModel):
    target: RouteTarget
    confidence: float
    target_slug: str | None = None  # e.g., "pm-kisan" if scheme-specific
    reasoning: str

def route_citizen_query(query: str, user_has_profile: bool = False) -> RouteDecision:
    q = query.lower()
    
    # 1. Fast Deterministic Keyword Rules (Zero LLM cost)
    if any(phrase in q for phrase in ["am i eligible", "check eligibility", "can i get", "my chances"]):
        return RouteDecision(
            target=RouteTarget.SQL_RULES,
            confidence=1.0,
            reasoning="Query asks for personal eligibility evaluation."
        )
    
    if any(phrase in q for phrase in ["how to apply", "required documents", "official website", "helpline"]):
        return RouteDecision(
            target=RouteTarget.OKF_CANONICAL,
            confidence=0.95,
            reasoning="Query asks for canonical procedural scheme knowledge."
        )
    
    # 2. Ambiguous or edge queries fall back to RAG
    return RouteDecision(
        target=RouteTarget.HYBRID_RAG,
        confidence=0.80,
        reasoning="Query involves complex context or edge policy rules."
    )
```

---

## 📚 Recommended External Resources to Read

1. **Structured Knowledge & Agents:**
   - [LlamaIndex: Routing & Multi-Document Agents](https://docs.llamaindex.ai/en/stable/module_guides/querying/router/)
   - [LangChain: Semantic Router Guide](https://python.langchain.com/docs/how_to/routing/)
2. **Markdown as an LLM Database:**
   - [Simon Willison: Embeddings and Markdown Knowledge Bases](https://simonwillison.net/2023/Oct/23/embeddings/)
3. **Intent Classification:**
   - [HuggingFace: Zero-Shot Text Classification](https://huggingface.co/tasks/zero-shot-classification)
