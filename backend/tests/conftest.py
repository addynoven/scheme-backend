from contextlib import contextmanager
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.database import Base, get_db
from app.main import app

settings.TESTING = True

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


class QueryCounter:
    def __init__(self):
        self.count = 0
        self.queries: list[str] = []

    def __call__(
        self, conn, cursor, statement, parameters, context, executemany
    ):
        self.count += 1
        self.queries.append(statement)


@contextmanager
def capture_queries():
    counter = QueryCounter()
    event.listen(engine, "before_cursor_execute", counter)
    try:
        yield counter
    finally:
        event.remove(engine, "before_cursor_execute", counter)


@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def query_counter():
    return capture_queries
