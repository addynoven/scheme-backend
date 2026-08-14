"""
MyScheme.gov.in Scraper, Parser & Canonical Knowledge Transformer (V2.5).

Extracts and structures rich government scheme data into:
1. PostgreSQL Relational Entities (schemes, eligibility_rules, benefits, required_documents, official_sources)
2. OKF (Open Knowledge Framework) Canonical Markdown files with YAML frontmatter.
"""

from dataclasses import dataclass, field
import json
import re
import urllib.request
from pathlib import Path
from typing import Any
from sqlalchemy.orm import Session

from app.modules.schemes.models import (
    Benefit,
    EligibilityRule,
    OfficialSource,
    RequiredDocument,
    Scheme,
)


@dataclass
class ParsedSchemeData:
    title: str
    slug: str
    ministry: str
    state: str
    category: str
    tags: list[str]
    overview: str
    benefits: list[dict[str, str]]
    eligibility_rules: list[dict[str, str]]
    exclusions: list[str]
    application_process: list[str]
    application_mode: str
    application_url: str
    required_documents: list[dict[str, Any]]
    faqs: list[dict[str, str]]
    official_sources: list[dict[str, str]]


def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")


def parse_myscheme_text_or_markdown(raw_text: str, fallback_slug: str | None = None) -> ParsedSchemeData:
    """
    Parses pasted text or scraped content from MyScheme into a structured ParsedSchemeData object.
    Handles sections: Details, Benefits, Eligibility, Exclusions, Application Process, Documents Required, FAQs, Sources.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    full_text = "\n".join(lines)

    # 1. Extract Ministry & Title
    ministry = "Government of India"
    title = "Government Scheme"

    ministry_match = re.search(r"(?:Ministry of|Department of|Tribal Affairs Department)[^\n,.]+", full_text, re.IGNORECASE)
    if ministry_match:
        ministry = ministry_match.group(0).strip()

    nav_keywords = {
        "details", "benefits", "eligibility", "application process", "documents required",
        "sources and references", "frequently asked questions", "feedback", "cancel", "ok",
        "sign in", "apply now", "back", "home", "check eligibility", "you're being redirected",
        "something went wrong", "pre-matric", "post-matric"
    }

    # Title detection
    quote_title_match = re.search(r'(?:The\s+[\"“\'])([^\"”\']{5,80})(?:[\"”\']\s+scheme)', full_text, re.IGNORECASE)
    if quote_title_match:
        title = quote_title_match.group(1).strip()
    else:
        for line in lines:
            cleaned_lower = line.lower().strip()
            if (
                cleaned_lower not in nav_keywords
                and not any(cleaned_lower.startswith(p) for p in ["http", "your mobile", "you have", "it seems", "you're being", "something went", "by proceeding"])
                and 5 < len(line) < 90
                and not any(cleaned_lower == s.lower() for s in ["madhya pradesh", "maharashtra", "karnataka", "tamil nadu", "uttar pradesh", "rajasthan", "gujarat", "bihar"])
            ):
                title = line.strip()
                break



    # Determine State / Level
    state = "ALL_INDIA"
    for s_name in ["Madhya Pradesh", "Maharashtra", "Karnataka", "Uttar Pradesh", "Tamil Nadu", "Rajasthan", "Gujarat", "Bihar"]:
        if s_name.lower() in full_text[:400].lower():
            state = s_name
            break

    # 2. Extract Category & Tags
    category = "General"
    cat_keywords = {
        "Education": ["student", "fellowship", "scholarship", "faculty", "research", "phd", "college", "degree", "ugc"],
        "Agriculture": ["farmer", "crop", "kisan", "irrigation", "cultivation", "land"],
        "Women & Child": ["women", "girl", "mother", "maternity", "widow", "behna", "mahila"],
        "Healthcare": ["health", "hospital", "medical", "ayushman", "treatment"],
        "Employment & Skills": ["skill", "training", "employment", "unemployed", "apprentice", "stipend"],
        "Business & Finance": ["loan", "msme", "subsidy", "credit", "grant", "venture"],
    }
    for cat, kws in cat_keywords.items():
        if any(kw in full_text.lower() for kw in kws):
            category = cat
            break

    tags = list(set(re.findall(r"\b(student|farmer|women|faculty|fellowship|scholarship|grant|research|ugc|dbt|central|state)\b", full_text, re.IGNORECASE)))

    # 3. Section Slicing via Regex Headings
    def get_section(start_kw: str, stop_kws: list[str]) -> str:
        pattern = rf"(?:^|\n)(?:#*\s*)({start_kw})(.*?)(?=(?:\n(?:#*\s*)(?:{'|'.join(stop_kws)}))|\Z)"
        m = re.search(pattern, full_text, re.DOTALL | re.IGNORECASE)
        return m.group(2).strip() if m else ""

    overview = get_section("Details", ["Benefits", "Eligibility", "Application Process"])
    benefits_sec = get_section("Benefits", ["Eligibility", "Exclusions", "Application Process"])
    eligibility_sec = get_section("Eligibility", ["Exclusions", "Application Process", "Documents Required"])
    exclusions_sec = get_section("Exclusions", ["Application Process", "Documents Required", "Frequently Asked Questions"])
    app_process_sec = get_section("Application Process", ["Documents Required", "Frequently Asked Questions", "Sources And References"])
    docs_sec = get_section("Documents Required", ["Frequently Asked Questions", "Sources And References"])
    sources_sec = get_section("Sources And References|Sources", ["Was this helpful", "Frequently Asked Questions"])

    # 4. Parse Structured Benefits
    benefits_list: list[dict[str, str]] = []
    if benefits_sec:
        for b_line in benefits_sec.splitlines():
            if b_line.strip().startswith(("•", "-", "*", "1.", "2.", "3.", "4.", "5.")) or "₹" in b_line or "Rs" in b_line:
                clean_b = re.sub(r"^[\s•\-*\d.]+", "", b_line).strip()
                if len(clean_b) > 8:
                    benefits_list.append({"title": clean_b[:80], "description": clean_b})
    if not benefits_list and benefits_sec:
        benefits_list.append({"title": "Financial Grant / Welfare Support", "description": benefits_sec[:250]})

    # 5. Parse Eligibility Rules
    rules_list: list[dict[str, str]] = []
    if state != "ALL_INDIA":
        rules_list.append({"field_name": "state", "operator": "eq", "rule_value": state})

    # Age rule detection
    age_match = re.search(r"age.*?not be greater than (\d+)|under (\d+)|above (\d+)|between (\d+)\s*(?:and|-|to)\s*(\d+)", eligibility_sec, re.IGNORECASE)
    if age_match:
        if age_match.group(1):
            rules_list.append({"field_name": "age", "operator": "lte", "rule_value": age_match.group(1)})
        elif age_match.group(2):
            rules_list.append({"field_name": "age", "operator": "lte", "rule_value": age_match.group(2)})
        elif age_match.group(3):
            rules_list.append({"field_name": "age", "operator": "gte", "rule_value": age_match.group(3)})
        elif age_match.group(4) and age_match.group(5):
            rules_list.append({"field_name": "age", "operator": "between", "rule_value": f"{age_match.group(4)}-{age_match.group(5)}"})

    # Occupation / Role rule
    if any(k in full_text.lower() for k in ["faculty", "professor", "teacher"]):
        rules_list.append({"field_name": "occupation", "operator": "in", "rule_value": "faculty,professor,teacher,academic"})
    elif any(k in full_text.lower() for k in ["student", "fellowship", "class 9", "class 10"]):
        rules_list.append({"field_name": "occupation", "operator": "eq", "rule_value": "student"})
    elif any(k in full_text.lower() for k in ["farmer", "cultivator", "kisan"]):
        rules_list.append({"field_name": "occupation", "operator": "eq", "rule_value": "farmer"})

    # 6. Parse Application Steps & URL
    app_steps: list[str] = []
    app_url = "https://www.myscheme.gov.in"
    url_match = re.search(r"https?://[^\s)\]]+", app_process_sec)
    if url_match:
        app_url = url_match.group(0).rstrip(".,;")

    for step_line in app_process_sec.splitlines():
        if re.match(r"^(?:Step \d+|•|-|\d+\.)", step_line.strip(), re.IGNORECASE):
            app_steps.append(step_line.strip())

    # 7. Parse Required Documents
    docs_list: list[dict[str, Any]] = []
    for d_line in docs_sec.splitlines():
        clean_d = re.sub(r"^[\s•\-*\d.]+", "", d_line).strip()
        if len(clean_d) > 3:
            docs_list.append({"document_name": clean_d[:100], "description": clean_d, "is_mandatory": True})

    # 8. Parse Official Sources
    sources_list: list[dict[str, str]] = []
    for s_match in re.finditer(r"\[([^\]]+)\]\((https?://[^\)]+)\)", sources_sec):
        sources_list.append({"title": s_match.group(1).strip(), "url": s_match.group(2).strip(), "source_type": "official_guidelines"})

    if not sources_list and url_match:
        sources_list.append({"title": "Official Portal", "url": app_url, "source_type": "portal"})

    slug = fallback_slug or _slugify(title)

    return ParsedSchemeData(
        title=title,
        slug=slug,
        ministry=ministry,
        state=state,
        category=category,
        tags=tags,
        overview=overview or "Government benefit scheme providing financial and institutional assistance.",
        benefits=benefits_list or [{"title": "Financial Assistance", "description": "Direct financial or procedural assistance as per scheme guidelines."}],
        eligibility_rules=rules_list,
        exclusions=[e.strip() for e in exclusions_sec.splitlines() if e.strip() and len(e) > 5],
        application_process=app_steps or [app_process_sec],
        application_mode="Online" if "online" in app_process_sec.lower() else "Offline",
        application_url=app_url,
        required_documents=docs_list or [{"document_name": "Aadhaar Card", "description": "Identity proof", "is_mandatory": True}],
        faqs=[],
        official_sources=sources_list,
    )


def save_parsed_scheme_to_db_and_okf(
    db: Session,
    parsed: ParsedSchemeData,
    okf_dir: Path = Path("/home/neon/programs/side_project/scheme-backend/knowledge/schemes"),
) -> Scheme:
    """
    Saves the parsed scheme data into PostgreSQL relational tables AND writes the OKF canonical file.
    """
    # 1. Check existing
    existing = db.query(Scheme).filter(Scheme.slug == parsed.slug).first()
    if existing:
        scheme = existing
        scheme.name = parsed.title
        scheme.ministry = parsed.ministry
        scheme.state = parsed.state
        scheme.category = parsed.category
        scheme.tags = ", ".join(parsed.tags)
        scheme.description = parsed.overview
        scheme.application_url = parsed.application_url
    else:
        scheme = Scheme(
            name=parsed.title,
            slug=parsed.slug,
            ministry=parsed.ministry,
            state=parsed.state,
            category=parsed.category,
            tags=", ".join(parsed.tags),
            description=parsed.overview,
            application_url=parsed.application_url,
            official_website=parsed.application_url,
            status="active",
        )
        db.add(scheme)
        db.flush()

    # Refresh relational sub-entities
    db.query(Benefit).filter(Benefit.scheme_id == scheme.id).delete()
    for b in parsed.benefits:
        db.add(Benefit(scheme_id=scheme.id, title=b["title"], description=b["description"]))

    db.query(EligibilityRule).filter(EligibilityRule.scheme_id == scheme.id).delete()
    for r in parsed.eligibility_rules:
        db.add(
            EligibilityRule(
                scheme_id=scheme.id,
                field_name=r["field_name"],
                operator=r["operator"],
                rule_value=r["rule_value"],
            )
        )

    db.query(RequiredDocument).filter(RequiredDocument.scheme_id == scheme.id).delete()
    for d in parsed.required_documents:
        db.add(
            RequiredDocument(
                scheme_id=scheme.id,
                document_name=d["document_name"],
                description=d.get("description", ""),
                is_mandatory=d.get("is_mandatory", True),
            )
        )

    db.query(OfficialSource).filter(OfficialSource.scheme_id == scheme.id).delete()
    for s in parsed.official_sources:
        db.add(
            OfficialSource(
                scheme_id=scheme.id,
                title=s["title"],
                url=s["url"],
                source_type=s.get("source_type", "portal"),
            )
        )

    db.commit()
    db.refresh(scheme)

    # 2. Generate OKF Canonical Markdown File
    okf_dir.mkdir(parents=True, exist_ok=True)
    okf_file = okf_dir / f"{parsed.slug}.md"

    okf_content = f"""---
id: "{parsed.slug}"
slug: "{parsed.slug}"
title: "{parsed.title}"
ministry: "{parsed.ministry}"
government_level: "{"central" if parsed.state == "ALL_INDIA" else "state"}"
state: "{parsed.state}"
category: "{parsed.category}"
official_portal: "{parsed.application_url}"
application_mode: "{parsed.application_mode}"
tags:
{chr(10).join([f'  - "{t}"' for t in parsed.tags])}
---

# {parsed.title}

## 1. Overview & Objectives
{parsed.overview}

## 2. Benefits & Support
{chr(10).join([f'- **{b["title"]}:** {b["description"]}' for b in parsed.benefits])}

## 3. Eligibility Criteria
{chr(10).join([f'- `{r["field_name"]} {r["operator"]} {r["rule_value"]}`' for r in parsed.eligibility_rules])}

## 4. Exclusions & Disqualifications
{chr(10).join([f'- {e}' for e in parsed.exclusions]) if parsed.exclusions else "- None listed."}

## 5. Application Process ({parsed.application_mode})
{chr(10).join(parsed.application_process) if parsed.application_process else f"Visit [{parsed.application_url}]({parsed.application_url}) to submit your application."}

## 6. Required Documents
{chr(10).join([f'- **{d["document_name"]}**: {d.get("description", "")}' for d in parsed.required_documents])}

## 7. Official Sources & Guidelines
{chr(10).join([f'- [{s["title"]}]({s["url"]})' for s in parsed.official_sources])}
"""
    okf_file.write_text(okf_content, encoding="utf-8")

    return scheme
