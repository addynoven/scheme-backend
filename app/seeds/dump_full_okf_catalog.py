"""
Bulk OKF Knowledge Catalog Builder & Dumper (V2.5).

Generates the complete canonical OKF knowledge representation from the scheme database and open data catalog:
1. `knowledge/schemes/*.md`: Rich Markdown + YAML frontmatter for all schemes.
2. `knowledge/documents/*.md`: Official required document taxonomy & guidelines.
3. `knowledge/ministries/*.md`: Central & State Ministry hierarchy & contact points.
4. `knowledge/raw_dumps/*.json`: Raw JSON archives.
5. `knowledge/index.md`: Master searchable registry & sitemap.
"""

import json
import re
from pathlib import Path
from typing import Any
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.modules.schemes.models import Scheme


def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


def build_full_okf_catalog(
    base_dir: Path = Path("/home/neon/programs/side_project/scheme-backend/knowledge"),
) -> dict[str, int]:
    schemes_dir = base_dir / "schemes"
    docs_dir = base_dir / "documents"
    ministries_dir = base_dir / "ministries"
    raw_dir = base_dir / "raw_dumps"

    schemes_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)
    ministries_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)

    db = SessionLocal()
    try:
        schemes = list(
            db.query(Scheme)
            .options(
                selectinload(Scheme.benefits),
                selectinload(Scheme.eligibility_rules),
                selectinload(Scheme.required_documents),
                selectinload(Scheme.official_sources),
            )
            .all()
        )

        print(f"Loaded {len(schemes)} schemes from database. Generating OKF canonical representations...")

        all_documents: dict[str, dict[str, Any]] = {}
        all_ministries: dict[str, dict[str, Any]] = {}
        schemes_metadata: list[dict[str, Any]] = []

        # 1. Generate Scheme OKF Files
        for s in schemes:
            slug = s.slug or _slugify(s.name)
            state_val = s.state or "ALL_INDIA"
            gov_level = "central" if state_val in ("ALL_INDIA", None) else "state"
            tags_list = [t.strip() for t in (s.tags or "").split(",") if t.strip()]
            if not tags_list:
                tags_list = [s.category.lower() if s.category else "general", state_val.lower()]

            # Track documents
            doc_slugs = []
            for d in s.required_documents:
                d_slug = _slugify(d.document_name)
                doc_slugs.append(d_slug)
                all_documents.setdefault(
                    d_slug,
                    {
                        "name": d.document_name,
                        "slug": d_slug,
                        "description": d.description or f"Official {d.document_name} required for government verification.",
                        "used_in_schemes": [],
                    },
                )
                if slug not in all_documents[d_slug]["used_in_schemes"]:
                    all_documents[d_slug]["used_in_schemes"].append(slug)

            # Track Ministry
            min_name = s.ministry or ("Ministry of Agriculture & Farmers Welfare" if s.category == "Agriculture" else "Government of India")
            min_slug = _slugify(min_name)
            all_ministries.setdefault(
                min_slug,
                {
                    "name": min_name,
                    "slug": min_slug,
                    "state": state_val,
                    "level": gov_level,
                    "schemes": [],
                },
            )
            all_ministries[min_slug]["schemes"].append(s.name)

            # Build YAML Frontmatter
            frontmatter_lines = [
                "---",
                f'id: "{slug}"',
                f'slug: "{slug}"',
                f'title: "{s.name}"',
                f'ministry: "{min_name}"',
                f'government_level: "{gov_level}"',
                f'state: "{state_val}"',
                f'category: "{s.category or "General"}"',
                f'official_portal: "{s.application_url or s.official_website or "https://www.myscheme.gov.in"}"',
                f'status: "{s.status or "active"}"',
                "related_documents:",
            ]
            for ds in doc_slugs:
                frontmatter_lines.append(f'  - "{ds}"')
            frontmatter_lines.append("tags:")
            for t in tags_list:
                frontmatter_lines.append(f'  - "{t}"')
            frontmatter_lines.append("---")

            frontmatter_str = "\n".join(frontmatter_lines)

            # Markdown Content
            benefits_md = (
                "\n".join([f"- **{b.title}:** {b.description}" for b in s.benefits])
                if s.benefits
                else f"- **Direct Welfare Assistance:** Financial and procedural support under {s.name}."
            )

            rules_md = (
                "\n".join([f"- `{r.field_name} {r.operator} {r.rule_value}`" for r in s.eligibility_rules])
                if s.eligibility_rules
                else f"- `state eq {state_val}`"
            )

            docs_md = (
                "\n".join([f"- **{d.document_name}** ({'Mandatory' if d.is_mandatory else 'Optional'}): {d.description or ''}" for d in s.required_documents])
                if s.required_documents
                else "- **Aadhaar Card**: Mandatory identity proof."
            )

            sources_md = (
                "\n".join([f"- [{src.title}]({src.url}) ({src.source_type})" for src in s.official_sources])
                if s.official_sources
                else f"- [Official Portal]({s.application_url or 'https://www.myscheme.gov.in'})"
            )

            scheme_md_content = f"""{frontmatter_str}

# {s.name}

## 1. Overview & Objective
{s.description or f"Official government welfare program launched by {min_name} for eligible citizens."}

## 2. Benefits & Financial Assistance
{benefits_md}

## 3. Eligibility Criteria (Deterministic Rules)
{rules_md}

## 4. Required Documents Checklist
{docs_md}

## 5. Application Procedure
1. Verify that your citizen profile satisfies the eligibility rules listed above.
2. Ensure you have the required documents uploaded and verified in your Document Vault.
3. Access the official application portal: [{s.application_url or s.official_website or 'https://www.myscheme.gov.in'}]({s.application_url or s.official_website or 'https://www.myscheme.gov.in'}).
4. Submit the verified application with your registration number.

## 6. Official Sources & Gazette References
{sources_md}
"""
            scheme_file = schemes_dir / f"{slug}.md"
            scheme_file.write_text(scheme_md_content, encoding="utf-8")

            # Store in raw dump list
            schemes_metadata.append(
                {
                    "id": s.id,
                    "name": s.name,
                    "slug": slug,
                    "state": state_val,
                    "category": s.category,
                    "ministry": min_name,
                    "application_url": s.application_url,
                    "benefits": [{"title": b.title, "desc": b.description} for b in s.benefits],
                    "rules": [{"field": r.field_name, "op": r.operator, "val": r.rule_value} for r in s.eligibility_rules],
                    "documents": [d.document_name for d in s.required_documents],
                }
            )

        # 2. Generate Document Taxonomy OKF Files
        for d_slug, d_info in all_documents.items():
            doc_md = f"""---
id: "{d_slug}"
slug: "{d_slug}"
name: "{d_info['name']}"
issuing_authority: "Competent State / Central Authority (UIDAI / Revenue Dept / Tehsildar)"
total_associated_schemes: {len(d_info['used_in_schemes'])}
---

# {d_info['name']}

## 1. Purpose & Description
{d_info['description']}

## 2. How to Obtain / Verification Guidelines
- Citizens can verify their {d_info['name']} in the Document Vault using automated OCR fact extraction.
- Issued digitally via DigiLocker / State e-District Portal / Sub-Divisional Magistrate (SDM).

## 3. Applicable Schemes Requiring This Document
{chr(10).join([f'- [{s_slug}](../schemes/{s_slug}.md)' for s_slug in d_info['used_in_schemes'][:25]])}
"""
            (docs_dir / f"{d_slug}.md").write_text(doc_md, encoding="utf-8")

        # 3. Generate Ministry OKF Files
        for m_slug, m_info in all_ministries.items():
            min_md = f"""---
id: "{m_slug}"
slug: "{m_slug}"
name: "{m_info['name']}"
state: "{m_info['state']}"
level: "{m_info['level']}"
total_schemes_managed: {len(m_info['schemes'])}
---

# {m_info['name']}

## 1. Jurisdiction & Level
- **Administrative Level:** {m_info['level'].upper()}
- **State / Territory:** {m_info['state']}

## 2. Administered Welfare Schemes ({len(m_info['schemes'])})
{chr(10).join([f'- {name}' for name in m_info['schemes'][:30]])}
"""
            (ministries_dir / f"{m_slug}.md").write_text(min_md, encoding="utf-8")

        # 4. Save Raw JSON Archive Dump
        raw_json_file = raw_dir / "all_schemes_canonical_dump.json"
        raw_json_file.write_text(json.dumps(schemes_metadata, indent=2, ensure_ascii=False), encoding="utf-8")

        # 5. Generate Master OKF Index
        index_md = f"""# 🏛️ Open Knowledge Framework (OKF) — Master Scheme Knowledge Graph

> **Canonical agent-readable knowledge layer for the Government Benefits Navigator.**

---

## 📊 Knowledge Graph Summary
- **Total Schemes Cataloged:** {len(schemes)}
- **Total Required Document Taxonomies:** {len(all_documents)}
- **Total Ministries & Departments:** {len(all_ministries)}
- **Raw JSON Backup:** [`knowledge/raw_dumps/all_schemes_canonical_dump.json`](raw_dumps/all_schemes_canonical_dump.json)

---

## 📁 Directory Structure
```text
knowledge/
├── index.md                  # This master registry
├── schemes/                  # {len(schemes)} Canonical scheme files
├── documents/                # {len(all_documents)} Document taxonomies & verification guides
├── ministries/               # {len(all_ministries)} Central & State ministry hierarchies
└── raw_dumps/                # Machine-readable JSON archives
```

---

## 🔍 Flagship Schemes Fast Access
- [Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)](schemes/pm-kisan-samman-nidhi.md)
- [Ayushman Bharat PM-JAY](schemes/ayushman-bharat-pmjay.md)
- [Mukhya Mantri Ladli Behna Yojana (Madhya Pradesh)](schemes/mp-ladli-behna-yojana.md)
- [State Government ST Scholarship Class 9-10 (MP)](schemes/mp-st-scholarship-class-9-10.md)
- [Mukhyamantri Majhi Ladki Bahin (Maharashtra)](schemes/mh-majhi-ladki-bahin.md)
- [Yuva Nidhi Scheme (Karnataka)](schemes/ka-yuva-nidhi-scheme.md)
"""
        (base_dir / "index.md").write_text(index_md, encoding="utf-8")

        return {
            "total_schemes": len(schemes),
            "total_documents": len(all_documents),
            "total_ministries": len(all_ministries),
            "raw_dump_size_kb": int(raw_json_file.stat().st_size / 1024),
        }

    finally:
        db.close()


if __name__ == "__main__":
    res = build_full_okf_catalog()
    print("=" * 60)
    print("✓ FULL OKF CANONICAL KNOWLEDGE GRAPH GENERATION COMPLETE")
    print("=" * 60)
    for k, v in res.items():
        print(f"  • {k:25s}: {v}")
    print("=" * 60)
