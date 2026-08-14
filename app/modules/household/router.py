from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.modules.auth.models import User
from app.modules.household.schemas import (
    FamilyEligibilityResponse,
    HouseholdMemberCreate,
    HouseholdMemberResponse,
    HouseholdMemberUpdate,
)
from app.modules.household.service import (
    add_household_member,
    delete_household_member,
    evaluate_family_eligibility,
    get_household_member,
    list_household_members,
    update_household_member,
)

router = APIRouter(prefix="/household", tags=["Household & Family Welfare Graph"])


@router.post("/members", response_model=HouseholdMemberResponse, status_code=status.HTTP_201_CREATED)
def add_member_endpoint(
    payload: HouseholdMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a family member (daughter, son, spouse, mother, father) to household graph with sovereign CIT-UID and MBR-UID."""
    return add_household_member(db, current_user.id, payload)


@router.get("/members", response_model=list[HouseholdMemberResponse])
def list_members_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all registered family members in the citizen's household."""
    return list_household_members(db, current_user.id)


@router.get("/members/{member_id}", response_model=HouseholdMemberResponse)
def get_member_endpoint(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get single household member profile details."""
    return get_household_member(db, current_user.id, member_id)


@router.put("/members/{member_id}", response_model=HouseholdMemberResponse)
def update_member_endpoint(
    member_id: int,
    payload: HouseholdMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update household member demographic details with automatic life stage transition check."""
    return update_household_member(db, current_user.id, member_id, payload)


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
