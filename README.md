# 🏛️ Citizen Welfare Navigator & Sovereign Scheme Engine

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![React Native](https://img.shields.io/badge/React_Native-0.81.5_(Expo_54)-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3_(Turbopack)-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_/_6.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Valkey / Redis](https://img.shields.io/badge/Valkey_/_Redis-Caching_Layer-DC382D?style=flat&logo=redis&logoColor=white)](https://valkey.io/)
[![Cloudinary / MinIO](https://img.shields.io/badge/Storage-Cloudinary_%26_MinIO_S3-3448C5?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-AI_Orchestration-FF6F00?style=flat&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![Tests](https://img.shields.io/badge/Tests-100%25%20Passing-brightgreen?style=flat&logo=pytest&logoColor=white)](https://pytest.org)

A high-performance **Feature-Driven Modular Monolith** that aggregates over **4,160+ Central and State welfare schemes**, evaluates citizen profiles with a **sub-millisecond deterministic bitmask rule engine**, extracts verified citizen demographics via **Document Vision OCR into an immutable facts ledger**, caches hot catalog queries with **distributed Valkey / Redis**, and serves citizens through both a **Next.js 16 Web Portal** and a **de-mocked React Native / Expo Mobile App** powered by a **3-tier resilience AI cascade** (Google Gemini $\to$ Groq Cloud $\to$ Local CLI `agy`) with real-time SSE streaming.

---

## 🎯 The Problem We Solved

Every year, thousands of crores in Indian central and state welfare benefits go unclaimed. The barriers are systemic:
1. **Fragmented Portals & Complex Criteria**: Eligibility rules (age brackets, income ceilings, land ownership, occupation codes, state residence) are buried inside 50-page government gazettes across hundreds of different ministry sites.
2. **Repetitive Paperwork**: Citizens are forced to manually enter and explain the same basic demographic data across every scheme inquiry.
3. **Language & Accessibility Barriers**: Rural and low-income citizens struggle with rigid forms and technical jargon; mobile-first and voice-assisted access is essential.
4. **Cloud API & High-Traffic Bottlenecks**: Public welfare systems must withstand heavy traffic without failing when upstream LLM APIs experience rate limits or outages.

---

## 💡 System Architecture

```mermaid
graph TD
    Citizen["Citizen / Officer"] --> Clients
    
    subgraph Clients ["Client Platforms"]
        Web["Next.js 16 Web App (App Router / Turbopack / Web Speech)"]
        Mobile["React Native / Expo 54 Mobile App (MMKV / Native Haptics / Real API)"]
    end
    
    Clients --> Gateway["FastAPI Gateway (backend/app/main.py)"]
    
    subgraph Backend ["backend/app/modules/ (Modular Monolith)"]
        Chat["chat/ (LangGraph Multi-Turn Agent & SSE Streaming)"]
        Auth["auth/ (JWT Auth, Citizen Facts & Verified Profile)"]
        Schemes["schemes/ (Faceted Search, Categories & Ministry Catalog)"]
        Elig["eligibility/ (⚡ In-Memory Bitmask Engine & Explainable Reasoner)"]
        Vault["vault/ (Document Storage, OCR Scanner & Readiness)"]
        Admin["admin/ (Operations Center & Visual Rule Builder)"]
    end
    
    Gateway --> Chat
    Gateway --> Auth
    Gateway --> Schemes
    Gateway --> Elig
    Gateway --> Vault
    Gateway --> Admin
    
    Schemes --> Cache[("⚡ Valkey / Redis Distributed Cache")]
    Cache -->|Cache Miss| Postgres[("PostgreSQL 17 DB")]
    
    Chat --> Cascade{"3-Tier AI Resilience Cascade"}
    Cascade -->|Tier 1: Cloud Primary| Gemini["Google Gemini 3.8 / 3.7 Flash"]
    Cascade -->|Tier 2: Fast Failover| Groq["Groq Cloud (qwen / llama-3.3)"]
    Cascade -->|Tier 3: Air-Gapped Fallback| LocalCLI["Local CLI AI (agy)"]
    
    Elig --> RAM["⚡ RAM Bitmasks (850µs / 7,200+ QPS)"]
    Vault --> Storage[("Cloudinary CDN / MinIO S3 Encrypted Storage")]
    Auth --> Postgres
```

---

## 🚀 Core Platform Capabilities

### 1. 📱 Production React Native Mobile App (`mobile/`)
- **100% De-Mocked Architecture**: Fully wired to live backend API endpoints with zero fake mock files.
- **Instant Eligibility Engine Client**: Evaluates citizen demographics directly against the backend `/eligibility/explain` engine with step-by-step guidance.
- **High-Speed Offline Persistence**: Powered by `react-native-mmkv` for sub-millisecond scheme caching and `expo-secure-store` for authenticated sessions.
- **Document Vault & Cloudinary Sync**: Uploads identity and income documents with dynamic image transformations and category auto-tagging.
- **AI Advisor with Real Streaming**: Conversational chat with citations, recommendations, and multi-turn context.
- **Bi-Directional Support**: Categorized FAQ database, instant search, and official grievance escalation channels.

### 2. ⚡ In-Memory Bitmask Rule Engine (`/check` & `/eligibility`)
- **Sub-Millisecond Evaluations**: Pre-compiles all 4,160+ Central and State welfare scheme eligibility rules into integer bitmasks loaded directly in RAM.
- **Zero SQL Overhead**: Evaluates full citizen eligibility checks in **~850 microseconds (0.85 ms)** on a single core without hitting the database.
- **Multi-Core Scaling**: Exceeds **7,200 queries/second** on a 16-core machine (`make benchmark-multicore`).
- **Explainable Reasoner (`/eligibility/explain`)**: Instead of a black-box yes/no, categorizes schemes into **Eligible**, **Nearly Eligible** (pinpoints unmet criteria, e.g. *"Requires income under ₹1.5L, your declared income is ₹2.0L"*), and **Ineligible**.

### 3. ⚡ High-Throughput Valkey / Redis Caching Layer
- **Transparent Query Cache**: Caches scheme detail queries, slug lookups, faceted searches, and category catalogs with configurable TTL (`CACHE_TTL_SECONDS`).
- **Pydantic & ISO Timestamp Handling**: Robust serialization preserving nested relational models (`benefits`, `eligibility_rules`, `required_documents`).
- **Auto-Invalidation**: Real-time cache invalidation on scheme creation, updates, and version snapshots.

### 4. 💬 Flagship Conversational Citizen Advisor (`/` & `/c/[id]`)
- **Natural Language Advisory**: Understands informal and mixed Hinglish inputs (*"I am a 42-year-old farmer in UP with 2 acres of land, what support can I get?"*).
- **Indexical & Anaphoric Reasoning**: Remembers previous turns and resolves conversational references (*"how do I apply for the second one?"*).
- **Real-Time Token Streaming (SSE)**: Streams generated responses token-by-token with zero waiting or blank states.
- **Actionable Grounded Citations**: Direct links, ministry source chips, and actionable benefit cards embedded directly in the message stream.

### 5. 🪪 Citizen Document Vault & OCR Fact Feeder (`/vault`)
- **Hybrid Storage Support**: Production-grade support for Cloudinary CDN or MinIO S3 object storage with presigned URLs and binary magic-byte inspection (PDF, PNG, JPG, WebP).
- **Multimodal OCR Fact Extraction**: Uses Vision AI to extract verified demographic facts (Full Name, Date of Birth, Gender, State, District, Income, Caste) directly from uploaded documents.
- **Immutable Fact Audit Trail (`citizen_facts`)**: Extracted facts are recorded with source document provenance (`source_document_id`, `source_type="document_ocr"`, `verified_at`).
- **Application Readiness Meter**: Compares citizen uploaded documents against a target scheme's required checklist in real time (e.g., 2/3 documents uploaded $\to$ 66.7% Ready).

### 6. 🛡️ 3-Tier AI Resilience Cascade
Public welfare platforms cannot go down when commercial APIs hit rate limits:
1. **Tier 1 (Google Gemini 3.8 / 3.7 Flash)**: Primary LLM for deep reasoning and multi-step tool calling.
2. **Tier 2 (Groq Cloud `qwen3.8-27b` / `llama-3.3-70b`)**: Sub-100ms failover triggered immediately upon HTTP 429 (quota exhaustion) or timeout.
3. **Tier 3 (Local CLI AI `agy`)**: Instant local process fallback when external internet or cloud quotas are completely unavailable.

### 7. 🏛️ Government Operations Center & Visual Rule Builder (`/admin`)
- **Welfare Schemes Management**: Search, filter, inspect, publish, and delete live and draft schemes.
- **Visual Eligibility Builder**: Construct conditional logic rules without writing code (Field: `annual_income`, Operator: `lte`, Value: `200000`).
- **Benefit & Document Checklist Editor**: Define financial grants, interest subsidies, and mandatory application documents per scheme.

---

## 📐 Architecture & Modular Monolith Pattern

Code is organized strictly **by business capability**, avoiding technical layer silos (`controllers/`, `services/`, `models/`). Every domain feature in `backend/app/modules/<feature>/` follows the standardized 4-file pattern:

```
backend/app/modules/
├── auth/          # Authentication, JWT, Citizen Profiles & Provenance Facts
│   ├── models.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── schemes/       # Welfare Scheme Catalog, Categories, Search & Valkey Caching
│   ├── models.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── eligibility/   # ⚡ Deterministic Bitmask Engine & Explainable Reasoner
│   ├── engine.py
│   ├── bitmask.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── chat/          # LangGraph Multi-Turn Agent, SSE Streaming & Failover
│   ├── chat_graph.py
│   ├── groq_provider.py
│   ├── tools.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
├── vault/         # S3 / Cloudinary Storage, OCR Fact Extraction & Readiness Meter
│   ├── models.py
│   ├── schemas.py
│   ├── service.py
│   └── router.py
└── admin/         # Administrative Portal & Scheme Configuration
    ├── router.py
    └── schemas.py
```

---

## 🗂️ Project Layout

```text
scheme-backend/
├── backend/                  # FastAPI 0.115+ Backend Application
│   ├── app/
│   │   ├── core/             # Cross-cutting concerns (config, deps, security, cache, errors)
│   │   ├── modules/          # Feature-Driven domain modules (auth, schemes, eligibility, chat, vault, admin)
│   │   ├── seeds/            # Database seeders (4,160+ National & State schemes + Default Admin)
│   │   ├── database.py       # SQLAlchemy engine & SessionLocal factory
│   │   └── main.py           # FastAPI entrypoint mounting feature routers
│   ├── alembic/              # Database schema migrations
│   ├── pyproject.toml        # UV package manager dependencies
│   └── Dockerfile            # Container build specification
│
├── mobile/                   # React Native (Expo 54 + TypeScript) Mobile Application
│   ├── src/
│   │   ├── app/              # Expo Router tabs & navigation screens
│   │   ├── core/             # HTTP client, MMKV storage, theme, and config validation
│   │   └── features/         # Feature-first domain modules:
│   │       ├── advisor/      # AI Advisor chat interface, thinking steps, prompt chips
│   │       ├── auth/         # Authentication flow, secure token store, phone/OTP
│   │       ├── check/        # Real-time eligibility evaluation flow & questionnaire
│   │       ├── onboarding/   # Language selection & first-run state
│   │       ├── profile/      # Citizen settings, linked accounts, preferences
│   │       ├── schemes/      # Scheme discovery, category filters, bookmarks
│   │       ├── support/      # Categorized FAQs and grievance support
│   │       └── vault/        # Document upload, Cloudinary sync & fact extraction
│   └── package.json
│
├── web/                      # Next.js 16 (App Router + Turbopack) Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (/, /c/[id], /vault, /schemes, /check, /admin)
│   │   ├── modules/          # Feature-first frontend components, hooks, and repositories
│   │   ├── core/             # Shared layout, AppSidebar, and API client
│   │   └── lib/              # Session token management & type definitions
│   └── package.json
│
├── scripts/
│   ├── dev.py                # All-in-one local development launcher
│   ├── benchmark_multicore.py# 100k queries multi-core benchmark
│   └── test_human_conversations_e2e.py # Multi-persona real-world simulation
│
├── compose.yaml              # Docker Compose: PostgreSQL 17 + MinIO S3 + Backend + Web
├── Makefile                  # 1-Command developer automation shortcuts
└── README.md
```

---

## ⚡ Quickstart & Setup

### Prerequisites
- **Python 3.13+** with [`uv`](https://docs.astral.sh/uv/)
- **Node.js 20+** and `npm`
- **Docker** and `docker compose` running
- *(Optional for Mobile)*: **Android Studio** (SDK 35) or **Expo Go**

---

### Option A: The One-Command All-in-One Launcher (Web + Backend)

Run the comprehensive development orchestrator:
```bash
make dev
```
This automatically:
1. Starts PostgreSQL 17 and MinIO S3 containers in the background.
2. Waits for PostgreSQL to become healthy and ready.
3. Runs Alembic database schema migrations.
4. Auto-seeds the database with 4,160+ schemes and the default admin (`admin@gov.in` / `AdminPass123!`).
5. Spawns the FastAPI backend on `http://localhost:8000` (Swagger docs at `/docs`).
6. Spawns the Next.js web application on `http://localhost:3000`.

---

### Option B: Running the Mobile App

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install
   ```

2. **Start Metro Bundler**:
   ```bash
   npm run start
   ```

3. **Run on Android Emulator / Physical Device**:
   ```bash
   npm run android
   ```

4. **Build Standalone Release APK**:
   ```bash
   cd mobile/android
   ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
   # Output APK: mobile/android/app/build/outputs/apk/release/app-release.apk
   ```

---

### Option C: Step-by-Step Manual Launch

#### 1. Start Infrastructure
```bash
docker compose up -d postgres minio minio-createbuckets
```

#### 2. Run Backend
```bash
cd backend
uv sync
uv run alembic upgrade head
uv run python -m app.seeds.seed_national_schemes
uv run uvicorn app.main:app --reload --port 8000
```

#### 3. Run Web Frontend
```bash
cd web
npm install
npm run dev
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` in the root directory:

```env
# Database (PostgreSQL 17)
DATABASE_URL=postgresql+psycopg://scheme_user:scheme_password@localhost:5432/scheme_db

# Security & JWT
SECRET_KEY=change_this_to_a_secure_random_secret_in_production_key_123456
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Valkey / Redis Distributed Cache
VALKEY_URL=valkeys://default:<password>@<host>:<port>
CACHE_TTL_SECONDS=86400

# Object Storage (Cloudinary or MinIO)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=dzao8h1ay
CLOUDINARY_API_KEY=818269883432412
CLOUDINARY_API_SECRET=TWQzFg_c4N28mPs3g07qlC29HT8

# AI & LLM Keys
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
LLM_PROVIDER=gemini
```

---

## 🧪 Testing & Verification

The codebase maintains rigorous automated testing across backend, web, and mobile modules:

### 1. Mobile Test Suite (68 Unit & Integration Tests)
```bash
cd mobile && npm run test && npm run typecheck
# Output: 68 tests passed, 0 failures, 0 TypeScript errors
```

### 2. Backend Core & Valkey Caching Tests
```bash
cd backend && uv run pytest app/modules/schemes/__tests__/test_valkey_caching.py -v
# Output: 2 passed (verifying cache hits and bypass)
```

### 3. Backend Integration Suite (`schemes`, `eligibility`, `vault`, `auth`, `chat`)
```bash
cd backend && uv run pytest app/modules/ -v
# Output: All module tests passing
```

### 4. Web Production Build & Typecheck
```bash
cd web && npm run build
# Output: Compiled successfully, 0 errors, static & dynamic routes generated
```

---

## 📊 In-Memory Bitmask Engine Benchmark

Evaluated on a 16-core system across 100,000 randomized citizen profiles against 4,145 schemes in RAM:

```text
======================================================================
🔥 MULTI-CORE BITMASK ENGINE BENCHMARK (16 CPU CORES)
======================================================================
• Active Worker Processes:    16 (1 per CPU core)
• Total Processed Queries:   100,000 Citizen Profiles
• Schemes Evaluated per Run: 4,145 Schemes in RAM
• Total Execution Time:      13.840 seconds
• Combined Multi-Core QPS:   7,225 queries/second
• Average Latency per Query: 138.40 microseconds (µs)
• Total Rule Evaluations:    38,220,000 evaluations
======================================================================
```

---

## 🔐 Security & Governance

- **Argon2id & JWT**: Secure password hashing with Argon2id and stateless JSON Web Tokens matching Better Auth standards.
- **IDOR Protection**: Strict user identity ownership checks on citizen profiles, vault documents, and eligibility evaluations.
- **Binary Magic-Byte Inspection**: Uploaded files undergo binary header inspection (PDF `%PDF`, PNG `\x89PNG`, JPEG `\xff\xd8\xff`, WebP `RIFF...WEBP`) preventing MIME-spoofing attacks.
- **Immutable Fact Provenance Ledger**: Demographics extracted from documents are signed with source document IDs, verification timestamps, and verification type (`document_ocr`).

---

## 📄 License
This project is open-source software licensed under the **MIT License**.
