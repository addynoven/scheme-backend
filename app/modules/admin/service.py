"""
Admin Module Service.
Encapsulates administrative operations: rule management, required document management,
benefit management, and user role elevation.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError, UserNotFoundError
from app.modules.auth.models import User
from app.modules.auth.schemas import UserRoleUpdate
from app.modules.schemes.models import Benefit, EligibilityRule, OfficialSource, RequiredDocument, Scheme
from app.modules.schemes.schemas import (
    BenefitCreate,
    EligibilityRuleCreate,
    OfficialSourceCreate,
    RequiredDocumentCreate,
)


def add_scheme_rule(db: Session, scheme_id: int, payload: EligibilityRuleCreate) -> EligibilityRule:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    rule = EligibilityRule(scheme_id=scheme_id, **payload.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def delete_scheme_rule(db: Session, scheme_id: int, rule_id: int) -> None:
    rule = db.scalar(
        select(EligibilityRule).where(
            EligibilityRule.id == rule_id,
            EligibilityRule.scheme_id == scheme_id,
        )
    )
    if not rule:
        raise EntityNotFoundError("EligibilityRule", rule_id)
    db.delete(rule)
    db.commit()


def add_scheme_document(db: Session, scheme_id: int, payload: RequiredDocumentCreate) -> RequiredDocument:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    doc = RequiredDocument(scheme_id=scheme_id, **payload.model_dump())
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def delete_scheme_document(db: Session, scheme_id: int, doc_id: int) -> None:
    doc = db.scalar(
        select(RequiredDocument).where(
            RequiredDocument.id == doc_id,
            RequiredDocument.scheme_id == scheme_id,
        )
    )
    if not doc:
        raise EntityNotFoundError("RequiredDocument", doc_id)
    db.delete(doc)
    db.commit()


def add_scheme_benefit(db: Session, scheme_id: int, payload: BenefitCreate) -> Benefit:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    benefit = Benefit(scheme_id=scheme_id, **payload.model_dump())
    db.add(benefit)
    db.commit()
    db.refresh(benefit)
    return benefit


def delete_scheme_benefit(db: Session, scheme_id: int, benefit_id: int) -> None:
    benefit = db.scalar(
        select(Benefit).where(
            Benefit.id == benefit_id,
            Benefit.scheme_id == scheme_id,
        )
    )
    if not benefit:
        raise EntityNotFoundError("Benefit", benefit_id)
    db.delete(benefit)
    db.commit()


def add_scheme_source(db: Session, scheme_id: int, payload: OfficialSourceCreate) -> OfficialSource:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    source = OfficialSource(scheme_id=scheme_id, **payload.model_dump())
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def delete_scheme_source(db: Session, scheme_id: int, source_id: int) -> None:
    source = db.scalar(
        select(OfficialSource).where(
            OfficialSource.id == source_id,
            OfficialSource.scheme_id == scheme_id,
        )
    )
    if not source:
        raise EntityNotFoundError("OfficialSource", source_id)
    db.delete(source)
    db.commit()


def update_user_role(db: Session, user_id: int, payload: UserRoleUpdate) -> User:
    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise UserNotFoundError(user_id)
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
