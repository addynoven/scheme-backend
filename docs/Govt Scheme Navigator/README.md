# Govt Scheme Navigator — Project Documentation

> Dedicated workspace for the **Government Benefits Navigator (GovShemex / Scheme-Backend)** public digital infrastructure project.

---

## 🏛️ Master System Blueprint
- [[Govt Scheme Navigator System Architecture]] — End-to-end system architecture, 9-line architectural axiom, and 8-phase execution roadmap.

---

## ⚡ Core Eligibility & Query Engine
- [[In-Memory Bitmask Rule Engine Architecture]] — Microsecond $(<0.05\text{ms})$ eligibility rule evaluation via pre-compiled integer bitmasks.
- [[Two-Stage Query Rewriter and Multi-Engine Router]] — Conversational Indic query normalization and tri-path dispatching (SQL Bitmask, OKF, RAG).
- [[Household Welfare Graph and Family Eligibility Engine]] — Multi-member relational graph modeling family entitlement discovery.

---

## 🔄 Ingestion, Harvesters & CDC Pipelines
- [[Govt Scheme Domain Data Models, Ingestion CDC, and Household Graphs]] — SQLAlchemy modular domain models and CDC semantic hashing.
- [[Government Ingestion CDC and Circuit Breaker Pipeline]] — Production CDC harvester pipeline with S3 quarantine circuit breakers.
- [[Govt Scheme Crawler Architecture, Circuit Breakers, and Semantic Diff Triage]] — Stealth Playwright scrapers and semantic differential triage.
- [[Stealth Harvester and Anti-Bot Crawler Architecture]] — Anti-bot evasion, persistent browser contexts, and checkpointing.

---

## 📄 Document Vault & Multimodal Vision OCR
- [[Document Vault and Scheme Readiness Meter]] — MinIO encrypted certificate storage, alias matching, and readiness score ($0\text{--}100\%$).
- [[Multimodal Vision OCR and Citizen Fact Provenance]] — Gemini Vision OCR fact extraction, verification modals, and DPDP 2023 audit trails.

---

## 🎙️ Voice & Kiosk Gateways
- [[Voice-First Indic Kiosk Gateway Architecture]] — 24kHz bidirectional WebSocket gateway, Indic STT/TTS, and Gemini Live tool calling.
- [[Gemini Live Voice Kiosk Gateway and Multimodal Vision OCR Architecture]] — FastAPI implementation blueprint for real-time kiosk voice and camera OCR.

---

## 📱 Client & Domain Context
- [[GovShemex Flutter Client State Architecture, Provider Models, and Kiosk Ergonomics]] — Flutter multi-target state architecture and offline SQLite caching.
- [[Indian Administrative Hierarchy and Fiscal Revenue Architecture]] — Domain reference on administrative tiers, revenue, and land records.
