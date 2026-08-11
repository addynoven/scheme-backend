from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin_user
from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError, UserNotFoundError
from app.database import get_db
from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.official_source import OfficialSource
from app.models.required_document import RequiredDocument
from app.models.user import User
from app.schemas.benefit import BenefitCreate, BenefitResponse
from app.schemas.eligibility_rule import EligibilityRuleCreate, EligibilityRuleResponse
from app.schemas.official_source import OfficialSourceCreate, OfficialSourceResponse
from app.schemas.pagination import PaginatedResponse
from app.schemas.required_document import RequiredDocumentCreate, RequiredDocumentResponse
from app.schemas.scheme import (
    SchemeCreate,
    SchemeDetailResponse,
    SchemeUpdate,
)
from app.schemas.user import UserResponse, UserRoleUpdate, UserWithProfileResponse
from app.services.scheme import (
    create_scheme,
    delete_scheme,
    get_scheme_by_id,
    list_schemes,
    update_scheme,
)
from app.services.user import get_user_by_id, list_users, update_user

router = APIRouter(
    prefix="/admin",
    tags=["Admin Management"],
    dependencies=[Depends(get_current_admin_user)],
)


# --- Scheme Management ---


@router.post(
    "/schemes",
    response_model=SchemeDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Create government scheme",
    description="Creates a new scheme with nested benefits, eligibility rules, and required documents. Requires role='admin'.",
    response_description="Created scheme with relations",
)
def admin_create_scheme(
    payload: SchemeCreate,
    db: Session = Depends(get_db),
):
    return create_scheme(db=db, payload=payload)


@router.get(
    "/schemes",
    response_model=PaginatedResponse[SchemeDetailResponse],
    summary="[Admin] List all schemes (including drafts/archived)",
    description="Returns all schemes across all statuses for administrative overview.",
)
def admin_list_schemes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    ministry: str | None = None,
    category: str | None = None,
    status_filter: str | None = Query(None, alias="status"),
    search: str | None = None,
    db: Session = Depends(get_db),
):
    items, total = list_schemes(
        db=db,
        skip=skip,
        limit=limit,
        ministry=ministry,
        category=category,
        status=status_filter,
        search=search,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/schemes/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="[Admin] Get scheme by ID",
    description="Returns complete details for a specific scheme.",
)
def admin_get_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)
    return scheme


@router.patch(
    "/schemes/{scheme_id}",
    response_model=SchemeDetailResponse,
    summary="[Admin] Update scheme details",
    description="Updates scheme attributes, publish status ('active', 'draft', 'archived'), category, or tags.",
)
def admin_update_scheme(
    scheme_id: int,
    payload: SchemeUpdate,
    db: Session = Depends(get_db),
):
    return update_scheme(db=db, scheme_id=scheme_id, payload=payload)


@router.delete(
    "/schemes/{scheme_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete scheme",
    description="Deletes a scheme and cascades deletion to all child relations.",
)
def admin_delete_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
):
    delete_scheme(db=db, scheme_id=scheme_id)
    return None


# --- Nested Relations Management ---


@router.post(
    "/schemes/{scheme_id}/rules",
    response_model=EligibilityRuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add eligibility rule to scheme",
    description="Appends a new eligibility rule (e.g. income <= 200000, age between 18-50) to an existing scheme.",
)
def admin_add_rule(
    scheme_id: int,
    payload: EligibilityRuleCreate,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    rule = EligibilityRule(scheme_id=scheme_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete eligibility rule",
)
def admin_delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    rule = db.scalar(select(EligibilityRule).where(EligibilityRule.id == rule_id))
    if not rule:
        raise EntityNotFoundError("EligibilityRule", rule_id)
    db.delete(rule)
    db.commit()
    return None


@router.post(
    "/schemes/{scheme_id}/documents",
    response_model=RequiredDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add required document to scheme",
    description="Specifies a mandatory or optional document requirement for the scheme.",
)
def admin_add_document(
    scheme_id: int,
    payload: RequiredDocumentCreate,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    doc = RequiredDocument(scheme_id=scheme_id, **payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete required document",
)
def admin_delete_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    doc = db.scalar(select(RequiredDocument).where(RequiredDocument.id == document_id))
    if not doc:
        raise EntityNotFoundError("RequiredDocument", document_id)
    db.delete(doc)
    db.commit()
    return None


@router.post(
    "/schemes/{scheme_id}/benefits",
    response_model=BenefitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add benefit to scheme",
)
def admin_add_benefit(
    scheme_id: int,
    payload: BenefitCreate,
    db: Session = Depends(get_db),
):
    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    benefit = Benefit(scheme_id=scheme_id, **payload.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    return benefit


@router.delete(
    "/benefits/{benefit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="[Admin] Delete benefit",
)
def admin_delete_benefit(
    benefit_id: int,
    db: Session = Depends(get_db),
):
    benefit = db.scalar(select(Benefit).where(Benefit.id == benefit_id))
    if not benefit:
        raise EntityNotFoundError("Benefit", benefit_id)
    db.delete(benefit)
    db.commit()
    return None


# --- User & Role Administration ---


@router.get(
    "/users",
    response_model=PaginatedResponse[UserWithProfileResponse],
    summary="[Admin] List all registered users",
    description="Returns all users in the system with their roles and profile information.",
)
def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    items, total = list_users(db=db, skip=skip, limit=limit)
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="[Admin] Update user role",
    description="Changes a user's role (e.g. elevating a citizen to 'admin').",
)
def admin_update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError(user_id)

    user.role = payload.role.strip().lower()
    db.commit()
    db.refresh(user)
    return user
