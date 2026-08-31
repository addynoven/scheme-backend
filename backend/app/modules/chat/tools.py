import logging
from pathlib import Path
import re
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Scheme

logger = logging.getLogger(__name__)

KNOWLEDGE_SCHEMES_DIR = Path(__file__).resolve().parent.parent.parent.parent / "knowledge" / "schemes"

CHAT_TOOLS_DECLARATIONS = [
    {
        "function_declarations": [
            {
                "name": "check_eligibility",
                "description": (
                    "Check which government welfare schemes a citizen is eligible for based on demographic criteria and optional sector/category. "
                    "Use this ONLY when the citizen asks what welfare schemes they qualify for, or provides demographic details seeking recommendations. "
                    "If the citizen asks about a specific sector (e.g. 'OBC scholarships', 'farmer loans', 'health insurance', 'pensions'), "
                    "you MUST pass the matching `category` (e.g. 'Education', 'Business', 'Agriculture', 'Pension', 'Health', 'Housing') "
                    "and optional `topic` (e.g. 'scholarship', 'loan', 'pension', 'subsidy'). "
                    "Do NOT use for casual greetings or questions about a known specific scheme."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "category": {
                            "type": "STRING",
                            "description": "Sector/category to filter schemes by, e.g. Education, Business, Agriculture, Pension, Health, Housing, Employment, Social Welfare.",
                        },
                        "topic": {
                            "type": "STRING",
                            "description": "Specific sub-topic or keyword to match, e.g. scholarship, tuition waiver, collateral free loan, disability, tractor subsidy.",
                        },
                        "state": {
                            "type": "STRING",
                            "description": "Indian state or union territory name, e.g. Madhya Pradesh, Maharashtra, Karnataka, Uttar Pradesh, Goa.",
                        },
                        "occupation": {
                            "type": "STRING",
                            "description": "Citizen occupation, e.g. student, farmer, artisan, unemployed, self-employed.",
                        },
                        "age": {
                            "type": "INTEGER",
                            "description": "Age in years.",
                        },
                        "annual_income": {
                            "type": "NUMBER",
                            "description": "Annual household income in INR.",
                        },
                        "caste_category": {
                            "type": "STRING",
                            "description": "Caste category, e.g. General, OBC, SC, ST.",
                        },
                        "gender": {
                            "type": "STRING",
                            "description": "Gender, e.g. female, male, other.",
                        },
                    },
                },
            },
            {
                "name": "get_scheme_details",
                "description": (
                    "Fetch official application procedures, required documents, and full guidelines for a SPECIFIC government scheme. "
                    "Use this ONLY when the citizen asks how to apply, what documents are needed, or wants deep details on a specific scheme slug."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "scheme_slug": {
                            "type": "STRING",
                            "description": "Canonical slug of the scheme (e.g. pm-mudra-yojana, mp-medhavi-vidyarthi-yojana, pm-kisan, ayushman-bharat-pmjay, pmay-gramin, atal-pension-yojana, post-matric-scholarship, uttar-pradesh-post-matric-merit-scholarship).",
                        },
                    },
                    "required": ["scheme_slug"],
                },
            },
        ]
    }
]

KNOWN_SCHEME_SLUGS = {
    "pm-mudra-yojana",
    "mp-medhavi-vidyarthi-yojana",
    "pm-kisan",
    "ayushman-bharat-pmjay",
    "ab-pmjay",
    "pmay-gramin",
    "atal-pension-yojana",
    "post-matric-scholarship",
    "mp-udyam-kranti-yojana",
    "sukanya-samriddhi-yojana",
    "pm-vishwakarma",
    "ladli-behna",
}


def execute_check_eligibility(
    db: Session, user_profile: dict[str, Any] | None, tool_args: dict[str, Any]
) -> dict[str, Any]:
    """
    Executes in-memory bitmask rule evaluation with sector/category filtering.
    Prioritizes state-specific schemes when a state is passed, and blends with relevant national programs.
    """
    try:
        # Ensure bitmask engine is warmed up
        if not bitmask_engine.is_warmed or len(bitmask_engine.scheme_ids) == 0:
            bitmask_engine.warm_up(db)

        eval_profile: dict[str, Any] = {
            "age": 25,
            "state": "ALL_INDIA",
            "gender": "all",
            "caste_category": "General",
            "annual_income": 200000.0,
            "occupation": "general",
        }
        # Inject verified facts from database (read-only)
        if user_profile:
            eval_profile.update({k: v for k, v in user_profile.items() if v is not None})

        # Exploration arguments passed in query
        for k in ["state", "occupation", "age", "annual_income", "caste_category", "gender"]:
            if tool_args.get(k) is not None:
                eval_profile[k] = tool_args[k]

        matches = bitmask_engine.evaluate(eval_profile)

        # Fallback query if in-memory cache yields no matches
        if not matches:
            query_state = eval_profile.get("state")
            db_schemes = list(
                db.scalars(
                    select(Scheme).where(
                        (Scheme.state == query_state) | (Scheme.state == "ALL_INDIA") | (Scheme.state.is_(None))
                    ).limit(10)
                ).all()
            )
            matches = [
                {
                    "slug": s.slug,
                    "name": s.name,
                    "state": s.state or "ALL_INDIA",
                    "category": s.category or "General Welfare",
                    "benefit_title": s.description[:80] if s.description else "Government Welfare Assistance",
                }
                for s in db_schemes
            ]

        # Filter and rank by requested category or topic if provided
        target_category = str(tool_args.get("category", "")).strip().lower()
        target_topic = str(tool_args.get("topic", "")).strip().lower()

        if target_category or target_topic:
            filtered_matches = []
            for m in matches:
                m_cat = str(m.get("category", "")).lower()
                m_name = str(m.get("name", "")).lower()
                m_desc = str(m.get("benefit_title", "")).lower()
                m_slug = str(m.get("slug", "")).lower()

                cat_matched = target_category and (target_category in m_cat or m_cat in target_category)
                topic_matched = target_topic and (
                    target_topic in m_name or target_topic in m_desc or target_topic in m_slug or target_topic in m_cat
                )

                if cat_matched or topic_matched:
                    filtered_matches.append(m)

            if filtered_matches:
                matches = filtered_matches

        # Prioritize state-specific schemes if user requested a specific state
        target_state = str(eval_profile.get("state", "")).strip()
        is_specific_state = target_state and target_state.upper() not in ("ALL_INDIA", "ALL-INDIA", "NATIONAL", "ALL")

        if is_specific_state:
            state_specific = [
                m for m in matches
                if m.get("state", "").lower() == target_state.lower() or target_state.lower() in m.get("state", "").lower()
            ]
            national = [
                m for m in matches
                if m.get("state") in ("ALL_INDIA", "All-India", "National") or not m.get("state")
            ]
            # Prioritize state schemes (up to 3 state + up to 2 national)
            selected_matches = state_specific[:3] + national[:2]
            if not selected_matches:
                selected_matches = matches[:4]
        else:
            selected_matches = matches[:4]

        compact_results = []
        for m in selected_matches:
            m_state = m.get("state") or "ALL_INDIA"
            is_national = m_state in ("ALL_INDIA", "All-India", "National")
            jurisdiction = "Central / National Scheme" if is_national else f"State Scheme ({m_state})"
            compact_results.append({
                "slug": m.get("slug"),
                "name": m.get("name"),
                "category": m.get("category", "General"),
                "state": m_state,
                "jurisdiction": jurisdiction,
                "summary_benefit": m.get("benefit_title") or m.get("description", "")[:100],
            })

        return {
            "status": "success",
            "matched_count": len(compact_results),
            "schemes": compact_results,
        }
    except Exception as e:
        logger.error(f"Error executing check_eligibility: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to evaluate scheme eligibility criteria. Please try again.",
        }


def execute_get_scheme_details(db: Session, tool_args: dict[str, Any]) -> dict[str, Any]:
    """
    Fetches canonical markdown scheme documentation or database records.
    """
    try:
        raw_slug = str(tool_args.get("scheme_slug", "")).strip().lower()
        if raw_slug == "ab-pmjay":
            raw_slug = "ayushman-bharat-pmjay"

        slug = re.sub(r"[^a-z0-9\-]", "", raw_slug)
        if not slug:
            return {"status": "not_found", "message": "No scheme slug specified."}

        # Try to find matching markdown file anywhere in knowledge base
        if KNOWLEDGE_SCHEMES_DIR.exists():
            direct_path = KNOWLEDGE_SCHEMES_DIR / f"{slug}.md"
            found_path = direct_path if direct_path.exists() else None
            if not found_path:
                matches = list(KNOWLEDGE_SCHEMES_DIR.rglob(f"*{slug}*.md"))
                if matches:
                    found_path = matches[0]

            if found_path and found_path.exists():
                try:
                    content = found_path.read_text(encoding="utf-8")
                    return {
                        "status": "success",
                        "slug": slug,
                        "content": content[:1400],
                    }
                except Exception as read_err:
                    logger.error(f"Failed reading doc for {slug}: {read_err}")

        # Fallback to database record with relations
        db_scheme = db.scalar(
            select(Scheme).where(Scheme.slug == slug)
        )
        if db_scheme:
            return {
                "status": "success",
                "slug": slug,
                "name": db_scheme.name,
                "state": db_scheme.state,
                "category": db_scheme.category,
                "description": db_scheme.description,
                "application_url": db_scheme.application_url,
            }

        return {"status": "not_found", "message": f"Documentation for scheme '{slug}' is currently unavailable."}
    except Exception as e:
        logger.error(f"Error executing get_scheme_details: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to retrieve scheme details due to an internal error.",
        }
