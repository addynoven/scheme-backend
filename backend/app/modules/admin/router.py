from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_admin_user
from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError, UserNotFoundError
from app.database import get_db
from app.modules.schemes.models import Benefit
from app.modules.schemes.models import EligibilityRule
from app.modules.schemes.models import RequiredDocument
from app.modules.auth.models import User
from app.modules.schemes.schemas import BenefitCreate, BenefitResponse
from app.modules.schemes.schemas import EligibilityRuleCreate, EligibilityRuleResponse

from app.core.pagination import PaginatedResponse
from app.modules.schemes.schemas import RequiredDocumentCreate, RequiredDocumentResponse
from app.modules.schemes.schemas import (
    SchemeCreate,
    SchemeDetailResponse,
    SchemeUpdate,
)
from app.modules.auth.schemas import UserResponse, UserRoleUpdate, UserWithProfileResponse
from app.modules.schemes.service import (
    create_scheme,
    delete_scheme,
    get_scheme_by_id,
    list_schemes,
    update_scheme,
)
from app.modules.auth.service import get_user_by_id, list_users

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
    from app.modules.eligibility.bitmask_engine import bitmask_engine
    from app.modules.schemes.service import create_scheme_version_snapshot

    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    rule = EligibilityRule(scheme_id=scheme_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    create_scheme_version_snapshot(db, scheme_id)
    bitmask_engine.warm_up(db)
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
    from app.modules.eligibility.bitmask_engine import bitmask_engine
    from app.modules.schemes.service import create_scheme_version_snapshot

    rule = db.scalar(select(EligibilityRule).where(EligibilityRule.id == rule_id))
    if not rule:
        raise EntityNotFoundError("EligibilityRule", rule_id)
    scheme_id = rule.scheme_id
    db.delete(rule)
    db.commit()
    create_scheme_version_snapshot(db, scheme_id)
    bitmask_engine.warm_up(db)
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
    from app.modules.schemes.service import create_scheme_version_snapshot

    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    doc = RequiredDocument(scheme_id=scheme_id, **payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    create_scheme_version_snapshot(db, scheme_id)
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
    from app.modules.schemes.service import create_scheme_version_snapshot

    doc = db.scalar(select(RequiredDocument).where(RequiredDocument.id == document_id))
    if not doc:
        raise EntityNotFoundError("RequiredDocument", document_id)
    scheme_id = doc.scheme_id
    db.delete(doc)
    db.commit()
    create_scheme_version_snapshot(db, scheme_id)
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
    from app.modules.schemes.service import create_scheme_version_snapshot

    scheme = get_scheme_by_id(db=db, scheme_id=scheme_id)
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    benefit = Benefit(scheme_id=scheme_id, **payload.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    create_scheme_version_snapshot(db, scheme_id)
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
    from app.modules.schemes.service import create_scheme_version_snapshot

    benefit = db.scalar(select(Benefit).where(Benefit.id == benefit_id))
    if not benefit:
        raise EntityNotFoundError("Benefit", benefit_id)
    scheme_id = benefit.scheme_id
    db.delete(benefit)
    db.commit()
    create_scheme_version_snapshot(db, scheme_id)
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
    summary="[Admin] Update user role with audit log",
    description="Changes a user's role (e.g. elevating a citizen to 'admin') and creates an immutable audit trail entry.",
)
def admin_update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    from app.modules.admin.models import RoleChangeAudit

    user = get_user_by_id(db=db, user_id=user_id)
    if not user:
        raise UserNotFoundError(user_id)

    old_role = user.role
    new_role = payload.role.strip().lower()

    if old_role != new_role:
        audit_entry = RoleChangeAudit(
            target_user_id=user.id,
            actor_admin_id=current_admin.id,
            previous_role=old_role,
            new_role=new_role,
            reason=f"Role updated from {old_role} to {new_role} by admin user_id {current_admin.id}",
        )
        db.add(audit_entry)
        user.role = new_role
        db.commit()
        db.refresh(user)

    return user


