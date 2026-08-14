# 🏛️ Government Benefits Navigator — Master Versioned Architecture Blueprint & Historical Changelog

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

## 📜 Architecture Changelog & Milestone History (V1.0 – V2.9)

```
[V1.0] Deterministic Core  ──▶ [V1.5] Semantic CDC  ──▶ [V2.0] Vision OCR  ──▶ [V2.5] OKF Knowledge
           │                           │                         │                    │
           ▼                           ▼                         ▼                    ▼
[V2.6] Bitmask Engine (<0.05ms) ──▶ [V2.7] Household Graph ──▶ [V2.8] Chat SSE ──▶ [V2.9] Voice Gateway
```

| Version / Milestone | Focus Area | Technical Deliverable & Performance | Release Status |
| :--- | :--- | :--- | :--- |
| **V1.0 (Phase 1)** | **Deterministic Core** | 4-screen flow, relational rule operators (`=`, `lte`, `gte`, `between`, `in`), explainability breakdown, 19 National/State schemes. | ✅ **Released** |
| **V1.1 (Phase 2)** | **State Scheme Expansion** | Multi-state schemes (Madhya Pradesh, Maharashtra, Karnataka) & district targeting. | ✅ **Released** |
| **V1.2 (Phase 4)** | **Admin Management** | Full CRUD for schemes, dynamic rule builder, and activation toggles. | ✅ **Released** |
| **V1.3 (Phase 1)** | **Document Vault** | S3 MinIO storage, document classification, live Scheme Readiness Meter. | ✅ **Released** |
| **V1.5** | **Government Ingestion CDC** | Two-Phase Semantic CDC + Circuit Breaker + MinIO Staging + Triage Queue. | ✅ **Released** |
| **V2.0 (Phase 1)** | **Multimodal Vision OCR** | Gemini Vision OCR fact extraction, structured JSON normalization, citizen verification modal. | ✅ **Released** |
| **V2.1** | **Fact Provenance Trail** | `citizen_facts` database table tracking audit origin (`source_document_id`, `verified_at`). | ✅ **Released** |
| **V2.5** | **OKF Canonical Knowledge** | Open Knowledge Foundation markdown catalog, 100% Frictionless Data Package spec. | ✅ **Released** |
| **V2.6 (Phase 5)** | **In-Memory Bitmask Engine** | Inverted integer bitsets in RAM (< 0.05ms evaluations) + Two-Stage Query Rewriter. | ✅ **Released** |
| **V2.7 (Phase 5)** | **Household Family Graph** | `household_members` table and single-click family welfare scan across 4,148 schemes. | ✅ **Released** |
| **V2.8 (Phase 5)** | **Conversational Assistant** | Multi-turn chat sessions, SSE token streaming, verified fact injection. | ✅ **Released** |
| **V2.9 (Phase 5)** | **Voice-First Speech Kiosk** | Multilingual Indic STT/TTS (24kHz) + Live WebSocket Gateway with Real-Time Tool Calling. | ✅ **Released** |

---

## 🗺️ Forward-Looking Execution Roadmap (V2.10 ➔ V4.0)

| Version / Milestone | Focus Area | Core Deliverable | Priority |
| :--- | :--- | :--- | :--- |
| **V2.10** | **Application Tracking Ledger** | Milestone State Machine (`scheme_applications`: `DRAFT` ➔ `DOCS_READY` ➔ `SUBMITTED` ➔ `APPROVED` ➔ `DISBURSED`). | 🎯 **Next Focus** |
| **V2.11** | **Scheme Application Kit (PDF)** | Printable PDF checklist + pre-filled citizen details + QR code document verification links. | 📋 Planned |
| **V2.12** | **DBT Troubleshooter & Grievance** | NPCI Aadhaar bank seeding diagnosis + CPGRAMS / CM Helpline 1-click grievance drafter. | 📋 Planned |
| **V2.13** | **DPDP 2023 & Aadhaar Privacy** | Automatic 8-digit Aadhaar masking (`XXXX-XXXX-1234`) and granular consent revocation. | 📋 Planned |
| **V2.14** | **Assisted CSC Kiosk Mode** | Multi-citizen session isolation for Village Level Entrepreneurs (VLEs) at CSCs. | 📋 Planned |
| **V3.0 (Phase 6)** | **Hybrid RAG & Citations** | BM25 + Vector + Cross-Encoder Reranker + Mandatory File Citations. | 📋 Planned |
| **V3.5 (Phase 7)** | **MCP Agent Server** | Standard Model Context Protocol tools for autonomous external AI agents. | 📋 Planned |
| **V4.0 (Phase 8)** | **Life-Event Intelligence** | Background triggers on citizen life milestones (Turning 18, Senior Citizen 60, College). | 📋 Planned |

---

# 📦 Active Core Architecture Specifications

---

### 1. In-Memory Bitmask Rule Engine (V2.6)

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

---

### 2. Two-Stage Query Rewriter & Multi-Engine Router (V2.6)

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

* **Deterministic SQL vs Redis**: In-Memory Bitmask Engine runs in **0.02ms** in RAM. Redis TCP network round-trips take **0.8ms – 1.5ms** (20x to 30x slower). Therefore, process RAM is our Tier-0 cache.

---

### 4. Real-Time Bidirectional Voice & Live Tool-Calling Gateway (V2.9)

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

### 5. Dual-Tier Citizen Fact Provenance Model (V2.1 & V2.9)

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

### 6. Household & Family Welfare Graph (V2.7)

* **Household Model**: `household_members` table linked to primary citizen (`relationship`, `age`, `gender`, `occupation`, `caste_category`, `is_student`, `has_disability`).
* **Multi-Member Welfare Scan**: `GET /api/v1/household/eligibility` evaluates all 4,148 schemes across all family members in `< 0.2ms`.
