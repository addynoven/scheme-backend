# 🌐 Citizen Welfare Navigator — Web Application

Production-grade citizen portal built with **Next.js 16 (App Router + Turbopack)**, **Tailwind CSS**, and **TypeScript**.

## 🚀 Capabilities

- **Conversational AI Advisor** (`/` & `/c/[id]`): Multi-turn SSE token streaming with grounded scheme citations and source chips.
- **Browser-Native Speech-to-Text**: Client-side zero-latency STT via Web Speech API (`webkitSpeechRecognition`).
- **Instant Eligibility Evaluator** (`/check`): Interactive multi-step form evaluating citizen demographics with explainable criteria.
- **Document Vault** (`/vault`): MinIO S3 and Cloudinary file uploads with Vision OCR fact extraction and readiness progress tracker.
- **Government Operations Center** (`/admin`): Visual scheme manager and rule builder for welfare administrators.

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server on http://localhost:3000
npm run dev

# Run Vitest test suite
npm test

# Run Oxlint
npm run lint

# Build production bundle
npm run build
```

## 📐 Architecture

Follows a feature-driven modular structure in `src/modules/`:
```text
src/
├── app/          # Next.js App Router route handlers & pages
├── modules/      # Feature modules (home, vault, schemes, check, admin)
│   ├── home/     # Conversational chat, composer, citations
│   ├── vault/    # Vault dropzone, OCR review modals
│   ├── schemes/  # Browse catalogs & scheme details
│   ├── check/    # Instant eligibility quiz
│   └── admin/    # Visual rule builder & scheme editor
└── core/         # Shared layouts, AppSidebar, and API client
```
