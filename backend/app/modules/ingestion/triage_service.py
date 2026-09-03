from datetime import datetime, timezone
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError
from app.modules.ingestion.models import IngestionTriageItem
from app.modules.schemes.models import Scheme
from app.modules.schemes.models import Benefit
from app.modules.schemes.models import EligibilityRule
from app.modules.schemes.models import RequiredDocument

logger = logging.getLogger("app.ingestion.triage")


def list_triage_items(
    db: Session,
    status_filter: str | None = "pending_review",
) -> list[IngestionTriageItem]:
    stmt = select(IngestionTriageItem).order_by(IngestionTriageItem.created_at.desc())
    if status_filter:
        stmt = stmt.where(IngestionTriageItem.status == status_filter)
    return list(db.scalars(stmt).all())


def approve_triage_item(
    db: Session,
    triage_id: int,
    reviewed_by: str = "admin@gov.in",
) -> IngestionTriageItem:
    item = db.scalar(
        select(IngestionTriageItem).where(IngestionTriageItem.id == triage_id)
    )
    if not item:
        raise EntityNotFoundError("IngestionTriageItem", triage_id)

    if item.status != "pending_review":
        raise ValueError(f"Triage item {triage_id} is already {item.status}")

    payload = item.diff_payload or {}
    after_state = payload.get("after_state", {})

    # Apply change to database
    scheme = db.scalar(select(Scheme).where(Scheme.slug == item.scheme_slug))
    if scheme and after_state:
        if "description" in after_state:
            scheme.description = after_state.get("description", scheme.description)
        if "status" in after_state:
            scheme.status = after_state.get("status", scheme.status)
        if "ministry" in after_state:
            scheme.ministry = after_state.get("ministry", scheme.ministry)

        # If rule update
        if "rule" in after_state:
            r = after_state["rule"]
            target_rule = next(
                (
                    rule for rule in scheme.eligibility_rules
                    if rule.field_name.lower() == r.get("field_name", "").lower()
                    and rule.operator.lower() == r.get("operator", "").lower()
                ),
                None,
            )
            rule_val = str(r.get("rule_value") or r.get("value_criteria") or "")
            if target_rule:
                target_rule.rule_value = rule_val
            else:
                new_rule = EligibilityRule(
                    scheme_id=scheme.id,
                    field_name=r.get("field_name", "custom_field"),
                    operator=r.get("operator", "="),
                    rule_value=rule_val,
                )
                db.add(new_rule)

        # If benefit update
        if "benefit" in after_state:
            b = after_state["benefit"]
            b_title = b.get("title") or b.get("benefit_type") or "Benefit"
            target_benefit = next(
                (
                    ben for ben in scheme.benefits
                    if ben.title.lower() == b_title.lower()
                ),
                None,
            )
            if target_benefit:
                target_benefit.description = b.get("description", target_benefit.description)
            else:
                new_ben = Benefit(
                    scheme_id=scheme.id,
                    title=b_title,
                    description=b.get("description", ""),
                )
                db.add(new_ben)

        # If document update
        if "document" in after_state:
            d = after_state["document"]
            target_doc = next(
                (
                    doc for doc in scheme.required_documents
                    if doc.document_name.lower() == d.get("document_name", "").lower()
                ),
                None,
            )
            if target_doc:
                target_doc.is_mandatory = bool(d.get("is_mandatory", target_doc.is_mandatory))
                target_doc.description = d.get("description", target_doc.description)
            else:
                new_doc = RequiredDocument(
                    scheme_id=scheme.id,
                    document_name=d.get("document_name", "Required Document"),
                    is_mandatory=bool(d.get("is_mandatory", True)),
                    description=d.get("description", ""),
                )
                db.add(new_doc)

    item.status = "approved"
    item.reviewed_by = reviewed_by
    item.reviewed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(item)
        if scheme:
            from app.modules.eligibility.bitmask_engine import bitmask_engine
            from app.modules.schemes.service import create_scheme_version_snapshot
            create_scheme_version_snapshot(db, scheme.id)
            bitmask_engine.warm_up(db)
    except Exception:
        db.rollback()
        raise

    logger.info(f"Approved triage item {triage_id} for scheme {item.scheme_slug}")
    return item


def reject_triage_item(
    db: Session,
    triage_id: int,
    reviewed_by: str = "admin@gov.in",
) -> IngestionTriageItem:
    item = db.scalar(
        select(IngestionTriageItem).where(IngestionTriageItem.id == triage_id)
    )
    if not item:
        raise EntityNotFoundError("IngestionTriageItem", triage_id)

    if item.status != "pending_review":
        raise ValueError(f"Triage item {triage_id} is already {item.status}")

    item.status = "rejected"
    item.reviewed_by = reviewed_by
    item.reviewed_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(item)
    except Exception:
        db.rollback()
        raise

    logger.info(f"Rejected triage item {triage_id} for scheme {item.scheme_slug}")
    return item
