from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.scheme import Scheme
from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.required_document import RequiredDocument
from app.models.official_source import OfficialSource


def seed_pm_kisan(db: Session):

    # Prevent duplicate seeding
    existing_scheme = (
        db.query(Scheme)
        .filter(Scheme.slug == "pm-kisan")
        .first()
    )

    if existing_scheme:
        print("PM Kisan already exists")
        return

    # Create Scheme
    scheme = Scheme(
        name="PM Kisan",
        slug="pm-kisan",
        ministry="Ministry of Agriculture",
        description="Income support scheme for farmers",
        status="active",
        application_url="https://pmkisan.gov.in",
        official_website="https://pmkisan.gov.in",
    )

    db.add(scheme)
    db.flush()  # Gets scheme.id without commit

    # Benefits
    benefit = Benefit(
        scheme_id=scheme.id,
        title="Annual Financial Assistance",
        description="₹6000 per year paid in installments"
    )

    db.add(benefit)

    # Eligibility Rules
    rule = EligibilityRule(
        scheme_id=scheme.id,
        field_name="occupation",
        operator="eq",
        rule_value="farmer"
    )

    db.add(rule)

    # Required Documents
    documents = [
        RequiredDocument(
            scheme_id=scheme.id,
            document_name="Aadhaar Card",
            is_mandatory=True
        ),
        RequiredDocument(
            scheme_id=scheme.id,
            document_name="Bank Passbook",
            is_mandatory=True
        ),
        RequiredDocument(
            scheme_id=scheme.id,
            document_name="Land Records",
            is_mandatory=True
        ),
    ]

    db.add_all(documents)

    # Official Source
    source = OfficialSource(
        scheme_id=scheme.id,
        title="PM Kisan Official Portal",
        url="https://pmkisan.gov.in",
        source_type="website"
    )

    db.add(source)

    db.commit()

    print("PM Kisan seeded successfully")


def main():
    db = SessionLocal()

    try:
        seed_pm_kisan(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()