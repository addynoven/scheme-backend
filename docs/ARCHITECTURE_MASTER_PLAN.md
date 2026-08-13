# Project: Government Benefits Navigator — Master Architecture Blueprint

> **"A citizen gives the system their information once. The system continuously helps them discover, understand, verify, and access government benefits and services relevant to their life."**

The system answers both:
* **"What can I get?"**
* **"What should I do next?"**

---

## The Golden Architectural Tenet

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

# 1. Citizen Experience

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

---

# 2. Document System

### Processing Pipeline

```text
Upload
  ↓
Temporary encrypted storage
  ↓
OCR
  ↓
Document classification
  ↓
Field extraction
  ↓
Normalization
  ↓
Confidence score
  ↓
User verification
  ↓
Citizen profile
```

The user sees:
> **"We found your annual income as ₹1,80,000."**
> `[Correct]` `[Edit]`

After verification, that becomes trusted profile data.

### Document Vault
Users can optionally permanently store their documents:
* Aadhaar Card
* Income Certificate
* Caste Certificate
* Domicile / Residence Certificate
* Academic Marksheet
* Bank Document / Passbook
* Land Records
* Other Certificates

*The vault is separate from the temporary OCR-processing pipeline.*

---

# 3. Citizen Profile: Fact-Based Model

Don't make this just a flat `users` table. Structure it in **traceable facts**:

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

Every important fact is traceable to its origin:

```text
annual_income
    ↓
₹180,000
    ↓
source = income_certificate
    ↓
verified_by = citizen
    ↓
verified_at = timestamp
```

---

# 4. Life-Event Engine

A core differentiator. The system understands life transitions:

```text
Child born
Marriage
Started college
Lost employment
Started business
Bought land
Turned 18
Turned 60
Disability certificate obtained
Family income changed
Moved state
```

### Event Trigger Flow:

```text
Life Event
    ↓
Re-evaluate Citizen Profile
    ↓
Find newly relevant schemes
    ↓
Check eligibility
    ↓
Notify citizen
```

*Example*: **"Your daughter recently turned 18 and started college."** $\to$ *System proactively recommends 4 higher-education scholarship programs.*

---

# 5. The Knowledge Architecture

## Canonical Knowledge First

```text
                 OFFICIAL SOURCES
                       │
                       ▼
                INGESTION PIPELINE
                       │
                       ▼
             CANONICAL KNOWLEDGE
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        PostgreSQL              OKF
             │                   │
             ▼                   ▼
       Rules Engine       Agent-readable
                              knowledge
```

The canonical layer contains:
* Scheme Name, Metadata & Ministry
* State & District Applicability
* Eligibility Rules & Dynamic Operators
* Benefits & Financial Grants
* Required Documents (Mandatory vs Optional)
* Application Process & Deadlines
* Exceptions & Relationships
* Provenance, Official Sources & Freshness Versioning

---

# 6. PostgreSQL = Deterministic Truth

PostgreSQL handles precise, exact relational queries:
* `schemes` & `scheme_versions`
* `eligibility_rules` & `scheme_benefits`
* `required_documents` & `official_sources`
* `locations` & `ministries`
* `citizen_profiles`, `citizen_facts`, & `citizen_documents`
* `life_events` & `eligibility_checks`

### Example Deterministic Evaluation:
```sql
age >= 18 
AND annual_income <= 300000 
AND state = 'Madhya Pradesh'
```
*The rules engine evaluates truth deterministically. The LLM does NOT decide eligibility.*

---

# 7. OKF (Open Knowledge Framework) = Canonical Knowledge Representation

Agent-readable knowledge layer preserving conceptual structure:

```text
knowledge/
├── index.md
├── schemes/
│   ├── pm-kisan.md
│   ├── ayushman-bharat.md
│   └── pm-vishwakarma.md
├── documents/
│   ├── income-certificate.md
│   └── domicile-certificate.md
├── ministries/
├── eligibility/
└── application/
```

* We do not blindly chop canonical knowledge into arbitrary RAG chunks.
* We preserve structural hierarchy so agents navigate progressively.

---

# 8. Query Router

The Query Router is the brain deciding **how to answer**, not the LLM itself:

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

*If insufficient information $\to$ Ask citizen clarifying question.*

---

# 9. RAG = Fallback, Not Foundation

```text
Can canonical knowledge answer?
           │
      ┌────┴────┐
     YES        NO
      │          │
      ▼          ▼
   OKF/Rules     RAG
```

RAG is strictly reserved for:
* Ambiguous questions & edge cases
* Messy government circulars and gazettes
* Unstructured FAQs & historical documents
* Broad discovery not yet modeled canonically

---

# 10. RAG Pipeline

```text
                QUERY
                  │
                  ▼
           Query Transformation
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     BM25              Dense Vector
        │                   │
        └─────────┬─────────┘
                  ▼
             Hybrid Fusion
                  │
                  ▼
          Cross-Encoder Rerank
                  │
                  ▼
             Dynamic Top-K
                  │
                  ▼
                LLM
                  │
                  ▼
              Citation
```

---

# 11. Chunking Strategy

* Start with: **Heading-aware / Parent-child hierarchical chunking**.
* Benchmark on real evaluation datasets (*Recall@K, Precision, MRR, Latency, Cost*).

---

# 12. Dynamic K & Embeddings

* **Dynamic K**: Simple query $\to$ small $K$; Complex/Decomposed query $\to$ larger $K$ pool.
* **Embedding Invariance**: Document embedding model and query embedding model must belong to the exact same compatible embedding space with strict index versioning.

---

# 13. Freshness-Aware Semantic Cache

Cache entries contain:
* `query` & `query_embedding`
* `answer` & `retrieved_chunk_ids`
* `source_versions`, `created_at`, `expires_at`

*Cache is invalidated whenever underlying government sources change.*

---

# 14. Government Data Update Pipeline

```text
Official Source
      ↓
Fetcher
      ↓
Content Hash
      ↓
Changed?
   ┌──┴──┐
  NO     YES
   │      │
   │      ▼
   │    Parse → Normalize → Validate
   │      ↓
   │    Update PostgreSQL DB
   │      ↓
   │    Update OKF Knowledge
   │      ↓
   │    Re-index affected RAG chunks
   │      ↓
   │    Invalidate affected cache
   │
   └────► Done
```

---

# 15. Mandatory Citations

Every claim has verifiable provenance:
```text
Answer ──▶ Claim ──▶ Source ──▶ Official Document ──▶ Page/Section ──▶ Version & Last Verified
```

Citizens can always verify: *"Show me where you got this."*

---

# 16. MCP (Model Context Protocol)

MCP is the clean API interface through which autonomous AI agents operate the system:
* `get_citizen_profile()`
* `get_documents()`
* `find_schemes(query, filters)`
* `get_scheme(slug)`
* `check_eligibility(profile)`
* `get_required_documents(scheme_id)`
* `get_official_source(scheme_id)`

---

# 17. Phased Implementation Roadmap

```text
Phase 1 (Foundation):
  • Auth, Profile Facts, Document Upload, MinIO S3 Vault
Phase 2 (Scheme Knowledge):
  • Relational Schema, Rules Engine, Flagship Schemes, Versioning
Phase 3 (Eligibility Engine):
  • Deterministic matching (=, ≤, ≥, between, in), "Why you match" Explainability
Phase 4 (Citizen UI / Web V1):
  • 4-Screen Flow (Home, Check Form, Results with Nearly-Eligible, Scheme Details)
Phase 5 (OKF Agent Interface):
  • Query Router, Canonical OKF representation, Citation generator
Phase 6 (Hybrid RAG):
  • BM25 + Vector Dense Retrieval + Cross-Encoder Reranker
Phase 7 (MCP Server):
  • Expose tools for autonomous agents
Phase 8 (Life-Event Engine):
  • Event trigger pipeline & automated re-evaluation
```

---

# 18. Final End-to-End Architecture

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
