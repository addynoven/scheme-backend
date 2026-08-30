import re
from typing import Tuple

SPECIFIC_SUBSIDY_VALUES = {
    "sukanya-samriddhi-yojana": (150000.0, "High-Interest Savings & Tax Exemption", "Annual"),
    "pm-ujjwala-yojana": (1600.0, "Asset & Equipment Subsidy", "One-Time"),
    "post-matric-scholarship": (50000.0, "Scholarship & Academic Stipend", "Annual"),
    "pm-fasal-bima-yojana": (200000.0, "Crop Loss Insurance Cover", "Claim-Based"),
    "mp-medhavi-vidyarthi-yojana": (150000.0, "Scholarship & Academic Stipend", "Annual"),
    "pmmy": (1000000.0, "Subsidized / Collateral-Free Loan", "One-Time"),
    "ssy": (150000.0, "High-Interest Savings & Tax Exemption", "Annual"),
    "pmuy": (1600.0, "Asset & Equipment Subsidy", "One-Time"),
}

STATE_PORTALS = {
    "madhya pradesh": "https://samagra.gov.in",
    "maharashtra": "https://mahadbt.maharashtra.gov.in",
    "karnataka": "https://sevasindhu.karnataka.gov.in",
    "uttar pradesh": "https://edistrict.up.gov.in",
    "rajasthan": "https://janroocha.rajasthan.gov.in",
    "tamil nadu": "https://tnesevai.tn.gov.in",
    "gujarat": "https://digitalgujarat.gov.in",
    "bihar": "https://serviceonline.bihar.gov.in",
    "west bengal": "https://wb.gov.in/schemes",
    "andhra pradesh": "https://navasakam.ap.gov.in",
    "telangana": "https://telangana.gov.in/schemes",
    "kerala": "https://services.kerala.gov.in",
    "odisha": "https://odisha.gov.in/schemes",
    "punjab": "https://punjab.gov.in/schemes",
    "haryana": "https://saralharyana.gov.in",
    "delhi": "https://edistrict.delhigovt.nic.in",
    "assam": "https://assam.gov.in/schemes",
}


def parse_indian_amount(text: str, slug: str = "") -> float:
    """
    Extracts numerical amount in INR from Indian welfare descriptions.
    Handles Lakhs, Crores, Thousands, and exact rupee ranges.
    """
    if slug in SPECIFIC_SUBSIDY_VALUES:
        return SPECIFIC_SUBSIDY_VALUES[slug][0]

    if not text:
        return 0.0

    t = text.replace(",", "").lower()

    # 1. Check for Lakhs (e.g. 5 Lakh, 1.5 Lakh, 2.5 Lakhs, 10 Lakh)
    lakh_match = re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(\d+(?:\.\d+)?)?\s*lakh", t)
    if lakh_match:
        val = float(lakh_match.group(2) or lakh_match.group(1))
        return val * 100_000.0

    # 2. Check for Crores (e.g. 1 Crore, 2.5 Crore)
    crore_match = re.search(r"(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:-|to)?\s*(\d+(?:\.\d+)?)?\s*crore", t)
    if crore_match:
        val = float(crore_match.group(2) or crore_match.group(1))
        return val * 10_000_000.0

    # 3. Check for exact rupee notations (e.g. ₹6000, ₹15000, ₹1000 to ₹2000)
    rupee_match = re.search(r"(?:₹|rs\.?|inr)\s*(\d+)(?:\s*(?:-|to)\s*(?:₹|rs\.?)?\s*(\d+))?", t)
    if rupee_match:
        val = float(rupee_match.group(2) or rupee_match.group(1))
        return val

    # 4. Check for 'grant of 50000', 'subsidy of 25000'
    grant_match = re.search(r"(?:grant|subsidy|aid|assistance|loan|pension|stipend)\s*(?:of|up to)?\s*(?:₹|rs\.?)?\s*(\d+)", t)
    if grant_match:
        return float(grant_match.group(1))

    return 0.0


def classify_benefit_metadata(title: str, details: str, slug: str = "") -> Tuple[str, str]:
    """
    Classifies benefit_type and frequency from title, details, and slug.
    """
    if slug in SPECIFIC_SUBSIDY_VALUES:
        return SPECIFIC_SUBSIDY_VALUES[slug][1], SPECIFIC_SUBSIDY_VALUES[slug][2]

    combined = f"{title} {details}".lower()

    # Frequency
    if any(k in combined for k in ["monthly", "per month", "/month", "every month", "pension"]):
        frequency = "Monthly"
    elif any(k in combined for k in ["four months", "4 months", "quarterly", "installment"]):
        frequency = "Quarterly"
    elif any(k in combined for k in ["annual", "per year", "per annum", "/year", "yearly", "annual cash"]):
        frequency = "Annual"
    elif any(k in combined for k in ["insurance", "hospitalization", "cashless", "claim", "trauma", "critical illness", "damage"]):
        frequency = "Claim-Based"
    else:
        frequency = "One-Time"

    # Benefit Type
    if any(k in combined for k in ["loan", "credit", "micro-credit", "mudra", "interest subvention", "working capital"]):
        b_type = "Subsidized / Collateral-Free Loan"
    elif any(k in combined for k in ["insurance", "cashless cover", "health cover", "hospitalization", "accidental cover", "medical"]):
        b_type = "Health & Accidental Insurance Cover"
    elif any(k in combined for k in ["scholarship", "stipend", "merit", "coaching assistance", "tuition", "fee waiver"]):
        b_type = "Scholarship & Academic Stipend"
    elif any(k in combined for k in ["pension", "old age", "widow", "divyangjan", "disability pension"]):
        b_type = "Monthly Social Security Pension"
    elif any(k in combined for k in ["toolkit", "tablet", "laptop", "solar pump", "e-vehicle", "housing", "pucca house", "construction", "gas"]):
        b_type = "Asset & Equipment Subsidy"
    elif any(k in combined for k in ["food security", "ration", "rice", "wheat", "subsidized food", "grain"]):
        b_type = "Subsidized Food & Nutrition"
    else:
        b_type = "Direct Cash Transfer (DBT)"

    return b_type, frequency


def get_canonical_portal_url(state: str, slug: str, existing_url: str = "") -> str:
    """
    Returns authentic dedicated government portal URL.
    """
    if existing_url and "myscheme.gov.in" not in existing_url:
        return existing_url

    st = (state or "").lower().strip()
    if st in STATE_PORTALS:
        return f"{STATE_PORTALS[st]}/{slug}"

    if st in ["all_india", "central", "all india", "national", ""]:
        return f"https://dbtbharat.gov.in/schemes/{slug}"

    return f"https://dbtbharat.gov.in/schemes/{slug}"
