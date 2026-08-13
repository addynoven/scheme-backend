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
| **V1.1** | **State Schemes Expansion** | Flagship state benefits (Madhya Pradesh, Maharashtra, Karnataka) & Location Matching | ✅ **Completed** |
| **V1.2** | **Admin Management Portal** | Web UI to create, edit, and toggle schemes without SQL, Visual Rule Builder | ✅ **Completed** |
| **V1.3** | **Document Vault & Readiness** | S3 Document storage & live Scheme Application Readiness Meter | ✅ **Completed** |
| **V1.5** | **Government Ingestion Pipeline** | Two-Phase Semantic CDC + Circuit Breaker + MinIO Staging + Triage Queue | ✅ **Completed** |
| **V2.0** | **OCR & Fact Extraction** | Auto-extract facts from Aadhaar/Certificates with human verification | 🎯 **Next** |
| **V2.5** | **OKF Canonical Knowledge** | Structured agent-readable knowledge layer & Query Router | 📋 Planned |
| **V3.0** | **Hybrid RAG & Provenance** | BM25 + Vector + Cross-Encoder Reranker + Mandatory Citations | 📋 Planned |
| **V3.5** | **MCP Agent Server** | Standard Model Context Protocol tools for autonomous AI agents | 📋 Planned |
| **V4.0** | **Life-Event Intelligence** | Proactive triggers on life changes (College, 18+, 60+, Marriage) | 📋 Planned |
| **V5.0** | **Universal Global Expansion** | Multi-Country ISO 3166-1, Currency formatting, Global doc taxonomies (UN GovStack) | 🔮 Future |

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

---

## 🟢 V1.1 — State-Specific Scheme Expansion *(Completed & Live)*

### Objective
Expand coverage beyond national schemes into high-impact state-level welfare programs (Madhya Pradesh, Maharashtra, Karnataka) where >70% of citizen direct welfare transfers occur.

```text
Citizen Location (e.g. Madhya Pradesh)
         │
         ▼
Evaluate National Schemes + MP State Schemes
         │
         ▼
Display Unified Opportunities:
  • PM-Kisan (National: ₹6,000/yr)
  • MP Mukhya Mantri Kisan Kalyan (State: ₹6,000/yr Top-Up)
  • Total Citizen Benefit = ₹12,000/year!
```

### Key Deliverables
* **State Column & Models**:
  * Added `state` indexed column (`ALL_INDIA` or specific State name) in `schemes` table via Alembic migration `b08d40047bc5`.
* **State Flagship Dataset (19 Schemes Total)**:
  * **Madhya Pradesh**:
    * *Mukhya Mantri Ladli Behna Yojana* (₹1,250/mo direct DBT for women aged 21-60).
    * *Mukhya Mantri Kisan Kalyan Yojana* (₹6,000/yr farmer state top-up).
    * *Mukhyamantri Medhavi Vidyarthi Yojana (MMVY)* (100% Higher education tuition fee waiver).
  * **Maharashtra**:
    * *Mukhyamantri Majhi Ladki Bahin Yojana* (₹1,500/mo financial aid).
    * *Namo Shetkari Mahasanman Nidhi Yojana* (₹6,000/yr farmer aid).
  * **Karnataka**:
    * *Gruha Lakshmi Scheme* (₹2,000/mo female head-of-household grant).
    * *Yuva Nidhi Scheme* (₹3,000/mo unemployment stipend for graduates).
* **Location-Aware Rules Engine**:
  * Citizen state matching evaluates `ALL_INDIA` + resident state schemes with plain-English reasons.
* **Frontend State Filters & Badging**:
  * State filter bar on Home page and badges (`🇮🇳 National` vs `🏛️ Madhya Pradesh`, `🏛️ Maharashtra`, `🏛️ Karnataka`) across Home, Results, and Detail pages.
* **Tests Passing**:
  * 44/44 automated integration & unit tests passing (`uv run pytest -v`).

---

## 🟢 V1.2 — Admin Scheme Management Portal *(Completed & Live)*

### Objective
Allow non-technical administrators to create, update, and toggle welfare schemes and eligibility rules via a secure web UI without touching code or SQL.

```text
Admin Portal (/admin)
  ├── Secure JWT Auth (admin@gov.in)
  ├── Scheme Metadata (Name, Ministry, State, Description, Portal URL)
  ├── Visual Rule Builder (Field: Age/Income/State, Operator: =, <=, >=, between, Value)
  ├── Benefits Manager (Type, Cash amount, Description)
  └── Required Documents Checklist (Mandatory vs Optional)
```

### Key Deliverables
* **Admin Dashboard UI (`/admin`)**:
  * Scheme table with search, category & state filters, instant status toggle (`active` / `draft`), and edit triggers.
* **Visual Rule Builder**:
  * Dropdown UI to configure rules without writing code:
    `[ State ] [ = ] [ Madhya Pradesh ]`
    `[ Age ] [ >= ] [ 21 ]`
    `[ Income ] [ <= ] [ 2,50,000 ]`
* **RBAC Enforcement**:
  * Restricts `/admin` endpoints to users with `role: "admin"` via JWT.
* **Full CRUD Lifecycle**:
  * Create, edit, toggle, and delete schemes + nested benefits, eligibility rules, and required documents.

---

## 🟢 V1.3 — Document Vault & Live Readiness Meter *(Completed & Live)*

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

## 🟢 V1.5 — Automated Government Ingestion & Sync Pipeline *(Completed & Live)*

### Objective
High-efficiency background pipeline pulling official datasets from `data.gov.in` and state portals without putting load on production read databases.

```text
               SCHEDULED INGESTION WORKER
                            │
                            ▼
 ┌──────────────────────────────────────────────────────────┐
 │ GATE 1: ZERO-BANDWIDTH HTTP CHECK (RFC 7232)             │
 │ Send "If-None-Match: <ETag>" / "If-Modified-Since"       │
 └──────────────────────────┬───────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
    [ HTTP 304 Not Modified ]       [ HTTP 200 OK ]
            │                               │
     ✅ 0 Bytes Downloaded.                 ▼
     Exit in 10ms.             ┌────────────────────────────┐
                               │ 1. MINIO S3 RAW DUMP BLOB  │
                               │ Audit snapshot saved to S3 │
                               └────────────┬───────────────┘
                                            │
                                            ▼
                               ┌────────────────────────────┐
                               │ GATE 2: CIRCUIT BREAKER    │
                               │ Rejects corrupted payloads │
                               └────────────┬───────────────┘
                                            │
                                            ▼
                               ┌────────────────────────────┐
                               │ GATE 3: SEMANTIC HASH DIFF │
                               │ Hashes only business rules │
                               └────────────┬───────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          [ NON-BREAKING CHANGE ]                        [ BREAKING CHANGE ]
          (New scheme, new benefit)                      (Income limit lowered)
                     │                                             │
                     ▼                                             ▼
          ┌─────────────────────┐                       ┌─────────────────────┐
          │ STAGING BATCH WRITE │                       │ ADMIN TRIAGE QUEUE  │
          │ (PostgreSQL Writer) │                       │ (1-Click Approval)  │
          └─────────────────────┘                       └─────────────────────┘
```

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

---

## 🔮 V5.0 — Universal Multi-Country Global Expansion

### Objective
Scale the platform from national welfare navigation into a **Universal Open-Source Public Benefit Navigator (UN / GovStack standard)** operable by any country or municipality on Earth.

```text
                               GLOBAL CITIZEN
                                     │
                                     ▼
                            SELECT JURISDICTION
                    (USA / UK / Canada / Germany / India)
                                     │
                                     ▼
                     UNIVERSAL RULES ENGINE (ISO 3166-1)
          ┌──────────────────────────┼──────────────────────────┐
          ▼                          ▼                          ▼
     UNITED STATES             UNITED KINGDOM                 INDIA
     • SNAP (Food Stamps)      • Universal Credit             • PM-Kisan
     • Medicaid                • Personal Independence (PIP)  • Ladli Behna
     • Section 8 Housing       • Child Benefit                • Ayushman Bharat
          │                          │                          │
          ▼                          ▼                          ▼
    USD ($) FORMAT             GBP (£) FORMAT             INR (₹) FORMAT
    SSN / W-2 Docs             NINO / P60 Docs            Aadhaar / PAN Docs
```

### Key Deliverables
* **ISO 3166-1 Country Code & Hierarchy**:
  * Add `country_code: str` (`"US"`, `"GB"`, `"CA"`, `"IN"`, `"DE"`) and `jurisdiction_level` (`"federal"`, `"state_province"`, `"municipal"`).
* **Multi-Currency & Locale-Aware Engine**:
  * Dynamic currency symbols (`$`, `£`, `€`, `¥`, `₹`, `CAD`) formatted based on scheme locale.
* **Universal Demographic Profile + Extensible Attributes**:
  * Core fields (Universal): `income`, `age`, `household_size`, `employment_status`.
  * Flexible JSON dictionary (`country_attributes: dict[str, Any]`):
    * **USA**: `veteran_status`, `medicaid_enrolled`, `snap_eligible`, `tax_filing_status`
    * **UK**: `disability_living_allowance`, `universal_credit_claimant`
    * **Canada**: `indigenous_status`, `permanent_resident`
* **Global Document Taxonomies in S3 Vault**:
  * Standardized readiness checklists for international identification & tax forms.

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
