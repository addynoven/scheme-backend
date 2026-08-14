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
from app.modules.auth import models as _auth_models  # noqa
from app.modules.schemes import models as _schemes_models  # noqa
from app.modules.vault import models as _vault_models  # noqa
from app.modules.ingestion import models as _ingestion_models  # noqa
from app.modules.chat import models as _chat_models  # noqa
from app.modules.household import models as _household_models  # noqa