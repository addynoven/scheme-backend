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
                    "Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category. "
                    "Use this when the citizen asks what welfare schemes they qualify for or provides demographic details seeking personalized recommendations. "
                    "Pass the matching `state` (e.g. 'Uttar Pradesh', 'Goa'), `category` (e.g. 'Education', 'Agriculture'), `occupation` (e.g. 'student', 'farmer'), `age`, `annual_income`."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "category": {
                            "type": "STRING",
                            "description": "Sector/category to filter schemes by, e.g. Education, Business & Finance, Agriculture, Healthcare, Housing, Employment & Skills, Social Welfare, Women & Child.",
                        },
                        "topic": {
                            "type": "STRING",
                            "description": "Specific sub-topic or keyword to match, e.g. scholarship, tuition waiver, loan, tablet, coaching, subsidy.",
                        },
                        "state": {
                            "type": "STRING",
                            "description": "Indian state or union territory name, e.g. Uttar Pradesh, Madhya Pradesh, Goa, Maharashtra, or ALL_INDIA.",
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
                            "description": "Caste category, e.g. General, OBC, SC, ST, EWS.",
                        },
                        "gender": {
                            "type": "STRING",
                            "description": "Gender, e.g. female, male, other.",
                        },
                    },
                },
            },
            {
                "name": "search_schemes_directory",
                "description": (
                    "Search and count all available government welfare schemes in the official registry by state, category, or keyword. "
                    "Use this whenever the citizen asks how many schemes exist in total, asks for all schemes in a state or sector (e.g. 'how many schemes in UP for education', 'what schemes exist for Goa'), "
                    "or wants an honest directory count of available initiatives."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "state": {
                            "type": "STRING",
                            "description": "State or union territory, e.g. Uttar Pradesh, Madhya Pradesh, Goa, Maharashtra, or ALL_INDIA.",
                        },
                        "category": {
                            "type": "STRING",
                            "description": "Sector/category, e.g. Education, Agriculture, Healthcare, Housing, Social Welfare, Employment & Skills, Women & Child, Business & Finance.",
                        },
                        "search_query": {
                            "type": "STRING",
                            "description": "Optional keyword search term, e.g. student, scholarship, coaching, tablet, loan, farmer.",
                        },
                    },
                },
            },
            {
                "name": "get_scheme_details",
                "description": (
                    "Fetch official application procedures, required documents, and full guidelines for a SPECIFIC government scheme. "
                    "Use this when the citizen asks how to apply, what documents are needed, or wants in-depth details on a specific scheme."
                ),
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "scheme_slug": {
                            "type": "STRING",
                            "description": "Canonical slug of the scheme (e.g. uttar-pradesh-post-matric-merit-scholarship, uttar-pradesh-free-digital-tablet-laptop-distribution, post-matric-scholarship, pm-kisan, ayushman-bharat-pmjay).",
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


def execute_search_schemes_directory(db: Session, tool_args: dict[str, Any]) -> dict[str, Any]:
    """
    Directly queries the database schemes directory and returns the true total count and top sample highlights.
    """
    try:
        from app.modules.schemes.service import list_schemes
        state = tool_args.get("state")
        category = tool_args.get("category")
        search = tool_args.get("search_query") or tool_args.get("q")

        items, total = list_schemes(
            db=db,
            skip=0,
            limit=4,
            state=state,
            category=category,
            search=search,
            status="active",
        )

        state_param = state if state and state.upper() not in ("ALL_INDIA", "ALL-INDIA", "NATIONAL", "ALL") else ""
        cat_param = category if category and category != "All" else ""
        query_parts = []
        if state_param:
            query_parts.append(f"state={state_param}")
        if cat_param:
            query_parts.append(f"category={cat_param}")
        query_str = f"?{'&'.join(query_parts)}" if query_parts else ""

        return {
            "status": "success",
            "total_count_in_directory": total,
            "state_filtered": state or "All Jurisdictions",
            "category_filtered": category or "All Categories",
            "showing_sample_count": len(items),
            "has_more": total > len(items),
            "directory_url": f"/schemes{query_str}",
            "sample_schemes": [
                {
                    "slug": s.slug,
                    "name": s.name,
                    "state": s.state or "ALL_INDIA",
                    "jurisdiction": f"State Scheme ({s.state})" if s.state and s.state != "ALL_INDIA" else "Central / National Scheme",
                    "category": s.category or "General",
                    "summary": s.description[:100] if s.description else "Government Welfare Assistance",
                }
                for s in items
            ],
        }
    except Exception as e:
        logger.error(f"Error executing search_schemes_directory: {e}", exc_info=True)
        return {
            "status": "error",
            "message": "Failed to search schemes registry directory.",
        }


def execute_check_eligibility(
    db: Session, user_profile: dict[str, Any] | None, tool_args: dict[str, Any]
) -> dict[str, Any]:
    """
    Executes in-memory bitmask rule evaluation with sector/category filtering.
    Returns honest total match count while delivering the top 3-4 most relevant schemes.
    """
    try:
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
        if user_profile:
            eval_profile.update({k: v for k, v in user_profile.items() if v is not None})

        for k in ["state", "occupation", "age", "annual_income", "caste_category", "gender"]:
            if tool_args.get(k) is not None:
                eval_profile[k] = tool_args[k]

        matches = bitmask_engine.evaluate(eval_profile)

        if not matches:
            query_state = eval_profile.get("state")
            db_schemes = list(
                db.scalars(
                    select(Scheme).where(
                        (Scheme.state == query_state) | (Scheme.state == "ALL_INDIA") | (Scheme.state.is_(None))
                    ).limit(30)
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

        # Filter by requested category or topic
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

        target_state = str(eval_profile.get("state", "")).strip()
        is_specific_state = target_state and target_state.upper() not in ("ALL_INDIA", "ALL-INDIA", "NATIONAL", "ALL")

        state_specific = []
        national = []
        if is_specific_state:
            state_specific = [
                m for m in matches
                if m.get("state", "").lower() == target_state.lower() or target_state.lower() in m.get("state", "").lower()
            ]
            national = [
                m for m in matches
                if m.get("state") in ("ALL_INDIA", "All-India", "National") or not m.get("state")
            ]
            # Order: State schemes first, followed by national programs
            selected_matches = state_specific + national
        else:
            selected_matches = matches

        total_matched = len(selected_matches)

        # Truncate to top 3 items for clean chat delivery
        top_schemes = selected_matches[:3]

        compact_results = []
        for m in top_schemes:
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
            "total_matched_count": total_matched,
            "state_specific_count": len(state_specific),
            "national_count": len(national) if is_specific_state else total_matched,
            "showing_count": len(compact_results),
            "schemes": compact_results,
            "has_more": total_matched > len(compact_results),
            "directory_url": f"/schemes?state={target_state}" if is_specific_state else "/schemes",
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
