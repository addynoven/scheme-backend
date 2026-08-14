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

## 🗺️ Master Release Roadmap & Progress Audit

| Version / Phase | Milestone Name | Focus / Core Deliverable | Status |
| :--- | :--- | :--- | :--- |
| **V1.0 / Phase 1** | **The Deterministic Core** | 4-Screen Flow, Rule Engine, Explainability, National Schemes, Docker Stack | ✅ **Completed** |
| **V1.1 / Phase 2** | **State Schemes Expansion** | Flagship state benefits (Madhya Pradesh, Maharashtra, Karnataka) & Location Matching | ✅ **Completed** |
| **V1.2 / Phase 4** | **Admin Management Portal** | Web UI to create, edit, and toggle schemes without SQL, Visual Rule Builder | ✅ **Completed** |
| **V1.3 / Phase 1** | **Document Vault & Readiness** | S3 Document storage & live Scheme Application Readiness Meter | ✅ **Completed** |
| **V1.5** | **Government Ingestion Pipeline** | Two-Phase Semantic CDC + Circuit Breaker + MinIO Staging + Triage Queue | ✅ **Completed** |
| **V2.0 / Phase 1** | **OCR & Fact Extraction** | Gemini 3.5 Flash Multimodal Vision + Strict JSON + Citizen Verification Modal | ✅ **Completed** |
| **V2.1** | **Citizen Facts Provenance Trail** | `citizen_facts` table with origin audit trail (`source_document_id`, `verified_at`) | ✅ **Completed** |
| **V2.5** | **OKF Canonical Knowledge Base** | Domain-partitioned hierarchy, 100% valid Frictionless Data Package, Table Schema constraints | ✅ **Completed** |
| **V2.6 / Phase 5** | **Intelligent Query Router** | Dynamic intent router between Deterministic SQL Engine, OKF Markdown, and RAG | 🎯 **In Progress** |
| **V2.7 / Phase 5** | **Household & Family Graph** | Multi-member family profiling (`household_members`) for daughter/elderly schemes | 🎯 **Current Focus** |
| **V2.8 / Phase 5** | **Conversational Citizen Chat** | Multi-turn chat assistant, streaming SSE, profile fact injection, contextual guidance | 🎯 **Current Focus** |
| **V2.9 / Phase 5** | **Voice-First Audio Interface** | Multilingual Audio-to-Text (STT) + Text-to-Speech (TTS) for regional Indian languages | 🎯 **Current Focus** |
| **V2.10** | **Application Tracking Ledger** | Milestone tracker (`scheme_applications`: `DRAFT` ➔ `DOCS_READY` ➔ `SUBMITTED` ➔ `DISBURSED`) | 📋 Planned |
| **V2.11** | **Scheme Application Kit (PDF)** | Printable checklist + verified document QR links + CSC/Jan Seva Kendra guidance | 📋 Planned |
| **V2.12** | **DBT Troubleshooter & Grievance** | NPCI Aadhaar bank seeding diagnosis + CPGRAMS / CM Helpline grievance drafter | 📋 Planned |
| **V2.13** | **DPDP 2023 & Aadhaar Guardrails** | Automatic 8-digit Aadhaar masking (`XXXX-XXXX-1234`) and consent management | 📋 Planned |
| **V3.0 / Phase 6** | **Hybrid RAG & Citations** | BM25 + Vector + Cross-Encoder Reranker + Mandatory File Citations | 📋 Planned |
| **V3.5 / Phase 7** | **MCP Agent Server** | Standard Model Context Protocol tools for autonomous AI agents | 📋 Planned |
| **V4.0 / Phase 8** | **Life-Event Intelligence** | Proactive triggers on life changes (College, 18+, 60+, Marriage, Income change) | 📋 Planned |
| **V5.0** | **Universal Global Expansion** | Multi-Country ISO 3166-1 (USA/UK/IN/CA), Multi-Currency, Global Taxonomies | 🔮 Future |

---

# 📦 20-Section Architectural Specification & Audit

---

### 1. Citizen Experience ✅ (Completed)
```text
                    CITIZEN
                       │
                       ▼
              ┌─────────────────┐
              │ Create Profile  │
              └────────┬────────┘
                       │
                       ▼
               Upload Documents
                       │
                       ▼
                  OCR + Parser
                       │
                       ▼
              Extract Citizen Facts
                       │
                       ▼
              User Verification
                 /           \
              Correct       Edit
                 \           /
                       ▼
              VERIFIED PROFILE
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Dashboard       Chat      Documents
          │            │            │
          └────────────┼────────────┘
                       ▼
              Scheme Discovery
                       │
                       ▼
              Eligibility Check
                       │
                       ▼
             Application Guidance
```

* **Live Status**: Completed across `/`, `/check`, `/results`, `/schemes/:slug`, `/vault`.
* **Track 1 Fast Path**: 1-click auto-fill on `/check` with Gemini 3.5 Flash Vision.
* **Track 2 Manual Path**: Instant zero-document entry.

---

### 2. Document System & Vault ✅ (Completed)
```text
Upload ──▶ Temp S3 Storage ──▶ OCR (Gemini Vision) ──▶ Classification ──▶ Field Extraction ──▶ Normalization ──▶ User Verification Modal ──▶ Citizen Profile
```
* **Live Status**: Implemented in `app/modules/ocr/` and `app/modules/vault/`.
* **Permanent Vault**: S3/MinIO bucket with encrypted document storage, presigned URLs, and live Scheme Application Readiness Meter (available vs missing checklist).

---

### 3. Citizen Profile & Fact Audit Trail 🟡 (Next Enhancement)
Don't make this just a giant `users` table — think in **facts** with an immutable audit trail:

```text
Citizen
 ├── Identity
 ├── Location
 ├── Family
 ├── Education
 ├── Employment
 ├── Income
 ├── Assets
 ├── Documents
 ├── Certificates
 ├── Existing Benefits
 └── Life Events
```

```text
annual_income
    ↓
₹180,000
    ↓
source = income_certificate (doc_id = 4)
    ↓
verified_by = citizen (user_id = 1)
    ↓
verified_at = 2026-08-14T09:30:00Z
```

* **Live Status**: Demographic attributes are synced to PostgreSQL `profiles` table.
* **V2.1 Enhancement**: Add `citizen_facts` table storing `fact_key`, `fact_value`, `source_document_id`, `verified_by_user_id`, `verified_at` for forensic auditability.

---

### 4. Life-Event Engine 📋 (Planned - V4.0 / Phase 8)
Transforms the platform from reactive search into a proactive life assistant:
* Triggers: Daughter turns 18 / enters College, Citizen turns 60, moved state, family income bracket changed.
* Background re-evaluation $\to$ Proactive notification to citizen.

---

### 5. The Knowledge Architecture: Canonical First ✅ (In Progress)
```text
                 OFFICIAL SOURCES
                       │
                       ▼
                INGESTION PIPELINE (v1.5 CDC)
                       │
                       ▼
             CANONICAL KNOWLEDGE
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        PostgreSQL              OKF (v2.5)
             │                   │
             ▼                   ▼
       Rules Engine       Agent-readable
                              knowledge
```

---

### 6. PostgreSQL = Deterministic Truth ✅ (Completed)
* PostgreSQL stores facts that computers query precisely: schemes, eligibility rules, benefits, required documents, locations, ministries, triage logs.
* Rules engine evaluates relational operators (`=`, `lte`, `gte`, `between`, `in`).
* **The LLM never decides eligibility.**

---

### 7. OKF = Canonical Knowledge Representation 🎯 (V2.5 Next)
Structured, agent-readable knowledge layer preserving official hierarchy:
```text
knowledge/
├── index.md
├── schemes/
│   ├── pm-kisan.md
│   ├── ladli-behna.md
│   └── sukanya-samriddhi.md
├── documents/
│   ├── income-certificate.md
│   └── domicile-certificate.md
├── ministries/
└── eligibility/
```
* Structured frontmatter, relationships, official source URLs, circular numbers, and freshness timestamps.

---

### 8. Query Router 🎯 (V2.5 Next)
```text
                      USER QUESTION
                           │
                           ▼
                    QUERY ANALYSIS
                           │
          ┌────────────────┼─────────────────┐
          ▼                ▼                 ▼
     STRUCTURED        CANONICAL          UNKNOWN /
       FACT             KNOWLEDGE         AMBIGUOUS
          │                │                 │
          ▼                ▼                 ▼
      SQL/Rules           OKF               RAG
          │                │                 │
          └────────────────┼─────────────────┘
                           │
                           ▼
                         ANSWER
```

---

### 9. RAG = Fallback, Not Foundation 📋 (V3.0 / Phase 6)
* Canonical knowledge (OKF + Rules) answers structured and verified questions first.
* RAG only handles unstructured circulars, historical policies, ambiguous FAQs, and edge cases.

---

### 10. RAG Pipeline 📋 (V3.0 / Phase 6)
* Hybrid Retrieval: BM25 keyword + Dense vector embeddings.
* Cross-Encoder Reranker: Prioritizes highest-evidence passages.
* Dynamic Top-K: Proportional evidence selection.
* Mandatory Citations.

---

### 11. Chunking Strategy 📋 (V3.0)
* Heading-aware / parent-child hierarchical chunking.
* Benchmarked against evaluation datasets on Recall@K, MRR, and citation precision.

---

### 12. Dynamic K 📋 (V3.0)
* Variable K based on query complexity and relevance distribution.

---

### 13. Embeddings Hygiene 📋 (V3.0)
* Document and query embeddings enforce identical model and dimension.
* Index versions tracked with migration scripts.

---

### 14. Freshness-Aware Semantic Cache 📋 (V3.0)
* Caches responses with hash of source versions.
* Government policy changes automatically invalidate affected cache entries.

---

### 15. Government Data Ingestion Pipeline ✅ (Completed - V1.5)
* Two-Phase Semantic CDC: HTTP 304 / hash diff + circuit breaker quarantine + MinIO staging + Admin triage queue.

---

### 16. Mandatory Citations 📋 (V3.0)
* Every claim cited back to official gazette notification, page, section, and circular date.

---

### 17. MCP (Model Context Protocol) Server 📋 (V3.5 / Phase 7)
* Exposes application capabilities as standard MCP tools (`find_schemes`, `check_eligibility`, `get_scheme_readiness`, `get_official_source`) for AI agents.

---

### 18. The Core System Rule (Golden Law)
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

### 19. 8-Phase MVP Execution Roadmap

- [x] **Phase 1 — Foundation (Madhya Pradesh + National)**: Auth, Profile, S3 Vault, Gemini Vision OCR, Human Verification Modal.
- [x] **Phase 2 — Scheme Knowledge**: 19 Flagship National & State schemes, dynamic rules, required documents, official sources.
- [x] **Phase 3 — Eligibility Engine**: Relational engine (`=`, `lte`, `gte`, `between`, `in`) + human-friendly explainability breakdown.
- [x] **Phase 4 — Dashboard & Readiness**: Categorized buckets (100% Eligible, Nearly Eligible) + Live Document Readiness Meter.
- [ ] **Phase 5 — OKF & Query Router**: Agent-readable `knowledge/` directory + Query Router (SQL vs OKF vs RAG).
- [ ] **Phase 6 — Hybrid RAG**: BM25 + Vector + Reranking + Dynamic K + Evaluation harness.
- [ ] **Phase 7 — MCP Server**: Tools for AI agents (`find_schemes`, `check_eligibility`, `get_documents`).
- [ ] **Phase 8 — Life-Event Intelligence**: Background profile re-evaluation on life changes (18+, 60+, college).

---

### 20. Final System Topology

```text
                         CITIZEN
                            │
                            ▼
                    MOBILE / WEB APP
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       PROFILE          DOCUMENTS       VOICE / CHAT
          │                 │                 │
          │                 ▼                 ▼
          │              OCR/PARSER      QUERY ROUTER
          │                 │                 │
          │                 ▼       ┌─────────┼─────────┐
          │          VERIFIED FACTS  │         │         │
          │                 │        ▼         ▼         ▼
          │                 │       SQL       OKF       RAG
          │                 │       Rules      │         │
          └─────────────────┼────────┴─────────┴─────────┘
                            │
                            ▼
                   RECOMMENDATION ENGINE
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
          DASHBOARD      CITATIONS      NEXT ACTION
                                            │
                                            ▼
                                    APPLICATION GUIDANCE
```

---

### 21. Conversational Citizen Assistant & Multi-Turn Chat 💬 (V2.7)
Provides a context-aware chat interface for natural citizen assistance:
* **Conversational Memory**: `chat_sessions` and `chat_messages` tables tracking multi-turn dialogs per authenticated user or guest.
* **Contextual Fact Injection**: Automatically pulls the citizen's verified facts (`citizen_facts` table) into the system prompt so users don't repeat age, income, or state.
* **Actionable Intent Dispatch**:
  - `EVALUATE_ELIGIBILITY`: Executes deterministic SQL rules.
  - `DOCUMENT_CHECKLIST`: Fetches markdown documents from OKF.
  - `PORTAL_GUIDANCE`: Provides official URLs and step-by-step instructions.
* **Streaming SSE Endpoint**: `POST /api/v1/chat/sessions/{session_id}/messages/stream` (Server-Sent Events) for real-time token streaming.

---

### 22. Voice-First Multilingual Speech Interface (Audio-to-Text & TTS) 🎙️ (V2.8)
Empowers citizens across rural and semi-urban India who prefer voice:
* **Audio-to-Text (STT)**: `POST /api/v1/voice/transcribe`
  - Accepts audio files (`.wav`, `.mp3`, `.m4a`, `.ogg`, `webm`).
  - Powered by Gemini Multimodal Audio / Indic Whisper for transcription in 12+ Indian languages (Hindi, Marathi, Tamil, Telugu, Bengali, Gujarati, Kannada, Punjabi, Malayalam, Odia, English, Hinglish).
* **Text-to-Speech (TTS)**: `POST /api/v1/voice/synthesize`
  - Generates clear spoken audio guidance in the citizen's native language.
* **Voice Chat Loop**: Voice Input $\to$ Audio STT $\to$ Query Router $\to$ Deterministic Rules & OKF $\to$ Localized Answer + Audio Voice Note.

---

### 23. Scheme Application Kit & PDF Checklist Generator 📄 (V2.11)
Bridges the gap between discovery and physical application submission:
* **Printable PDF Application Kit**:
  - Pre-filled citizen summary (Demographics, verified income, landholding).
  - Verified document checklist with QR codes pointing to vault documents.
  - Official submission guidelines for nearest CSC / Jan Seva Kendra / Tehsildar office.
* **Application Readiness Score**: Live meter indicating missing vs verified documents before citizen visits the government office.

---

### 24. Household & Family Welfare Graph 👨‍👩‍👧‍👦 (V2.7)
Welfare in India is family-centric (e.g. Sukanya Samriddhi for minor daughters, IGNOAPS for senior parents, Ayushman Bharat family floater cover, Ladli Behna for married women):
* **Household Modeling**: `household_members` table linked to primary citizen (`relationship`, `age`, `gender`, `occupation`, `student_status`, `disability_status`).
* **Family-Wide Eligibility Scan**: Evaluates all 4,148 schemes across the entire family in a single click, surfacing individual and collective household benefits.

---

### 25. Scheme Application Tracking Ledger 📋 (V2.10)
Tracks citizen applications from inception to benefit delivery:
* **Milestone State Machine**: `DRAFT` ➔ `DOCS_READY` ➔ `SUBMITTED` ➔ `UNDER_SCRUTINY` ➔ `APPROVED` ➔ `DISBURSED` (or `REJECTED` with reason).
* **Application Metadata**: Stores `acknowledgement_number`, `submission_date`, `portal_url`, and uploaded application receipts.
* **Status Poller**: Automated checker for state e-District and DBT portals.

---

### 26. DBT Failure Diagnosis & Grievance Drafter ⚖️ (V2.12)
Resolves the #1 citizen complaint: *"My scheme was approved but money didn't come to my bank."*
* **Root-Cause Diagnostic Engine**:
  - Checks NPCI Aadhaar bank account mapping status.
  - Detects PFMS payment rejection error codes.
  - Identifies pending eKYC or IFSC merger issues.
* **One-Click Grievance Drafter**: Automatically drafts formal grievance petitions for **CPGRAMS (Central)**, **CM Helpline (State)**, or local District Magistrate offices.

---

### 27. DPDP Act 2023 & Aadhaar Privacy Guardrails 🛡️ (V2.13)
Ensures strict compliance with Indian data protection laws and the Aadhaar Act:
* **Aadhaar Masking Engine**: Automatically masks first 8 digits (`XXXX-XXXX-1234`) on all OCR vision inputs and database records.
* **Granular Consent Management**: `consent_logs` table recording citizen consent purpose, timestamp, and instant revocation capability.
* **Encrypted Vault Storage**: Document vault S3 objects encrypted with AES-256 with strictly time-limited presigned URLs.

---

### 28. Assisted CSC / Jan Seva Kendra Kiosk Mode 🏢 (V2.14)
Enables Village Level Entrepreneurs (VLEs) and CSC operators to serve multiple rural citizens:
* **Kiosk Session Isolation**: Allows a single CSC operator to handle 50+ village citizens sequentially without cross-contaminating document vaults or profiles.
* **CSC Agent Dashboard**: Tracks village-level application submissions, pending documents, and approval rates.

