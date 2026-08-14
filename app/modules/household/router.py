from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_user_optional, get_db
from app.modules.auth.models import User
from app.modules.household.schemas import (
    FamilyEligibilityResponse,
    HouseholdMemberCreate,
    HouseholdMemberResponse,
)
from app.modules.household.service import (
    add_household_member,
    delete_household_member,
    evaluate_family_eligibility,
    list_household_members,
)

router = APIRouter(prefix="/household", tags=["Household & Family Welfare Graph"])


@router.post("/members", response_model=HouseholdMemberResponse, status_code=status.HTTP_201_CREATED)
def add_member_endpoint(
    payload: HouseholdMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a family member (daughter, son, spouse, mother, father) to household graph."""
    return add_household_member(db, current_user.id, payload)


@router.get("/members", response_model=list[HouseholdMemberResponse])
def list_members_endpoint(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """List all registered family members in the citizen's household or empty for guest."""
    if not current_user:
        return []
    return list_household_members(db, current_user.id)


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member_endpoint(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a family member from household graph."""
    delete_household_member(db, current_user.id, member_id)
    return None


@router.get("/eligibility", response_model=FamilyEligibilityResponse)
def get_family_eligibility_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Single-Click Family-Wide Welfare Scan.
    Evaluates all 4,148 schemes across all family members (daughter scholarships, mother pensions, etc.).
    """
    return evaluate_family_eligibility(db, current_user.id)
