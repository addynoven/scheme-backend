import pytest
from sqlalchemy.orm import Session
from app.modules.chat.tools import (
    execute_check_eligibility,
    execute_search_schemes_directory,
    execute_get_scheme_details,
)
from app.modules.schemes.models import Scheme, Benefit, EligibilityRule
from app.seeds.seed_national_schemes import seed_national_schemes


@pytest.fixture(autouse=True)
def setup_schemes(db_session: Session):
    seed_national_schemes(db_session)
    
    # Ensure UP and Goa sample schemes exist in the test DB
    up_schemes_data = [
        ("Uttar Pradesh Post-Matric Merit Scholarship", "uttar-pradesh-post-matric-merit-scholarship", "Uttar Pradesh", "Education", "Full tuition waiver and stipend for UP students"),
        ("Uttar Pradesh Free Digital Tablet & Laptop Distribution", "uttar-pradesh-free-digital-tablet-laptop-distribution", "Uttar Pradesh", "Education", "Free tablet and laptop distribution for youth"),
        ("Uttar Pradesh Competitive Exam Coaching Assistance", "uttar-pradesh-competitive-exam-coaching-assistance", "Uttar Pradesh", "Education", "100% sponsored coaching for UP civil exams"),
        ("Uttar Pradesh Technical & Polytechnic Skill Stipend", "uttar-pradesh-technical-polytechnic-skill-stipend", "Uttar Pradesh", "Education", "Monthly allowance for polytechnic students"),
        ("Goa Skill Training & Apprenticeship Grant", "goa-skill-training-grant", "Goa", "Employment & Skills", "Stipend for Goa youth undergoing skill training"),
        ("Goa Higher Education Scholarship", "goa-higher-education-scholarship", "Goa", "Education", "Higher education scholarship for Goa residents"),
    ]
    
    for name, slug, state, category, desc in up_schemes_data:
        existing = db_session.query(Scheme).filter_by(slug=slug).first()
        if not existing:
            s = Scheme(
                name=name,
                slug=slug,
                state=state,
                category=category,
                description=desc,
                status="active",
                ministry=f"Government of {state}",
            )
            db_session.add(s)
            db_session.flush()
            db_session.add(Benefit(scheme_id=s.id, title=name, description=desc))
            db_session.add(EligibilityRule(scheme_id=s.id, field_name="state", operator="eq", rule_value=state))
    
    db_session.commit()


# ==============================================================================
# 20 DISTINCT JSON TOOL-CALL SCENARIOS (Direct Execution without LLM calls)
# ==============================================================================

TOOL_SCENARIOS = [
    # --------------------------------------------------------------------------
    # GROUP 1: Personalized Eligibility Checks (`check_eligibility`)
    # --------------------------------------------------------------------------
    {
        "id": "scenario_01_up_student_education",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "Uttar Pradesh",
            "category": "Education",
            "occupation": "student",
            "age": 22,
            "annual_income": 120000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] >= 1
            and res["state_specific_count"] >= 1
            and res["showing_count"] <= 3
            and any("Uttar Pradesh" in s["name"] or "UP" in s["name"] for s in res["schemes"])
            and "/schemes?state=Uttar Pradesh" in res["directory_url"]
        ),
    },
    {
        "id": "scenario_02_mp_farmer_agriculture",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "Madhya Pradesh",
            "category": "Agriculture",
            "occupation": "farmer",
            "age": 35,
            "annual_income": 100000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and res["showing_count"] <= 3
            and any("kisan" in s["slug"] or "krishi" in s["slug"] or "agriculture" in s["category"].lower() for s in res["schemes"])
        ),
    },
    {
        "id": "scenario_03_maharashtra_female_welfare",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "Maharashtra",
            "category": "Women & Child",
            "gender": "female",
            "age": 29,
            "annual_income": 150000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and res["showing_count"] <= 3
        ),
    },
    {
        "id": "scenario_04_karnataka_unemployed_youth",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "Karnataka",
            "category": "Employment & Skills",
            "occupation": "unemployed",
            "age": 23,
            "annual_income": 80000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and res["showing_count"] <= 3
        ),
    },
    {
        "id": "scenario_05_goa_skills_and_training",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "Goa",
            "category": "Employment & Skills",
            "age": 24,
            "annual_income": 120000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and res["showing_count"] <= 3
            and "/schemes?state=Goa" in res["directory_url"]
        ),
    },
    {
        "id": "scenario_06_low_income_housing_grant",
        "tool_name": "check_eligibility",
        "input_json": {
            "category": "Housing",
            "annual_income": 90000,
            "age": 40,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and any("housing" in s["category"].lower() or "pmay" in s["slug"] or "pucca" in s["slug"] for s in res["schemes"])
        ),
    },
    {
        "id": "scenario_07_healthcare_cashless_cover",
        "tool_name": "check_eligibility",
        "input_json": {
            "category": "Healthcare",
            "annual_income": 120000,
            "age": 45,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and any("health" in s["category"].lower() or "ayushman" in s["slug"] or "insurance" in s["slug"] for s in res["schemes"])
        ),
    },
    {
        "id": "scenario_08_business_mudra_loan",
        "tool_name": "check_eligibility",
        "input_json": {
            "category": "Business & Finance",
            "topic": "loan",
            "occupation": "self-employed",
            "age": 30,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and any("mudra" in s["slug"] or "credit" in s["slug"] or "business" in s["category"].lower() for s in res["schemes"])
        ),
    },
    {
        "id": "scenario_09_senior_citizen_pension",
        "tool_name": "check_eligibility",
        "input_json": {
            "category": "Social Welfare",
            "topic": "pension",
            "age": 65,
            "annual_income": 60000,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and any("pension" in s["name"].lower() or "social" in s["category"].lower() for s in res["schemes"])
        ),
    },
    {
        "id": "scenario_10_all_india_scholarship",
        "tool_name": "check_eligibility",
        "input_json": {
            "state": "ALL_INDIA",
            "category": "Education",
            "topic": "scholarship",
            "occupation": "student",
            "age": 20,
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_matched_count"] > 0
            and any("scholarship" in s["name"].lower() or "education" in s["category"].lower() for s in res["schemes"])
        ),
    },

    # --------------------------------------------------------------------------
    # GROUP 2: Catalog / Directory Search (`search_schemes_directory`)
    # --------------------------------------------------------------------------
    {
        "id": "scenario_11_directory_count_up_education",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "state": "Uttar Pradesh",
            "category": "Education",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] >= 4
            and res["showing_sample_count"] <= 4
            and "/schemes?state=Uttar Pradesh&category=Education" in res["directory_url"]
        ),
    },
    {
        "id": "scenario_12_directory_count_up_all_sectors",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "state": "Uttar Pradesh",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] >= 4
            and res["state_filtered"] == "Uttar Pradesh"
        ),
    },
    {
        "id": "scenario_13_directory_count_goa",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "state": "Goa",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] >= 2
            and res["state_filtered"] == "Goa"
        ),
    },
    {
        "id": "scenario_14_directory_category_agriculture",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "category": "Agriculture",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] >= 1
            and res["category_filtered"] == "Agriculture"
        ),
    },
    {
        "id": "scenario_15_directory_category_healthcare",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "category": "Healthcare",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] >= 1
            and res["category_filtered"] == "Healthcare"
        ),
    },
    {
        "id": "scenario_16_directory_search_tablet_laptop_up",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "state": "Uttar Pradesh",
            "search_query": "tablet",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] > 0
            and any("tablet" in s["name"].lower() or "laptop" in s["name"].lower() for s in res["sample_schemes"])
        ),
    },
    {
        "id": "scenario_17_directory_search_scholarship_education",
        "tool_name": "search_schemes_directory",
        "input_json": {
            "category": "Education",
            "search_query": "scholarship",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["total_count_in_directory"] > 0
            and any("scholarship" in s["name"].lower() for s in res["sample_schemes"])
        ),
    },

    # --------------------------------------------------------------------------
    # GROUP 3: Detailed Guidelines & Requirements (`get_scheme_details`)
    # --------------------------------------------------------------------------
    {
        "id": "scenario_18_details_national_pm_kisan",
        "tool_name": "get_scheme_details",
        "input_json": {
            "scheme_slug": "pm-kisan",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["slug"] == "pm-kisan"
            and ("content" in res or "description" in res)
        ),
    },
    {
        "id": "scenario_19_details_up_post_matric_scholarship",
        "tool_name": "get_scheme_details",
        "input_json": {
            "scheme_slug": "uttar-pradesh-post-matric-merit-scholarship",
        },
        "assertions": lambda res: (
            res["status"] == "success"
            and res["slug"] == "uttar-pradesh-post-matric-merit-scholarship"
            and (res.get("name") is not None or res.get("content") is not None)
        ),
    },
    {
        "id": "scenario_20_details_non_existent_slug_graceful_not_found",
        "tool_name": "get_scheme_details",
        "input_json": {
            "scheme_slug": "completely-fake-unknown-slug-9999",
        },
        "assertions": lambda res: (
            res["status"] == "not_found"
            and "message" in res
        ),
    },
]


@pytest.mark.parametrize("scenario", TOOL_SCENARIOS, ids=[s["id"] for s in TOOL_SCENARIOS])
def test_mock_ai_tool_call_scenarios(db_session: Session, scenario: dict):
    """
    Executes each of the 20 distinct mock tool payloads sent by AI tool calling
    and validates deterministic response structures, honest counts, and error boundaries.
    """
    tool_name = scenario["tool_name"]
    payload = scenario["input_json"]

    if tool_name == "check_eligibility":
        result = execute_check_eligibility(db_session, user_profile=None, tool_args=payload)
    elif tool_name == "search_schemes_directory":
        result = execute_search_schemes_directory(db_session, tool_args=payload)
    elif tool_name == "get_scheme_details":
        result = execute_get_scheme_details(db_session, tool_args=payload)
    else:
        pytest.fail(f"Unknown tool_name: {tool_name}")

    assert scenario["assertions"](result), f"Assertion failed for {scenario['id']}. Result was: {result}"
