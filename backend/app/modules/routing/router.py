from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional, get_db
from app.modules.auth.models import User
from app.modules.routing.schemas import QueryRouteRequest, QueryRouteResponse
from app.modules.routing.service import query_router

router = APIRouter(prefix="/routing", tags=["Query Router"])


@router.post("/query", response_model=QueryRouteResponse)
def route_query_endpoint(
    payload: QueryRouteRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Two-Stage Intelligent Query Routing & Multi-Engine Synthesis.
    Decomposes natural language queries, queries Bitmask SQL + OKF Canonical Markdown,
    and returns a synthesized, cited response.
    """
    user_profile = None
    if current_user and current_user.profile:
        from datetime import date
        today = date.today()
        dob = current_user.profile.date_of_birth
        computed_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else 25

        user_profile = {
            "state": current_user.profile.state,
            "age": computed_age,
            "annual_income": current_user.profile.annual_income,
            "gender": current_user.profile.gender,
            "occupation": current_user.profile.occupation,
            "caste_category": current_user.profile.caste_category,
        }
    elif payload.user_profile:
        user_profile = payload.user_profile

    return query_router.route_and_execute(
        raw_query=payload.query,
        db=db,
        user_profile=user_profile,
        chat_history=payload.chat_history,
    )
