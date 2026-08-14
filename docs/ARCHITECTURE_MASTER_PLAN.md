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
| **V2.1** | **Citizen Facts Provenance Trail** | `citizen_facts` table with origin audit trail (`source_document_id`, `verified_at`) | 🎯 **Current Focus** |
| **V2.5 / Phase 5** | **OKF Canonical Knowledge** | Structured agent-readable knowledge layer (`knowledge/`) & Query Router | 🎯 **Next** |
| **V3.0 / Phase 6** | **Hybrid RAG & Provenance** | BM25 + Vector + Cross-Encoder Reranker + Mandatory Citations | 📋 Planned |
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
       PROFILE          DOCUMENTS           CHAT
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
