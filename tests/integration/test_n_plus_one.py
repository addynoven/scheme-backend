from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.official_source import OfficialSource
from app.models.profile import Profile
from app.models.required_document import RequiredDocument
from app.models.scheme import Scheme
from app.models.user import User


def seed_schemes(db: Session, count: int = 10):
    for i in range(count):
        scheme = Scheme(
            name=f"Welfare Scheme {i}",
            slug=f"welfare-scheme-{i}",
            ministry="Ministry of Social Justice",
            description=f"Description for scheme {i}",
            status="active",
        )
        db.add(scheme)
        db.flush()

        db.add(
            Benefit(
                scheme_id=scheme.id,
                title=f"Benefit {i}",
                description=f"Description {i}",
            )
        )
        db.add(
            EligibilityRule(
                scheme_id=scheme.id,
                field_name="occupation",
                operator="eq",
                rule_value="farmer",
            )
        )
        db.add(
            RequiredDocument(
                scheme_id=scheme.id,
                document_name="Aadhaar Card",
                is_mandatory=True,
            )
        )
        db.add(
            OfficialSource(
                scheme_id=scheme.id,
                title="Official Portal",
                url="https://gov.in",
                source_type="website",
            )
        )

    db.commit()


def seed_users_with_profiles(db: Session, count: int = 10):
    for i in range(count):
        user = User(
            email=f"user{i}@example.com",
            phone=f"+9198000000{i:02d}",
            hashed_password="hashed_test_password_123",
            is_verified=True,
        )
        db.add(user)
        db.flush()

        profile = Profile(
            user_id=user.id,
            full_name=f"User {i}",
            date_of_birth=date(1995, 1, 1),
            gender="female",
            state="Maharashtra",
            district="Mumbai",
            annual_income=100000,
            occupation="farmer",
        )
        db.add(profile)

    db.commit()


def test_schemes_list_has_no_n_plus_one(
    client: TestClient, db_session: Session, query_counter
):
    # Seed 10 schemes (each having 4 related child records -> 40 child rows total)
    seed_schemes(db_session, count=10)

    # Capture all SQL queries executed during the GET /schemes endpoint
    with query_counter() as counter:
        response = client.get("/schemes?skip=0&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10

    # Ensure every single scheme has its 4 related collections populated
    for item in data["items"]:
        assert len(item["benefits"]) == 1
        assert len(item["eligibility_rules"]) == 1
        assert len(item["required_documents"]) == 1
        assert len(item["official_sources"]) == 1

    # N+1 Detection:
    # If N+1 existed: 1 (count) + 1 (schemes) + 10*4 (child relations) = 42 queries.
    # With eager loading (selectinload): exactly 1 (count) + 1 (schemes) + 4 (batch IN queries for relations) = 6 queries.
    assert counter.count <= 6, (
        f"N+1 problem detected! Expected <= 6 queries, but executed {counter.count} queries:\n"
        + "\n---\n".join(counter.queries)
    )


def test_users_list_has_no_n_plus_one(
    client: TestClient, db_session: Session, query_counter
):
    # Seed 10 users with profiles
    seed_users_with_profiles(db_session, count=10)

    with query_counter() as counter:
        response = client.get("/users?skip=0&limit=10")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert len(data["items"]) == 10

    for item in data["items"]:
        assert item["profile"] is not None

    # N+1 Detection:
    # If N+1 existed: 1 (count) + 1 (users) + 10 (individual profile queries) = 12 queries.
    # With eager loading (selectinload): exactly 1 (count) + 1 (users) + 1 (batch profiles IN query) = 3 queries.
    assert counter.count <= 3, (
        f"N+1 problem detected! Expected <= 3 queries, but executed {counter.count} queries:\n"
        + "\n---\n".join(counter.queries)
    )


def test_eligibility_matching_has_no_n_plus_one(
    client: TestClient, db_session: Session, query_counter
):
    # Seed 10 schemes with rules
    seed_schemes(db_session, count=10)

    with query_counter() as counter:
        response = client.post(
            "/eligibility/check",
            json={"occupation": "farmer", "annual_income": 100000},
        )

    assert response.status_code == 200
    assert len(response.json()) == 10

    # N+1 Detection:
    # Scheme matching evaluates active schemes.
    # Eager loading loads all schemes + 4 batch relation queries = 5 queries total.
    assert counter.count <= 5, (
        f"N+1 problem detected in eligibility engine! Executed {counter.count} queries:\n"
        + "\n---\n".join(counter.queries)
    )
