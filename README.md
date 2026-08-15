# Scheme AI

**AI-powered government welfare scheme discovery, eligibility evaluation, and application guidance for 1.4 billion Indian citizens.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Gemini](https://img.shields.io/badge/Gemini_3.7-Flash-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![Tests](https://img.shields.io/badge/Tests-25_Suites_(100%25)-brightgreen?style=flat&logo=pytest&logoColor=white)](https://pytest.org)

---

## What This Is

A citizen asks a question — in English, Hindi, Hinglish, or any of 12+ Indian languages — and the system:

1. **Understands their situation** (age, state, income, occupation, caste, disability, family)
2. **Evaluates 4,148 welfare schemes** against their profile in < 0.05ms using an in-memory bitmask engine
3. **Explains eligibility** in plain language with verified citations from official government sources
4. **Shows required documents** and calculates application readiness from their uploaded vault
5. **Guides them** to the official application portal with step-by-step instructions

The platform covers Central government flagship programs, all 36 States & Union Territories, and 326 ministries — sourced from MyScheme, Data.gov.in, and official state portals.

---

## Quickstart

### Docker Compose (Full Stack)

```bash
docker compose up -d --build

# Backend API:  http://localhost:8000/docs
# Frontend UI:  http://localhost:5173
```

### Local Development

```bash
# Install backend deps
uv sync

# Install frontend deps
cd frontend && npm install && cd ..

# Start everything (DB + S3 + Migrations + Seed + Backend + Frontend)
make dev
```

### Run Tests

```bash
make test        # 25 test suites
make test-cov    # with coverage report
```

---

## Architecture

Feature-driven modular monolith. Code is grouped by business capability, not by technical layer.

```
scheme-backend/
├── app/
│   ├── core/                     # Config, JWT security, pagination, error handlers
│   ├── database.py               # SQLAlchemy engine & session factory
│   ├── main.py                   # FastAPI gateway, router mounts, bitmask warm-up
│   ├── seeds/                    # DB seeders (4,148 schemes + admin user)
│   └── modules/                  # 11 Feature Modules
│       ├── admin/                # Staff control plane, scheme CRUD, ingestion triage
│       ├── auth/                 # Registration, login, JWT tokens, citizen profiles
│       ├── chat/                 # Conversational AI sessions, SSE streaming
│       ├── eligibility/          # Deterministic rule evaluator + bitmask engine
│       ├── household/            # Family graph, 3-tier UIDs, collective scans
│       ├── ingestion/            # 4-gate gov crawler, RFC 7232 caching, diff triage
│       ├── ocr/                  # Gemini Vision document OCR & fact extraction
│       ├── routing/              # Two-stage query decomposition & citation synthesis
│       ├── schemes/              # Scheme search, categories, slug lookups
│       ├── vault/                # S3 document storage & application readiness meter
│       └── voice/                # Multilingual STT, TTS, WebSocket live gateway
│
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/                # File-based routing (13 routes)
│       ├── components/           # ChatComposer, AppSidebar, MarkdownMessage, etc.
│       └── lib/                  # API client, session management
│
├── knowledge/                    # OKF Frictionless Data Package v2.0
│   ├── schemes/                  # 4,192 canonical scheme markdown files
│   ├── data/                     # 5 master CSV tables (33,241 rows)
│   ├── documents/                # 50 document taxonomies
│   └── ministries/               # 326 ministry profiles
│
├── tests/
│   ├── integration/              # 24 black-box API test suites
│   └── unit/                     # Rule engine edge case tests
│
├── compose.yaml                  # Postgres 17 + MinIO S3 + Backend + Frontend
├── Makefile                      # Developer command shortcuts
└── alembic/                      # 10 versioned database migrations
```

### The Standard Feature Pattern

Every module in `app/modules/<feature>/` follows the same 4-file structure:

| File | Responsibility |
| :--- | :--- |
| `models.py` | SQLAlchemy ORM table definitions |
| `schemas.py` | Pydantic v2 request/response DTOs |
| `service.py` | Pure business logic & database queries |
| `router.py` | FastAPI endpoints & dependency injection |

---

## Core Engines

### 1. In-Memory Bitmask Eligibility Engine

Pre-compiles all 4,148 schemes and 9,920 eligibility rules into integer bitmasks at startup. Evaluates a citizen's full eligibility across every scheme using bitwise AND operations — zero SQL I/O.

```
⚡ BITMASK ENGINE OPERATIONAL REPORT
──────────────────────────────────────────
• Compiled Schemes:        4,148 (in-process RAM)
• Evaluation Speed:        < 50 µs per citizen
• Multi-Core Throughput:   7,225 queries/sec (16 cores)
• Total Rules Indexed:     9,920 conditions
• Database I/O:            Zero (pure CPU bit operations)
──────────────────────────────────────────
```

Bitmask vectors cover: `state` (36 states + All-India), `gender`, `caste_category` (General/OBC/SC/ST), `occupation` (farmer/student/artisan/etc.), and numeric rules for `age` and `annual_income`.

### 2. Two-Stage Query Router

When a citizen asks a question (text or voice), the router:

**Stage 1 — Query Decomposition:**
- Detects language (Hindi, Marathi, Tamil, Bengali, Hinglish, English)
- Extracts state from synonyms (`"mp"` → `"Madhya Pradesh"`)
- Parses age and income with unit multipliers (`"5 lakh"` → `500000`)
- Classifies category and occupation intent

**Stage 2 — Parallel Execution:**
- **Worker 1:** Bitmask engine evaluation (< 0.05ms)
- **Worker 2:** OKF canonical markdown reader (scheme details, required docs)
- **Worker 3:** Web agent for live portal updates

**Stage 3 — Synthesis:**
Combines profile context, chat history, bitmask matches, and OKF content → Gemini 3.7 Flash generates a verified response with official citations.

### 3. Explainable Eligibility Reasoner

Goes beyond binary yes/no. Groups results into three tiers with plain-English explanations:

- **Eligible** — 100% criteria matched. Shows benefits and application steps.
- **Nearly Eligible** — 50–99% matched. Lists exact unmet criteria (e.g., *"Your annual income ₹3,00,000 exceeds the maximum limit of ₹2,50,000"*).
- **Ineligible** — < 50% matched.

Operators supported: `<`, `<=`, `>`, `>=`, `==`, `!=`, `in`, `not_in`, `between`, `range`.

### 4. Conversational AI Chat

Multi-turn conversational assistant with verified context injection:

- Injects citizen's demographic profile and verified document facts into system prompt
- Loads last 6 messages for conversational memory
- Real-time **Server-Sent Events (SSE)** token streaming
- Persists full message history with intent classification and source citations
- Model selector: Gemini 3.7 Flash / In-Memory Bitmask / Deep Document Reasoner

### 5. Voice Interface

Speech-to-text and text-to-speech integrated directly into the chat input:

- **Browser-native Web Speech API** for zero-latency dictation (en-IN locale for Hinglish output)
- **Fallback**: MediaRecorder → Gemini Multimodal Audio for 12+ Indic languages
- **TTS**: Browser-native `speechSynthesis` for instant audio playback on responses
- **WebSocket Gateway** (`/voice/live`): Bidirectional real-time voice with Gemini Live tool-calling

### 6. Household & Family Welfare Graph

Manages multi-member families with sovereign identity:

- **3-Tier UIDs**: `CIT-UID` (citizen), `HOU-UID` (household), `MBR-UID` (family member)
- **Life Stage State Machine**: Auto-classifies MINOR (< 18) / ADULT (18–59) / SENIOR (≥ 60)
- **Single-Click Family Scan**: Evaluates 4,148 schemes across all family members in < 0.2ms (daughter's scholarships, mother's pension, father's farmer benefits — all at once)

### 7. Document Vault & Application Readiness

S3-backed citizen document storage with intelligent readiness scoring:

- Encrypted upload to MinIO/S3 with 1-hour presigned download URLs
- Documents linked to primary citizen or specific family members
- **Readiness Meter**: Matches uploaded docs against scheme requirements using semantic aliases (Aadhaar, PAN, Khasra, BPL, etc.) → `"2/3 mandatory documents ready (67%)"`
- **OCR Fact Extraction**: Gemini Vision extracts structured facts (name, DOB, gender, income, state) from Aadhaar, PAN, income certificates, ration cards, land records
- **Fact Confirmation Flow**: Citizen reviews extracted facts → confirmed facts persist to profile + immutable provenance ledger

### 8. 4-Gate Government Ingestion Pipeline

Automated crawler for keeping scheme data current:

| Gate | Function |
| :--- | :--- |
| **Gate 1** | RFC 7232 zero-bandwidth caching (`If-None-Match`, `If-Modified-Since`) — skips unchanged feeds in 0.05s |
| **Gate 2** | Raw MinIO archival for audit trails + circuit breaker validation |
| **Gate 3** | Quarantine if upstream returns malformed data or > 40% missing schemes |
| **Gate 4** | Semantic hash diffing — auto-applies safe changes, routes breaking changes (income limit changes, benefit reductions) to admin triage queue |

Scraper pipeline includes Playwright-based MyScheme harvester with persistent Chrome profiles, human jitter, and content validation.

---

## Knowledge Base

The `knowledge/` directory contains an **Open Knowledge Foundation Frictionless Data Package v2.0**:

| Dataset | Records | Description |
| :--- | :--- | :--- |
| `schemes.csv` | 4,148 | Master scheme catalog (name, slug, state, category, ministry, status) |
| `eligibility_rules.csv` | 9,920 | Deterministic evaluation conditions |
| `required_documents.csv` | 14,695 | Mapped document requirements per scheme |
| `benefits.csv` | 4,148 | Financial and DBT benefit specifications |
| `ministries.csv` | 326 | Administrative department profiles |

**Coverage**: 9 Central categories (Agriculture, Business, Education, Employment, General, Healthcare, Housing, Social Welfare, Women & Child) across all 36 States & UTs.

---

## Frontend

React 19 SPA with file-based routing, designed as a conversational AI product (similar to ChatGPT/Claude/Gemini interaction pattern).

### Pages

| Route | Page | Description |
| :--- | :--- | :--- |
| `/` | Chat Home | Primary interface. Greeting, chat composer, suggestion chips, SSE streaming, model selector |
| `/check` | Eligibility Wizard | Multi-step demographic questionnaire with OCR auto-fill |
| `/results` | Results Viewer | Categorized scheme matches with rule-by-rule breakdowns |
| `/schemes/:slug` | Scheme Detail | Full scheme specification, benefits, eligibility, documents, official links |
| `/household` | Family Graph | Add/manage family members, run collective welfare scans |
| `/vault` | Document Vault | Upload documents, OCR extraction, readiness scoring |
| `/profile` | Citizen Profile | Demographics, location, occupation, caste, income management |
| `/admin` | Admin Portal | Scheme CRUD, ingestion monitoring, triage review, user management |
| `/login` | Login | Citizen authentication |
| `/register` | Registration | Account creation |

### Key Components

- **`ChatComposer`** — Auto-resizing input with mic dictation, vault attach shortcut, and send controls
- **`AppSidebar`** — Collapsible navigation with searchable chat history, inline rename/delete, profile footer
- **`MarkdownMessage`** — Custom renderer converting LLM markdown + knowledge citations into interactive scheme links
- **`SuggestionChip`** — Quick-action prompts (Scholarships, Farmer benefits, Healthcare, Housing, Business)

---

## API Reference

### Auth & Users

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Register citizen |
| `POST` | `/auth/login` | Login, receive JWT tokens |
| `POST` | `/auth/refresh` | Rotate access token |
| `GET` | `/auth/me` | Current user + profile |
| `POST` | `/users/me/profile` | Create/update citizen profile |
| `GET` | `/users/me/facts` | Verified facts audit ledger |

### Schemes

| Method | Path | Description |
| :--- | :--- | :--- |
| `GET` | `/schemes` | Paginated list with filters (state, category, ministry, status, search) |
| `GET` | `/schemes/search` | Problem-based keyword search (`?q=fertilizer`) |
| `GET` | `/schemes/categories` | Category breakdown with counts |
| `GET` | `/schemes/slug/:slug` | Full scheme detail by slug |

### Eligibility

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/eligibility/check` | Ad-hoc binary matching |
| `POST` | `/eligibility/explain` | Full explainability report (eligible / nearly / ineligible) |
| `GET` | `/eligibility/me/explained` | Personalized report for logged-in citizen |
| `GET` | `/eligibility/me/schemes` | Fast binary scheme matching |
| `GET` | `/eligibility/schemes/:id/explain` | Single-scheme criteria breakdown |

### Chat

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/chat/sessions` | Create session |
| `GET` | `/chat/sessions` | List sessions |
| `GET` | `/chat/sessions/:id` | Session history |
| `PATCH` | `/chat/sessions/:id` | Rename session |
| `DELETE` | `/chat/sessions/:id` | Delete session |
| `POST` | `/chat/sessions/:id/messages` | Send message (sync) |
| `POST` | `/chat/sessions/:id/messages/stream` | Send message (SSE stream) |

### Household

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/household/members` | Add family member |
| `GET` | `/household/members` | List family members |
| `PUT` | `/household/members/:id` | Update member |
| `DELETE` | `/household/members/:id` | Remove member |
| `GET` | `/household/eligibility` | Single-click family welfare scan |

### Document Vault

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/vault/documents/upload` | Upload document to S3 |
| `GET` | `/vault/documents` | List documents with presigned URLs |
| `DELETE` | `/vault/documents/:id` | Delete document |
| `GET` | `/vault/readiness/schemes/:id` | Application readiness meter |
| `POST` | `/vault/documents/:id/extract-facts` | OCR fact extraction |
| `POST` | `/vault/documents/:id/confirm-and-sync-profile` | Confirm & persist verified facts |

### Voice

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/voice/transcribe` | Multilingual STT (12+ languages) |
| `POST` | `/voice/chat` | Audio in → STT → Router → Text out |
| `POST` | `/voice/synthesize` | TTS audio synthesis |
| `WS` | `/voice/live` | Bidirectional real-time voice gateway |

### OCR

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/ocr/extract` | 1-click document fact extraction (auto-saves to vault if authenticated) |

### Query Router

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/routing/query` | Intelligent query decomposition + multi-engine routing + synthesis |

### Admin

| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/admin/schemes` | Create scheme with nested rules/docs/benefits |
| `GET` | `/admin/schemes` | List all schemes (including drafts) |
| `PATCH` | `/admin/schemes/:id` | Update scheme |
| `DELETE` | `/admin/schemes/:id` | Delete scheme |
| `POST` | `/admin/schemes/:id/rules` | Add eligibility rule |
| `POST` | `/admin/schemes/:id/documents` | Add required document |
| `POST` | `/admin/schemes/:id/benefits` | Add benefit |
| `GET` | `/admin/ingestion/sources` | List government data feeds |
| `POST` | `/admin/ingestion/run` | Trigger ingestion pipeline |
| `GET` | `/admin/ingestion/triage` | Pending triage items |
| `POST` | `/admin/ingestion/triage/:id/approve` | Approve breaking change |
| `POST` | `/admin/ingestion/triage/:id/reject` | Reject breaking change |
| `PATCH` | `/admin/users/:id/role` | Elevate user role |

---

## Database Schema

14 relational tables managed by Alembic (10 migration scripts):

| Table | Purpose |
| :--- | :--- |
| `users` | Citizen credentials, role, CIT-UID, HOU-UID |
| `profiles` | Demographics (name, DOB, gender, state, district, income, occupation, caste, land, disability) |
| `citizen_facts` | Immutable fact provenance ledger (fact key, value, source document ID, verification timestamp) |
| `household_members` | Family graph (relationship, life stage, age, gender, occupation, income, student/disability flags) |
| `user_documents` | S3 vault metadata (document type, masked number, file key, size, mime type, verification status) |
| `schemes` | Welfare scheme catalog (name, slug, state, category, ministry, status, application URL) |
| `eligibility_rules` | Deterministic criteria (field name, operator, rule value) |
| `required_documents` | Mandatory/optional document lists per scheme |
| `benefits` | Financial and in-kind benefit entries |
| `official_sources` | Official reference URLs per scheme |
| `ingestion_sources` | Registered government data feeds with ETags and content hashes |
| `ingestion_triage_items` | Staged breaking-change diffs for admin review |
| `chat_sessions` | Conversational threads (user, title, language) |
| `chat_messages` | Turn-by-turn history (sender, content, intent, citations JSON) |

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.141, Uvicorn
- **Language**: Python 3.13
- **Database**: PostgreSQL 17, SQLAlchemy 2.0, Alembic
- **Object Storage**: MinIO / AWS S3 (Boto3)
- **AI / LLM**: Google Gemini 3.7 Flash (chat, OCR, voice)
- **Auth**: Argon2id/Bcrypt, PyJWT (HS256, 30min access / 7d refresh)
- **Scraping**: Playwright, BeautifulSoup4
- **Data Format**: OKF Frictionless Data Package v2.0

### Frontend
- **Framework**: React 19, TypeScript 6.0
- **Build**: Vite 8.2
- **Styling**: Tailwind CSS 4.3
- **Routing**: @generouted/react-router (file-based)
- **Icons**: Lucide React

### Infrastructure
- **Containers**: Docker Compose (Postgres 17, MinIO, Backend, Frontend)
- **Package Manager**: uv (backend), pnpm (frontend)

---

## Testing

25 test suites verifying end-to-end citizen workflows:

```bash
uv run pytest -v
```

### Coverage

| Area | Test Suites | What's Verified |
| :--- | :--- | :--- |
| Auth & Users | 2 | Registration, login, JWT refresh, profile CRUD |
| Schemes | 3 | Search, categories, state filtering, slug lookups, national seed data |
| Eligibility | 4 | Binary matching, explainability, bitmask engine, boundary cases, real-world personas |
| Document Vault | 2 | S3 upload, presigned URLs, readiness meter, OCR extraction |
| Household | 2 | Family graph, 3-tier UIDs, life stages, collective scans |
| Chat | 1 | Session CRUD, message persistence, SSE streaming |
| Voice | 2 | STT transcription, TTS synthesis, live WebSocket gateway |
| Ingestion | 1 | RFC 7232 caching, circuit breaker, semantic diff, admin triage |
| Admin | 1 | Scheme CRUD, rule management, role elevation |
| OCR & Facts | 2 | Vision extraction, fact provenance, profile sync |
| Error Handling | 1 | Structured error contract, validation errors, 404s |
| Performance | 1 | Zero N+1 queries via eager loading assertions |
| E2E Journey | 1 | Complete citizen lifecycle (register → profile → check → vault → apply) |

### Real-World Test Personas

1. **Farmer Ramesh** (MP) → PM-Kisan ₹6,000 + CM Kisan Kalyan ₹4,000 + PM Fasal Bima
2. **Girl Child Priya** (14yo student) → Beti Bachao Beti Padhao + Post-Matric Scholarship
3. **Senior Murugan** (65yo, TN) → National Social Assistance Old Age Pension
4. **Artisan Sunita** (female weaver) → PM Vishwakarma + Mahila Samman Savings
5. **High-Income Vikram** (₹24L IT professional) → Correctly filtered out of BPL schemes

---

## Developer Commands

| Command | Description |
| :--- | :--- |
| `make dev` | Start everything (DB + S3 + Migrations + Seed + Backend + Frontend) |
| `make dev-backend` | Backend only with hot reload (port 8000) |
| `make dev-frontend` | Frontend only (port 5173) |
| `make test` | Run all test suites |
| `make test-cov` | Tests with coverage report |
| `make seed` | Seed admin + 4,148 schemes |
| `make migrate` | Run Alembic migrations |
| `make db-up` | Start Postgres + MinIO containers |
| `make db-down` | Stop database containers |
| `make benchmark` | Benchmark bitmask engine across all CPU cores (100K queries) |
| `make lint` | Ruff lint + format |
| `make clean` | Clean cache and build artifacts |

---

## Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql+psycopg://...` | PostgreSQL connection string |
| `SECRET_KEY` | dev key | JWT signing key |
| `GEMINI_API_KEY` | — | Google Gemini API key (chat, OCR, voice) |
| `GEMINI_MODEL` | `gemini-3.7-flash` | Default Gemini model |
| `S3_ENDPOINT_URL` | `http://localhost:9000` | MinIO/S3 endpoint |
| `S3_ACCESS_KEY` | `minioadmin` | S3 access key |
| `S3_SECRET_KEY` | `minioadmin` | S3 secret key |
| `S3_BUCKET_NAME` | `scheme-documents` | Document vault bucket |

---

## License

MIT
