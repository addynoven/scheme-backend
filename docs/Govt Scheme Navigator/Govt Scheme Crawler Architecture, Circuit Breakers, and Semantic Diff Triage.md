---
type: system
title: "Govt Scheme Crawler Architecture, Circuit Breakers, and Semantic Diff Triage"
description: "Data harvesting systems architecture: Stealth Playwright scrapers, SHA-256 semantic deduplication, automated quarantine circuit breakers, and differential classification triage."
tags:
  - system
  - architecture
  - web-scraping
  - playwright
  - cdc
  - circuit-breaker
  - data-engineering
timestamp: 2026-08-28T00:00:00Z
---

# Govt Scheme Crawler Architecture & Circuit Breaker Invariants

An enterprise data harvesting systems architecture derived from **Scheme-Backend (`app/modules/ingestion/`)**, analyzing stealth scraping, SHA-256 semantic deduplication, automated quarantine circuit breakers, and differential schema update classification.

---

## 1. Automated Harvester & Quarantine Triage Pipeline

```mermaid
graph TD
    GovtPortals[Official Government Portals: myScheme / State Portals] --> StealthHarvester[Stealth Playwright Harvester: Headless Chromium]
    StealthHarvester --> SemanticHasher[SHA-256 Semantic Canonical Hasher]
    
    SemanticHasher --> DiffEngine[Differential Schema Classifier: AST & Rule Diffs]
    DiffEngine --> ThresholdCheck{Diff Magnitude > 40%?}
    
    ThresholdCheck -->|Yes (Suspicious)| Quarantine[Quarantine Circuit Breaker: S3 Staging Hold]
    Quarantine --> AdminAlert[Admin Notification: Triage Dashboard]
    
    ThresholdCheck -->|No (Verified Update)| LiveIngestion[Live Database Transaction: Upsert Scheme]
    LiveIngestion --> BitmaskRecompile[Recompile In-Memory Bitmask Rule Engine]
```

```
┌──────────────────────────────┬──────────────────────────────┬────────────────────────────────────────┐
│ Harvester Component          │ Implementation Module        │ Anti-Fragile Resiliency Invariant      │
├──────────────────────────────┼──────────────────────────────┼────────────────────────────────────────┤
│ **1. Stealth Harvester**     │ `stealth_myscheme_harvester` │ Fingerprint masking & jittered dwell   │
│                              │                              │ intervals to avoid IP rate-limiting.   │
├──────────────────────────────┼──────────────────────────────┼────────────────────────────────────────┤
│ **2. Semantic Hasher**       │ `semantic_hasher.py`         │ SHA-256 hashes only substantive rules; │
│                              │                              │ ignores cosmetic markup / CSS changes. │
├──────────────────────────────┼──────────────────────────────┼────────────────────────────────────────┤
│ **3. Circuit Breaker**       │ `circuit_breaker.py`         │ Halts automated ingestion if $>5$ portal│
│                              │                              │ schemes fail schema validation in a row│
├──────────────────────────────┼──────────────────────────────┼────────────────────────────────────────┤
│ **4. Differential Triage**   │ `diff_classifier.py`         │ Classifies updates into `CRITICAL`,    │
│                              │                              │ `PARAMETRIC`, or `COSMETIC` revisions. │
└──────────────────────────────┴──────────────────────────────┴────────────────────────────────────────┘
```

---

## 2. The Semantic Deduplication Invariant

```
Substantive Scheme Semantic Hash:
H_substantive = SHA256(Title_{clean} + Age_{min,max} + Income_{ceiling} + Category_{set} + Documents_{required})
```

> **The Quarantine Circuit Breaker Invariant**: Web scrapers consuming third-party government websites must **never ingest breaking portal changes directly into the live production database**; anomalous updates exceeding differential thresholds ($>40\%$ text delta or structural schema drops) must automatically trigger the **Quarantine Circuit Breaker**, isolating raw payloads into S3 quarantine buckets for administrative triage.

---

## 3. Related Graph Connections

- **[[Government Ingestion CDC and Circuit Breaker Pipeline|Ingestion: CDC Pipeline]]**: Ingestion architecture.
- **[[Govt Scheme Navigator System Architecture|Platform: Scheme Navigator]]**: Overall public infrastructure.
- **[[In-Memory Bitmask Rule Engine Architecture|Database: Bitmask Engine]]**: Rule evaluation compilation.
- **[[README|Master Map of Content (MOC)]]**: Root directory.
