from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.exceptions import ProfileNotFoundError, SchemeNotFoundError, UserNotFoundError
from app.modules.auth.models import User
from app.modules.auth.service import get_profile_by_user_id, get_user_by_id
from app.modules.eligibility.schemas import (
    EligibilityCheckRequest,
    EligibilityReportResponse,
    SchemeExplanation,
)
from app.modules.eligibility.service import (
    build_profile_context,
    calculate_age,
    explain_scheme_eligibility,
    generate_eligibility_report,
    match_schemes_for_context,
    match_schemes_for_profile,
)
from app.modules.schemes.schemas import SchemeDetailResponse
from app.modules.schemes.service import get_scheme_by_id

router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


# --- Fast Binary Matching Endpoints ---


@router.post(
    "/check",
    response_model=list[SchemeDetailResponse],
    summary="Ad-hoc eligibility check (Fast binary list)",
    description="Evaluates all active government schemes against an anonymous user context and returns matching schemes.",
    response_description="List of fully matching schemes",
)
def check_eligibility_adhoc_endpoint(
    payload: EligibilityCheckRequest,
    db: Session = Depends(get_db),
):
    context: dict[str, Any] = payload.model_dump()
    if payload.date_of_birth and not payload.age:
        context["age"] = calculate_age(payload.date_of_birth)

    return match_schemes_for_context(db=db, profile_context=context)


@router.get(
    "/me/schemes",
    response_model=list[SchemeDetailResponse],
    summary="Get eligible schemes for authenticated citizen (Fast binary list)",
    description="Evaluates all active schemes against the logged-in citizen's saved profile.",
    response_description="List of matching schemes",
)
def get_my_eligible_schemes_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db=db, user_id=current_user.id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{current_user.id}")
    return match_schemes_for_profile(db=db, profile=profile)


@router.get(
    "/users/{user_id}/schemes",
    response_model=list[SchemeDetailResponse],
    summary="Get eligible schemes for specific user ID",
    description="Evaluates schemes against a specific citizen's profile.",
    response_description="List of matching schemes",
)
def get_user_eligible_schemes_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError(user_id)

    profile = get_profile_by_user_id(db=db, user_id=user_id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{user_id}")

    return match_schemes_for_profile(db=db, profile=profile)


# --- Human-Friendly "Understand Why" Explanation Endpoints ---


@router.post(
    "/explain",
    response_model=EligibilityReportResponse,
    summary="Ad-hoc eligibility evaluation with human-friendly reasoning",
    description="Evaluates anonymous citizen input against all active schemes and returns a comprehensive report categorized into Eligible, Nearly Eligible (with unmet conditions), and Ineligible schemes.",
    response_description="Categorized eligibility report with plain-English reasons",
)
def explain_eligibility_adhoc_endpoint(
    payload: EligibilityCheckRequest,
    db: Session = Depends(get_db),
):
    context: dict[str, Any] = payload.model_dump()
    if payload.date_of_birth and not payload.age:
        context["age"] = calculate_age(payload.date_of_birth)

    return generate_eligibility_report(db=db, profile_context=context)


@router.get(
    "/me/explained",
    response_model=EligibilityReportResponse,
    summary="Personalized eligibility report for current citizen",
    description="Evaluates the authenticated citizen's saved profile against all schemes. Returns a detailed report explaining passed and failed criteria with match scores.",
    response_description="Citizen personalized eligibility report",
)
def get_my_explained_eligibility_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = get_profile_by_user_id(db=db, user_id=current_user.id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{current_user.id}")

    context = build_profile_context(profile)
    return generate_eligibility_report(db=db, profile_context=context)


@router.get(
    "/schemes/{scheme_id}/explain",
    response_model=SchemeExplanation,
    summary="Explain eligibility for a single target scheme",
    description="Returns an item-by-item breakdown of why the authenticated citizen qualifies or fails for a specific scheme.",
    response_description="Scheme-specific explanation breakdown",
)
def explain_single_scheme_endpoint(
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    profile = get_profile_by_user_id(db=db, user_id=current_user.id)
    if not profile:
        raise ProfileNotFoundError(f"user_id:{current_user.id}")

    context = build_profile_context(profile)
    return explain_scheme_eligibility(scheme=scheme, profile_context=context)
