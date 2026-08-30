import datetime
import random
import string


def generate_citizen_uid() -> str:
    """Generate sovereign trackable Citizen ID, e.g. CIT-2026-8941"""
    year = datetime.datetime.now().year
    suffix = "".join(random.choices(string.digits, k=4))
    return f"CIT-{year}-{suffix}"


def generate_household_uid() -> str:
    """Generate shared Family Household ID, e.g. HHD-2026-4402"""
    year = datetime.datetime.now().year
    suffix = "".join(random.choices(string.digits, k=4))
    return f"HHD-{year}-{suffix}"


def generate_member_uid(relationship: str = "member") -> str:
    """Generate Household Relationship Member ID, e.g. MBR-2026-1189"""
    year = datetime.datetime.now().year
    suffix = "".join(random.choices(string.digits, k=4))
    return f"MBR-{year}-{suffix}"


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
