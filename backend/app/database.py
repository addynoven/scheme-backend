from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Ensure all model entities are registered with SQLAlchemy Base
import app.modules.auth.models as _auth_models  # noqa
import app.modules.schemes.models as _schemes_models  # noqa
import app.modules.vault.models as _vault_models  # noqa
import app.modules.ingestion.models as _ingestion_models  # noqa
import app.modules.chat.models as _chat_models  # noqa
import app.modules.household.models as _household_models  # noqa