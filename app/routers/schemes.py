from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.scheme import Scheme
from app.schemas.scheme import (
    SchemeCreate,
    SchemeResponse
)
from app.services.scheme import create_scheme

router = APIRouter(
    prefix="/schemes",
    tags=["Schemes"]
)

@router.post(
    "/",
    response_model=SchemeResponse
)
def create_scheme_endpoint(
    payload: SchemeCreate,
    db: Session = Depends(get_db)
):
    return create_scheme(db=db, payload=payload)