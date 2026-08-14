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
| **V2.5** | **OKF Canonical Knowledge Base** | Domain-partitioned hierarchy, 100% valid Frictionless Data Package, Table Schema | ✅ **Completed** |
| **V2.6 / Phase 5** | **In-Memory Bitmask Engine & Router** | Inverted Bitmask set engine (<0.05ms) + Two-Stage Query Rewriter & Synthesizer | ✅ **Completed** |
| **V2.7 / Phase 5** | **Household & Family Welfare Graph** | Multi-member family profiling (`household_members`) for daughter/senior schemes | ✅ **Completed** |
| **V2.8 / Phase 5** | **Conversational Citizen Chat** | Multi-turn chat assistant, streaming SSE, profile fact injection, citations | ✅ **Completed** |
| **V2.9 / Phase 5** | **Voice-First Speech & Live Gateway**| Gemini Multimodal STT + TTS + Bidirectional WebSocket Tool-Calling RPC | ✅ **Completed** |
| **V2.10** | **Application Tracking Ledger** | Milestone tracker (`scheme_applications`: `DRAFT` ➔ `DOCS_READY` ➔ `DISBURSED`) | 🎯 **Next Focus** |
| **V2.11** | **Scheme Application Kit (PDF)** | Printable checklist + verified document QR links + CSC/Jan Seva Kendra guidance | 📋 Planned |
| **V2.12** | **DBT Troubleshooter & Grievance** | NPCI Aadhaar bank seeding diagnosis + CPGRAMS / CM Helpline grievance drafter | 📋 Planned |
| **V2.13** | **DPDP 2023 & Aadhaar Guardrails** | Automatic 8-digit Aadhaar masking (`XXXX-XXXX-1234`) and consent management | 📋 Planned |
| **V2.14** | **Assisted CSC / Kiosk Mode** | Multi-citizen session isolation for Village Level Entrepreneurs (VLEs) | 📋 Planned |
| **V3.0 / Phase 6** | **Hybrid RAG & Citations** | BM25 + Vector + Cross-Encoder Reranker + Mandatory File Citations | 📋 Planned |
| **V3.5 / Phase 7** | **MCP Agent Server** | Standard Model Context Protocol tools for autonomous AI agents | 📋 Planned |
| **V4.0 / Phase 8** | **Life-Event Intelligence** | Proactive triggers on life changes (College, 18+, 60+, Marriage, Income change) | 📋 Planned |
| **V5.0** | **Universal Global Expansion** | Multi-Country ISO 3166-1 (USA/UK/IN/CA), Multi-Currency, Global Taxonomies | 🔮 Future |

---

# 📦 Architectural Specifications

---

### 1. In-Memory Bitmask Rule Engine ✅ (Completed - V2.6)

```text
                                IN-MEMORY BITMASK ENGINE (CQRS READ PATH)
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │ 4,148 Schemes Compiled to Inverted Integer Bitsets in Process RAM (< 0.05ms CPU Evaluation) │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │ • States:         `state_masks["Madhya Pradesh"] | state_masks["all_india"]`                │
 │ • Demographics:   `gender_masks["female"] | unrestricted_gender`                            │
 │ • Castes:         `caste_masks["OBC"] | unrestricted_caste`                                 │
 │ • Occupations:    `occupation_masks["artisan"] | unrestricted_occupation`                   │
 │ • Numeric Bounds: `age_range_rules` (min_age <= age <= max_age)                             │
 │                   `income_range_rules` (annual_income <= max_income)                        │
 └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                │
                                                ▼
                            `matched_schemes = bitwise_AND(...)`
```

* **Zero I/O Overhead**: Evaluates citizen demographics in RAM in `< 50 microseconds` ($0.05\text{ ms}$).
* **State Inheritance**: National/Central schemes automatically match across all states via bitwise OR.
* **Open Attributes**: Schemes without explicit attribute restrictions are matched via bitwise unrestricted inversion.

---

### 2. Two-Stage Query Rewriter & Multi-Engine Router ✅ (Completed - V2.6)

```text
                      CITIZEN QUESTION / VOICE AUDIO
                (e.g., "bhaiya meri beti ke liye koi scholarship hai?")
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             STAGE 1: QUERY REWRITER & DECOMPOSER        │
       │  • Normalizes Indic Languages (Hindi / Hinglish ➔ Eng)  │
       │  • Injects Citizen Facts (State, Gender, Age, Income)   │
       │  • Generates Atomic Worker Payloads                     │
       └────────────────────────────┬────────────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  TIER 1: BITMASK SQL │ │   TIER 2: OKF DOCS   │ │ TIER 3: WEB AGENT    │
│  (Structured Facts)  │ │  (Step-by-Step Proc) │ │  (Live Ground Truth) │
├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
│ • In-Memory Bitmasks │ │ • Canonical Markdown │ │ • DuckDuckGo Search  │
│ • State | Caste      │ │ • Document Checklist │ │ • Portal Scraper     │
│ • Age & Income Range │ │ • samagra.gov.in     │ │ • Real-Time Deadlines│
│ • < 0.05ms Latency   │ │ • mahadbt.gov.in     │ │ • Fallback on Zero   │
│                      │ │ • Official Forms     │ │   Bitmask Match      │
└──────────┬───────────┘ └──────────┬───────────┘ └──────────┬───────────┘
           │                        │                        │
           │  Matched Schemes       │  Checklists & Steps    │  Fresh Updates
           └────────────────────────┼────────────────────────┘
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │             STAGE 3: CONTEXT SYNTHESIZER (LLM)          │
       │  • Combines: Original Question + Chat History           │
       │            + Bitmask Matched Schemes (Benefits & Rules) │
       │            + OKF Markdown Guidance + Live Portal URLs   │
       │  • Formats response in Citizen's native language        │
       │  • Appends verified Markdown Citations                  │
       └────────────────────────────┬────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       ┌────────────────────────┐      ┌────────────────────────┐
       │   TEXT / SSE STREAM    │      │    VOICE TTS AUDIO     │
       │   Real-time chat tokens│      │    Base64 MP3 stream   │
       │   + Official Citations │      │    for rural citizens  │
       └────────────────────────┘      └────────────────────────┘
```

---

### 3. Multi-Tier Caching Architecture (Latency-Aware Design)

```text
                            CITIZEN QUERY (Text / Voice)
                                         │
                                         ▼
                 ┌───────────────────────────────────────────────┐
                 │       STAGE 1: INTENT & SEMANTIC CHECK        │
                 └───────────────────────┬───────────────────────┘
                                         │
                   Is this a natural language question / FAQ?
                                         │
                        ┌────────────────┴────────────────┐
                        ▼ (YES)                           ▼ (NO / Fact Evaluation)
        ┌───────────────────────────────┐                 │
        │ CACHE TIER: SEMANTIC CACHE    │                 │
        │ (Redis Vector / HNSW Index)   │                 │
        ├───────────────────────────────┤                 │
        │ • Cosine similarity >= 0.94   │                 │
        │ • Matches paraphrased text    │                 │
        │ • Latency: ~4ms (375x speedup)│                 │
        └───────────────┬───────────────┘                 │
                        │                                 │
                ┌───────┴───────┐                         │
             [ HIT ]         [ MISS ]                     │
                │               │                         │
                ▼               ▼                         ▼
          (Instant 4ms    ┌───────────────────────────────────────────────┐
           Answer bypass) │    STAGE 2: ZERO-LATENCY DETERMINISTIC CORE   │
                          ├───────────────────────────────────────────────┤
                          │ • IN-MEMORY BITMASK ENGINE (0.02ms in RAM)    │
                          │ • CANONICAL OKF MARKDOWN CHECKLIST (0.05ms)   │
                          │ • WEB AGENT (Redis 6h TTL Cache for Portals)  │
                          └───────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                          ┌───────────────────────────────────────────────┐
                          │    STAGE 3: CONTEXT SYNTHESIZER & DELIVERY    │
                          │  • LLM synthesizes answer with citations      │
                          │  • Asynchronously populates Semantic Cache   │
                          │  • Emits SSE Stream OR Cached 24kHz Audio     │
                          └───────────────────────────────────────────────┘
```

* **Why Demographic SQL is NOT cached in Redis**: Our In-Memory Bitmask Engine runs in **0.02ms** in RAM. Redis TCP network round-trips take **0.8ms – 1.5ms** (20x slower).
* **Where Caching is Applied**:
  - **Semantic LLM Cache (Redis Vector)**: Bypasses 1.5s LLM generation for FAQs in **4ms**.
  - **Web Agent TTL Cache (Redis Hash, 6h)**: Prevents IP rate-limiting on state portals.
  - **Voice Audio Cache (MinIO / Redis Binary)**: Instant playback of pre-rendered 24kHz MP3 prompts (<2ms).

---

### 4. Real-Time Bidirectional Voice & Live Tool-Calling Gateway ✅ (Completed - V2.9)

```text
                                    CITIZEN DEVICE / KIOSK
                                  (Microphone & Speaker PCM)
                                              │
                       Bidirectional WebSocket: `/api/v1/voice/live`
                                              │
                                              ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                         FASTAPI LIVE VOICE WEBSOCKET GATEWAY                                │
 │                                                                                             │
 │ 1. SESSION HANDSHAKE & PRE-SESSION GROUNDING (On Connect)                                   │
 │    • Resolves JWT Citizen ➔ Loads `Profile`, `citizen_facts`, & `household_members`         │
 │    • Injects verified facts into Gemini RAM system instructions (Never re-asks known facts) │
 │                                                                                             │
 │ 2. DUAL-STREAM PROXY PIPELINE                                                               │
 │    • Upstream: Audio PCM In (16kHz) ────────────────────────► GEMINI MULTIMODAL LIVE WS     │
 │    • Downstream: Audio PCM Out (24kHz) ◄───────────────────── GEMINI MULTIMODAL LIVE WS     │
 │                                                                     │                       │
 │ 3. ZERO-LATENCY TOOL CALLING RPC (Interception Loop)                │ Function Call Event   │
 │    • Gemini Live invokes registered Python tool functions ◄─────────┘ (e.g. `check_docs`)   │
 │    • Evaluated via In-Memory Bitmask Engine / OKF (< 0.05ms)                                │
 │    • Tool output returned to Gemini thought buffer ➔ Resumes speaking in Hindi              │
 └────────────────────────────────────────────┬────────────────────────────────────────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         ▼                                         ▼
           ┌───────────────────────────┐             ┌───────────────────────────┐
           │ IN-MEMORY BITMASK ENGINE  │             │   OKF CANONICAL REPO      │
           │ • Instant Eligibility     │             │ • Required Documents      │
           │ • Dynamic Rule Filtering  │             │ • Official Portal Links   │
           └───────────────────────────┘             └───────────────────────────┘
```

---

### 5. Dual-Tier Citizen Fact Provenance Model ✅ (Completed - V2.1 & V2.9)

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │  TIER 1: DOCUMENT_VERIFIED (Confidence: 0.99)                                               │
 │  • Source: Verified OCR from uploaded PDF/Image in S3 Document Vault                        │
 │  • Linked Document ID: `user_documents.id = 42` (Income Certificate)                        │
 │  • Status: Legally verified; auto-populates government application forms                    │
 ├─────────────────────────────────────────────────────────────────────────────────────────────┤
 │  TIER 2: VOICE_SELF_REPORTED (Confidence: 0.70)                                             │
 │  • Source: Conversational statement during Live Voice Call                                 │
 │  • Linked Session ID: `chat_sessions.id = 104`                                              │
 │  • Status: Used for active discovery; flagged as "Pending Document Verification"            │
 └─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Household & Family Welfare Graph ✅ (Completed - V2.7)

* **Household Model**: `household_members` table linked to primary citizen (`relationship`, `age`, `gender`, `occupation`, `caste_category`, `is_student`, `has_disability`).
* **Multi-Member Welfare Scan**: `GET /api/v1/household/eligibility` evaluates all 4,148 schemes across all family members in `< 0.2ms`.

---

### 7. Upcoming Milestones (From Discovery to Physical Execution)

#### V2.10 — Scheme Application Tracking Ledger 🎯 (Next Focus)
* **Milestone State Machine**: `DRAFT` ➔ `DOCS_READY` ➔ `SUBMITTED` ➔ `UNDER_SCRUTINY` ➔ `APPROVED` ➔ `DISBURSED` (or `REJECTED` with reason).
* **Metadata & Receipts**: Stores `acknowledgement_number`, `submission_date`, `portal_url`, and uploaded application receipts.

#### V2.11 — Scheme Application Kit & PDF Checklist Generator 📄
* **Printable PDF Kit**:
  - Pre-filled citizen summary (Demographics, verified income, landholding).
  - Verified document checklist with QR codes pointing to vault documents.
  - Official submission guidelines for nearest CSC / Jan Seva Kendra / Tehsildar office.

#### V2.12 — DBT Failure Diagnosis & Grievance Drafter ⚖️
* **Root-Cause Diagnostic Engine**:
  - Checks NPCI Aadhaar bank account mapping status.
  - Detects PFMS payment rejection error codes.
  - Identifies pending eKYC or IFSC merger issues.
* **One-Click Grievance Drafter**: Automatically drafts formal grievance petitions for **CPGRAMS (Central)**, **CM Helpline (State)**, or local District Magistrate offices.

#### V2.13 — DPDP Act 2023 & Aadhaar Privacy Guardrails 🛡️
* **Aadhaar Masking Engine**: Automatically masks first 8 digits (`XXXX-XXXX-1234`) on all OCR vision inputs and database records.
* **Granular Consent Management**: `consent_logs` table recording citizen consent purpose, timestamp, and instant revocation capability.

#### V2.14 — Assisted CSC / Jan Seva Kendra Kiosk Mode 🏢
* **Kiosk Session Isolation**: Allows a single CSC operator to handle 50+ village citizens sequentially without cross-contaminating document vaults or profiles.
