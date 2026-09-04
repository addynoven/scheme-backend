import datetime
import uuid


def generate_citizen_uid() -> str:
    """Generate sovereign trackable Citizen ID, e.g. CIT-2026-8941AB"""
    year = datetime.datetime.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"CIT-{year}-{suffix}"


def generate_household_uid() -> str:
    """Generate shared Family Household ID, e.g. HHD-2026-4402CD"""
    year = datetime.datetime.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"HHD-{year}-{suffix}"


def generate_member_uid(relationship: str = "member") -> str:
    """Generate Household Relationship Member ID, e.g. MBR-2026-1189EF"""
    year = datetime.datetime.now().year
    suffix = uuid.uuid4().hex[:6].upper()
    return f"MBR-{year}-{suffix}"


def generate_session_uid() -> str:
    """Generate secure non-sequential Chat Session UID, e.g. SES-2026-9A8B7C6D5E4F"""
    year = datetime.datetime.now().year
    suffix = uuid.uuid4().hex[:12].upper()
    return f"SES-{year}-{suffix}"


def compute_life_stage(dob: datetime.date | None, age: int | None) -> str:
    """
    Compute demographic life stage:
    - MINOR: age < 18 (Schooling, Sukanya, Child Welfare)
    - ADULT: 18 <= age < 60 (Livelihood, Skill, Housing, Mudra)
    - SENIOR: age >= 60 (Old Age Pension, Elder Healthcare, Concessions)
    """
    effective_age = age
    if dob:
        today = datetime.date.today()
        effective_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    if effective_age is None:
        return "ADULT"

    if effective_age < 18:
        return "MINOR"
    elif effective_age >= 60:
        return "SENIOR"
    else:
        return "ADULT"
