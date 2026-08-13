# 🏛️ Government Benefits Navigator — Master Versioned Architecture Blueprint

> **"A citizen gives the system their information once. The system continuously helps them discover, understand, verify, and access government benefits and services relevant to their life."**

```text
LLM interprets.
Database stores.
Rules engine decides.
OKF represents canonical knowledge.
RAG retrieves uncertain/unstructured knowledge.
Reranker prioritizes evidence.
Citations prove claims.
Human confirms personal information.
MCP exposes capabilities to agents.
```

---

## 🗺️ Master Release Roadmap at a Glance

| Version | Milestone Name | Focus / Core Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **V1.0** | **The Deterministic Core** | 4-Screen Flow, Rule Engine, Explainability, 12 National Schemes, Docker Stack | ✅ **Completed** |
| **V1.1** | **State Schemes Expansion** | State-level benefits (Madhya Pradesh, Maharashtra, Karnataka) | 🎯 **Next** |
| **V1.2** | **Admin Management Portal** | Web UI to create, edit, and toggle schemes without SQL | 📋 Planned |
| **V1.3** | **Document Vault & Readiness** | S3 Document storage & live Scheme Application Readiness Meter | 📋 Planned |
| **V2.0** | **OCR & Fact Extraction** | Auto-extract facts from Aadhaar/Certificates with human verification | 📋 Planned |
| **V2.5** | **OKF Canonical Knowledge** | Structured agent-readable knowledge layer & Query Router | 📋 Planned |
| **V3.0** | **Hybrid RAG & Provenance** | BM25 + Vector + Cross-Encoder Reranker + Mandatory Citations | 📋 Planned |
| **V3.5** | **MCP Agent Server** | Standard Model Context Protocol tools for autonomous AI agents | 📋 Planned |
| **V4.0** | **Life-Event Intelligence** | Proactive triggers on life changes (College, 18+, 60+, Marriage) | 📋 Planned |

---

# 📦 Detailed Version Specifications

---

## 🟢 V1.0 — The Deterministic Core *(Completed & Live)*

### Objective
Provide a zero-friction, login-free 4-screen citizen web experience backed by a deterministic rules engine and 12 flagship national schemes.

```text
Home (/)  ──▶  Eligibility Form (/check)  ──▶  Results (/results)  ──▶  Scheme Details (/schemes/:slug)
```

### Key Deliverables
* **4-Screen Citizen Web App**:
  * `Home (/)`: Need-based search (`"fertilizer"`, `"pension"`), persona pills (Farmer, Student, Women, Senior), popular schemes.
  * `Eligibility Form (/check)`: 4-question form (Age, Gender, State, Occupation, Income INR). No login required.
  * `Results Dashboard (/results)`: Categorized buckets (**Fully Eligible (100%)** vs **Nearly Eligible (50-99%)** with itemized passed/failed reasons).
  * `Scheme Details (/schemes/:slug)`: Benefits breakdown, criteria checks (`✓`/`✗`), required documents, and official portal application link.
* **Backend Rules Engine**:
  * Dynamic relational operators: `=`, `lte`, `gte`, `between`, `in`.
  * Explainability engine producing human-friendly natural language verdicts.
* **Database & Infrastructure**:
  * PostgreSQL 17 + Alembic versioned migrations + MinIO S3.
  * 12 Seeded Flagship Schemes (PM-Kisan, Ayushman Bharat, PMAY-G, Mudra, Sukanya Samriddhi, Vishwakarma, etc.).
  * 1-Command Docker Compose (`docker compose up -d`).
  * 39/39 Automated Backend Tests passing.

---

## 🎯 V1.1 — State-Specific Scheme Expansion *(Next Milestone)*

### Objective
Expand coverage beyond national schemes into high-impact state-level welfare programs where >70% of citizen funds reside.

```text
Citizen Location (e.g. Madhya Pradesh)
         │
         ▼
Evaluate National Schemes + State-Specific Schemes
         │
         ▼
Display Unified Opportunities (e.g. PM-Kisan + MP CM Kisan Kalyan)
```

### Key Deliverables
* **State Schemes Dataset**:
  * **Madhya Pradesh**: *Ladli Behna Yojana* (₹1,250/mo), *Mukhya Mantri Kisan Kalyan Yojana* (₹6,000/mo state top-up to PM-Kisan).
  * **Maharashtra**: *Majhi Ladki Bahin Yojana*, *Namo Shetkari Mahasanman Nidhi*.
  * **Karnataka**: *Gruha Lakshmi*, *Yuva Nidhi* (Unemployment stipend for graduates).
* **Multi-Tier Rule Evaluation**:
  * Evaluate rules scoped by `state = 'Madhya Pradesh'` or `state = 'ALL_INDIA'`.
* **State Filter & Badging in UI**:
  * Visual badges indicating `National Scheme` vs `State Scheme (MP)`.

---

## 📋 V1.2 — Admin Scheme Management Portal

### Objective
Allow non-technical administrators to create, update, and toggle welfare schemes and eligibility rules via a secure web UI without touching code or SQL.

```text
Admin Portal (/admin)
  ├── Scheme Metadata (Name, Ministry, Description, Portal URL)
  ├── Rule Builder (Select field, operator: <=, >=, between, value)
  ├── Benefits Manager (Type, Cash amount, Description)
  └── Required Documents Checklist (Mandatory vs Optional)
```

### Key Deliverables
* **Admin Dashboard UI (`/admin`)**:
  * Scheme table with search, status toggle (`active` / `inactive`), and edit triggers.
* **Visual Rule Builder**:
  * Dropdown UI to configure rules without writing code:
    `[ Age ] [ >= ] [ 60 ]`
    `[ Income ] [ <= ] [ 1,50,000 ]`
* **RBAC Enforcement**:
  * Restrict `/admin` endpoints to users with `role: "admin"` via JWT.

---

## 📋 V1.3 — Document Vault & Live Readiness Meter

### Objective
Enable citizens to store documents securely in MinIO S3 and view real-time application readiness scores before applying.

```text
Citizen Document Vault
  ├── Aadhaar Card (✓ Uploaded)
  ├── Bank Passbook (✓ Uploaded)
  └── Income Certificate (✗ Missing)
         │
         ▼
Readiness Score: 66.7% Ready
Action: "Upload Income Certificate to reach 100% Readiness"
```

### Key Deliverables
* **MinIO S3 Vault Dropzone**:
  * Secure presigned URL uploads with server-side mime-type & size validation.
* **Live Readiness Evaluator**:
  * Compares uploaded documents against scheme `required_documents`.
  * Returns percentage score (e.g. 2 of 3 documents present $\to$ `66.7% Ready`).
* **Document Checklist in UI**:
  * Visual checklist showing which documents are ready and which need to be obtained.

---

## 📋 V2.0 — OCR Ingestion & Fact Extraction

### Objective
Eliminate manual form-filling by auto-extracting citizen facts from uploaded identity cards and certificates with human-in-the-loop verification.

```text
Upload Document (Aadhaar / Ration Card / Income Certificate)
  ↓
OCR & Entity Extraction Pipeline
  ↓
Confidence Scoring & Normalization
  ↓
Citizen Confirmation Screen:
  "We detected your Annual Income as ₹1,80,000 from Income Certificate."
  [ Correct / Confirm ]    [ Edit ]
  ↓
Verified Fact Stored in Citizen Profile
```

### Key Deliverables
* **OCR Ingestion Engine**:
  * Extract text and structured fields from images/PDFs.
* **Traceable Fact Model**:
  * Every profile fact maintains provenance:
    `fact: "annual_income", value: 180000, source: "income_certificate.pdf", verified_at: timestamp`.
* **Human-in-the-Loop UI**:
  * Clean review modal for citizens to confirm or edit auto-extracted data.

---

## 📋 V2.5 — OKF (Open Knowledge Framework) & Canonical Representation

### Objective
Create a structured, agent-readable knowledge layer preserving official hierarchy and establish a Query Router.

```text
                      CITIZEN QUERY
                            │
                            ▼
                     QUERY ROUTER
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
     STRUCTURED         CANONICAL          UNKNOWN /
    RULE / SQL          KNOWLEDGE          AMBIGUOUS
    (FastAPI)             (OKF)              (RAG)
```

### Key Deliverables
* **Canonical OKF Repository (`knowledge/`)**:
  * Structural Markdown representation of schemes, documents, ministries, and processes.
* **Knowledge Versioning & Freshness**:
  * Track official gazette amendment dates and revision history.
* **Smart Query Router**:
  * Directs questions to the right layer (Deterministic DB vs OKF vs RAG).

---

## 📋 V3.0 — Hybrid RAG & Provenance Citations

### Objective
Handle messy, unstructured circulars and FAQs using hybrid search, reranking, and mandatory source citations.

```text
Citizen Query
  ↓
Hybrid Retrieval (BM25 Keyword + Dense Vector Embeddings)
  ↓
Cross-Encoder Reranking (Prioritize highest-evidence passages)
  ↓
Dynamic Top-K Evidence Selection
  ↓
LLM Synthesis with Mandatory Citations:
  "Claim: Eligible up to age 35. [Source: Gazette Notification 2024, Page 4, Section 2b]"
```

### Key Deliverables
* **Hybrid Search Engine**:
  * BM25 sparse lexical search + Dense vector embeddings.
* **Cross-Encoder Reranker**:
  * Filters out low-confidence hallucinations and prioritizes exact regulatory text.
* **Verifiable Citation Links**:
  * Every sentence in an AI response links to the specific official government page/section.

---

## 📋 V3.5 — MCP (Model Context Protocol) Server

### Objective
Expose the complete system capabilities through standard MCP tools so autonomous AI agents can operate the platform securely.

```text
Autonomous AI Agent
         │
         ▼
   [ MCP Server ]
   ├── find_schemes(query, filters)
   ├── check_eligibility(citizen_profile)
   ├── get_required_documents(scheme_slug)
   ├── calculate_readiness(user_id, scheme_slug)
   └── get_official_sources(scheme_slug)
         │
         ▼
Application Services & Database
```

### Key Deliverables
* **FastAPI MCP Server**:
  * Exposes typed tools adhering to the Model Context Protocol.
* **Agent Sandboxing**:
  * Strict permission boundaries ensuring agents read only authorized citizen facts.

---

## 📋 V4.0 — Life-Event Intelligence Engine

### Objective
Transform the platform from reactive search into a proactive life assistant that notifies citizens as their life evolves.

```text
Life Event Detected
  • Daughter turns 18 / enters College
  • Citizen turns 60
  • Moved from Bihar to Maharashtra
  • Family income bracket changed
         │
         ▼
Background Profile Re-evaluation
         │
         ▼
Proactive Citizen Notification:
  "Your daughter recently turned 18 and entered college. 
   You now qualify for 3 new Higher Education Scholarships!"
```

### Key Deliverables
* **Life-Event Trigger Service**:
  * Background event listener monitoring demographic milestones and user updates.
* **Proactive Notification Engine**:
  * Auto-evaluates newly applicable schemes and alerts the citizen with immediate next actions.

---

# 🏗️ Architectural Summary: The Long-Term Stack

```text
                         CITIZEN
                            │
                            ▼
                    MOBILE / WEB APP
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
     PROFILE (V1)     DOCUMENTS (V1.3)     CHAT (V2.5+)
          │                 │                 │
          │                 ▼                 ▼
          │           OCR/PARSER (V2.0)  QUERY ROUTER (V2.5)
          │                 │                 │
          │                 ▼       ┌─────────┼─────────┐
          │          VERIFIED FACTS  │         │         │
          │                 │        ▼         ▼         ▼
          │                 │       SQL       OKF       RAG
          │                 │      (V1.0)    (V2.5)    (V3.0)
          └─────────────────┼────────┴─────────┴─────────┘
                            │
                            ▼
                   RECOMMENDATION ENGINE (V1.0 - V4.0)
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
          DASHBOARD      CITATIONS    LIFE EVENTS
           (V1.0)         (V3.0)         (V4.0)
                                            │
                                            ▼
                                   NEXT ACTION & APPLY
```
