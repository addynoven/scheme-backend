from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import EntityNotFoundError
from app.core.uid_generator import (
    compute_life_stage,
    generate_citizen_uid,
    generate_household_uid,
    generate_member_uid,
)
from app.modules.auth.models import User
from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.household.models import HouseholdMember
from app.modules.household.schemas import (
    FamilyEligibilityResponse,
    HouseholdMemberCreate,
    HouseholdMemberUpdate,
    MemberEligibilityReport,
)


def _ensure_user_uids(db: Session, user: User) -> None:
    updated = False
    if not user.citizen_uid:
        user.citizen_uid = generate_citizen_uid()
        updated = True
    if not user.household_uid:
        user.household_uid = generate_household_uid()
        updated = True
    if updated:
        db.commit()
        db.refresh(user)


def add_household_member(db: Session, primary_user_id: int, data: HouseholdMemberCreate) -> HouseholdMember:
    user = db.scalar(select(User).where(User.id == primary_user_id))
    if not user:
        raise EntityNotFoundError("User", primary_user_id)

    _ensure_user_uids(db, user)

    life_stage = compute_life_stage(data.date_of_birth, data.age)

    member = HouseholdMember(
        primary_user_id=primary_user_id,
        citizen_uid=generate_citizen_uid(),
        member_uid=generate_member_uid(data.relationship),
        household_uid=user.household_uid,
        full_name=data.full_name.strip(),
        relationship=data.relationship.lower().strip(),
        life_stage=life_stage,
        date_of_birth=data.date_of_birth,
        age=data.age,
        gender=data.gender.lower().strip(),
        occupation=data.occupation.lower().strip() if data.occupation else "unemployed",
        caste_category=data.caste_category or "General",
        annual_income=data.annual_income or 0.0,
        is_student=data.is_student or (data.age < 18),
        is_disabled=data.is_disabled,
        aadhaar_last_four=data.aadhaar_last_four,
        verification_status="UNVERIFIED",
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


def list_household_members(db: Session, primary_user_id: int) -> list[HouseholdMember]:
    members = list(
        db.scalars(
            select(HouseholdMember)
            .where(HouseholdMember.primary_user_id == primary_user_id)
            .order_by(HouseholdMember.id)
        ).all()
    )

    # Dynamic life stage re-evaluation (e.g. minor crossing 18 -> ADULT, senior crossing 60 -> SENIOR)
    for m in members:
        computed = compute_life_stage(m.date_of_birth, m.age)
        if m.life_stage != computed:
            m.life_stage = computed
            db.commit()

    return members


def get_household_member(db: Session, primary_user_id: int, member_id: int) -> HouseholdMember:
    member = db.scalar(
        select(HouseholdMember)
        .where(HouseholdMember.id == member_id, HouseholdMember.primary_user_id == primary_user_id)
    )
    if not member:
        raise EntityNotFoundError("HouseholdMember", member_id)
    return member


def update_household_member(
    db: Session,
    primary_user_id: int,
    member_id: int,
    data: HouseholdMemberUpdate,
) -> HouseholdMember:
    member = get_household_member(db, primary_user_id, member_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(member, field, val)

    # Re-evaluate life stage
    member.life_stage = compute_life_stage(member.date_of_birth, member.age)

    db.commit()
    db.refresh(member)
    return member


def delete_household_member(db: Session, primary_user_id: int, member_id: int) -> bool:
    member = get_household_member(db, primary_user_id, member_id)
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

    _ensure_user_uids(db, user)

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
            "annual_income": m.annual_income if (m.annual_income and m.annual_income > 0) else base_income,
            "caste_category": m.caste_category or base_caste,
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
                citizen_uid=m.citizen_uid,
                member_uid=m.member_uid,
                full_name=m.full_name,
                relationship=m.relationship,
                life_stage=m.life_stage,
                verification_status=m.verification_status,
                age=m.age,
                gender=m.gender,
                eligible_schemes_count=len(matches),
                eligible_schemes=matches[:10],
            )
        )

    return FamilyEligibilityResponse(
        household_uid=user.household_uid or "HHD-DEFAULT",
        total_family_members=len(members),
        total_collective_schemes=len(collective_schemes_set),
        family_members_reports=reports,
    )
