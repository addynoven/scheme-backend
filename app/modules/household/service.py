from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import EntityNotFoundError
from app.modules.auth.models import User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.household.models import HouseholdMember
from app.modules.household.schemas import (
    FamilyEligibilityResponse,
    HouseholdMemberCreate,
    MemberEligibilityReport,
)


def add_household_member(db: Session, primary_user_id: int, data: HouseholdMemberCreate) -> HouseholdMember:
    member = HouseholdMember(
        primary_user_id=primary_user_id,
        full_name=data.full_name,
        relationship=data.relationship.lower().strip(),
        age=data.age,
        gender=data.gender.lower().strip(),
        occupation=data.occupation.lower().strip() if data.occupation else "unemployed",
        is_student=data.is_student,
        is_disabled=data.is_disabled,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def list_household_members(db: Session, primary_user_id: int) -> list[HouseholdMember]:
    return list(
        db.scalars(
            select(HouseholdMember)
            .where(HouseholdMember.primary_user_id == primary_user_id)
            .order_by(HouseholdMember.id)
        ).all()
    )


def delete_household_member(db: Session, primary_user_id: int, member_id: int) -> bool:
    member = db.scalar(
        select(HouseholdMember)
        .where(HouseholdMember.id == member_id, HouseholdMember.primary_user_id == primary_user_id)
    )
    if not member:
        raise EntityNotFoundError("HouseholdMember", member_id)

    db.delete(member)
    db.commit()
    return True


def evaluate_family_eligibility(db: Session, primary_user_id: int) -> FamilyEligibilityResponse:
    user = db.scalar(
        select(User)
        .where(User.id == primary_user_id)
        .options(selectinload(User.profile), selectinload(User.facts))
    )
    if not user:
        raise EntityNotFoundError("User", primary_user_id)

    # Ensure bitmask engine is loaded
    if not bitmask_engine.is_warmed:
        bitmask_engine.warm_up(db)

    members = list_household_members(db, primary_user_id)
    base_state = user.profile.state if user.profile and user.profile.state else "all_india"
    base_income = user.profile.annual_income if user.profile and user.profile.annual_income else 100000
    base_caste = user.profile.caste_category if user.profile and user.profile.caste_category else "General"

    reports: list[MemberEligibilityReport] = []
    collective_schemes_set = set()

    for m in members:
        # Construct profile for each member
        member_profile = {
            "state": base_state,
            "annual_income": base_income,
            "caste_category": base_caste,
            "age": m.age,
            "gender": m.gender,
            "occupation": "student" if m.is_student else m.occupation,
        }

        matches = bitmask_engine.evaluate(member_profile)
        for s in matches:
            collective_schemes_set.add(s["slug"])

        reports.append(
            MemberEligibilityReport(
                member_id=m.id,
                full_name=m.full_name,
                relationship=m.relationship,
                age=m.age,
                gender=m.gender,
                eligible_schemes_count=len(matches),
                eligible_schemes=matches[:10],
            )
        )

    return FamilyEligibilityResponse(
        total_family_members=len(members),
        total_collective_schemes=len(collective_schemes_set),
        family_members_reports=reports,
    )
