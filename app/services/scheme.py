from sqlalchemy.orm import Session

from app.models.scheme import Scheme
from app.schemas.scheme import SchemeCreate


def create_scheme(
    db: Session,
    payload: SchemeCreate,
) -> Scheme:
    scheme = Scheme(**payload.model_dump())

    db.add(scheme)
    db.commit()
    db.refresh(scheme)

    return scheme