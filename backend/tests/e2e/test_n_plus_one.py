from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.auth.models import Profile, User
from app.modules.chat.models import ChatMessage, ChatSession
from app.modules.schemes.models import (
    Benefit,
    EligibilityRule,
    OfficialSource,
    RequiredDocument,
    Scheme,
)


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

    from app.core.security import create_access_token
    admin_user = User(
        email="admin_nplus1@gov.in",
        phone="+919999900001",
        hashed_password="hashed_admin_password",
        role="admin",
        is_verified=True,
    )
    db_session.add(admin_user)
    db_session.commit()
    token = create_access_token(
        subject=admin_user.id, extra_claims={"email": admin_user.email}
    )
    headers = {"Authorization": f"Bearer {token}"}

    with query_counter() as counter:
        response = client.get("/users?skip=0&limit=10", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 10
    assert len(data["items"]) == 10

    for item in data["items"]:
        assert item["profile"] is not None or item["role"] == "admin"

    # N+1 Detection:
    # Auth user lookup (1) + Auth user profile (1) + count (1) + users (1) + batch profiles (1) = 5 queries total.
    assert counter.count <= 5, (
        f"N+1 problem detected! Expected <= 5 queries, but executed {counter.count} queries:\n"
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


def test_chat_sessions_list_has_no_n_plus_one(
    client: TestClient, db_session: Session, query_counter
):
    from app.core.security import create_access_token

    user = User(
        email="chat_citizen@gov.in",
        phone="+919870001122",
        hashed_password="hashed_password",
        role="citizen",
        is_verified=True,
    )
    db_session.add(user)
    db_session.commit()

    # Create 5 chat sessions, each with 3 messages
    for i in range(5):
        session = ChatSession(
            session_uid=f"session-test-{i}",
            user_id=user.id,
            title=f"Conversation {i}",
            language_code="en",
        )
        db_session.add(session)
        db_session.flush()
        for m in range(3):
            db_session.add(
                ChatMessage(
                    session_id=session.id,
                    sender="user" if m % 2 == 0 else "assistant",
                    content=f"Message {m} for session {i}",
                )
            )
    db_session.commit()

    token = create_access_token(subject=user.id, extra_claims={"email": user.email})
    headers = {"Authorization": f"Bearer {token}"}

    with query_counter() as counter:
        response = client.get("/chat/sessions", headers=headers)

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5

    # N+1 Detection:
    # Auth user lookup (1) + Auth user profile (1) + Sessions query (1) + Batch messages selectin query (1) = 4 queries total.
    # Without selectinload, this would execute 1 + 1 + 1 + 5 = 8 queries.
    assert counter.count <= 4, (
        f"N+1 problem detected in chat sessions list! Expected <= 4 queries, but executed {counter.count}:\n"
        + "\n---\n".join(counter.queries)
    )
