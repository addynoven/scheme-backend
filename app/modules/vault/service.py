import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError
from app.core.storage import storage_service
from app.modules.schemes.models import RequiredDocument
from app.modules.schemes.models import Scheme
from app.modules.vault.models import UserDocument
from app.modules.vault.schemas import (
    ConfirmFactsAndSyncProfileRequest,
    ConfirmFactsAndSyncProfileResponse,
    DocumentReadinessItem,
    ExtractedDocumentFactsResponse,
    SchemeDocumentReadinessResponse,
    UserDocumentResponse,
)


def _normalize_doc_name(name: str) -> str:
    return name.lower().replace("-", " ").replace("_", " ").strip()


def _is_doc_match(required_name: str, user_doc_type: str) -> bool:
    req = _normalize_doc_name(required_name)
    user = _normalize_doc_name(user_doc_type)

    if req == user or req in user or user in req:
        return True

    # Common Indian welfare document aliases
    synonyms = [
        {"aadhaar", "aadhaar card", "uidai", "parent aadhaar card"},
        {"pan", "pan card", "pen card", "permanent account number", "pan proof"},
        {"bank passbook", "bank account", "bank statement", "passbook"},
        {"income certificate", "bpl certificate", "bpl card", "income proof"},
        {"ration card", "family ration card", "bpl card"},
        {"land records", "land possession certificate", "khasra", "khatauni"},
        {"birth certificate", "age proof", "age proof certificate"},
        {"caste certificate", "community certificate"},
        {"marksheet", "academic marksheet", "10th marksheet", "qualification certificate"},
        {"business address proof", "udyam registration", "business proof", "msme registration"},
    ]

    for group in synonyms:
        if any(alias in req for alias in group) and any(alias in user for alias in group):
            return True

    return False


def upload_user_document(
    db: Session,
    user_id: int,
    document_type: str,
    file_name: str,
    file_bytes: bytes,
    mime_type: str,
    document_number_masked: str | None = None,
) -> UserDocumentResponse:
    storage_service.ensure_bucket_exists()

    unique_id = uuid.uuid4().hex[:12]
    clean_file_name = file_name.replace(" ", "_")
    object_key = f"vault/user_{user_id}/{unique_id}_{clean_file_name}"

    storage_service.upload_bytes(
        file_bytes=file_bytes,
        object_key=object_key,
        content_type=mime_type,
    )

    doc = UserDocument(
        user_id=user_id,
        document_type=document_type.strip(),
        document_number_masked=document_number_masked,
        file_key=object_key,
        file_name=file_name,
        file_size_bytes=len(file_bytes),
        mime_type=mime_type,
        is_verified=False,
    )
    db.add(doc)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(doc)

    download_url = storage_service.generate_presigned_download_url(doc.file_key)
    return UserDocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        document_type=doc.document_type,
        document_number_masked=doc.document_number_masked,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        is_verified=doc.is_verified,
        download_url=download_url,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def list_user_documents(db: Session, user_id: int) -> list[UserDocumentResponse]:
    stmt = (
        select(UserDocument)
        .where(UserDocument.user_id == user_id)
        .order_by(UserDocument.created_at.desc())
    )
    docs = list(db.scalars(stmt).all())

    results = []
    for doc in docs:
        download_url = storage_service.generate_presigned_download_url(doc.file_key)
        results.append(
            UserDocumentResponse(
                id=doc.id,
                user_id=doc.user_id,
                document_type=doc.document_type,
                document_number_masked=doc.document_number_masked,
                file_name=doc.file_name,
                file_size_bytes=doc.file_size_bytes,
                mime_type=doc.mime_type,
                is_verified=doc.is_verified,
                download_url=download_url,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
        )
    return results


def get_user_document_content(
    db: Session, user_id: int, document_id: int
) -> tuple[bytes, str, str]:
    doc = db.scalar(
        select(UserDocument).where(
            UserDocument.id == document_id, UserDocument.user_id == user_id
        )
    )
    if not doc:
        raise EntityNotFoundError("UserDocument", document_id)

    body_bytes, content_type = storage_service.get_object(doc.file_key)
    return body_bytes, doc.mime_type or content_type, doc.file_name


def delete_user_document(db: Session, user_id: int, document_id: int) -> bool:
    doc = db.scalar(
        select(UserDocument).where(
            UserDocument.id == document_id, UserDocument.user_id == user_id
        )
    )
    if not doc:
        raise EntityNotFoundError("UserDocument", document_id)

    # Delete from S3 storage
    storage_service.delete_object(doc.file_key)

    # Delete from DB
    db.delete(doc)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return True


def evaluate_document_readiness(
    db: Session, user_id: int, scheme_id: int
) -> SchemeDocumentReadinessResponse:
    scheme = db.scalar(select(Scheme).where(Scheme.id == scheme_id))
    if not scheme:
        raise SchemeNotFoundError(scheme_id)

    # Get required documents for this scheme
    req_stmt = select(RequiredDocument).where(RequiredDocument.scheme_id == scheme_id)
    req_docs = list(db.scalars(req_stmt).all())

    # Get user documents in vault
    user_docs = list_user_documents(db, user_id)

    checklist: list[DocumentReadinessItem] = []
    mandatory_total = 0
    mandatory_available = 0
    optional_total = 0
    optional_available = 0

    for req in req_docs:
        matched_user_doc = next(
            (ud for ud in user_docs if _is_doc_match(req.document_name, ud.document_type)),
            None,
        )

        is_present = matched_user_doc is not None
        if req.is_mandatory:
            mandatory_total += 1
            if is_present:
                mandatory_available += 1
        else:
            optional_total += 1
            if is_present:
                optional_available += 1

        checklist.append(
            DocumentReadinessItem(
                document_name=req.document_name,
                description=req.description,
                is_mandatory=req.is_mandatory,
                status="available" if is_present else "missing",
                matched_vault_document_id=matched_user_doc.id if matched_user_doc else None,
                matched_vault_document_name=matched_user_doc.file_name if matched_user_doc else None,
            )
        )

    if mandatory_total == 0:
        is_ready = True
        percentage = 100.0
        summary = "No mandatory documents required for this scheme. You can apply immediately!"
    else:
        is_ready = mandatory_available == mandatory_total
        percentage = round((mandatory_available / mandatory_total) * 100.0, 1)
        if is_ready:
            summary = f"All {mandatory_total} mandatory documents are verified and ready in your vault! You are 100% application ready."
        else:
            missing_count = mandatory_total - mandatory_available
            summary = f"You have {mandatory_available}/{mandatory_total} mandatory documents ready. Please upload the remaining {missing_count} document(s) to complete your application."

    return SchemeDocumentReadinessResponse(
        scheme_id=scheme.id,
        scheme_name=scheme.name,
        scheme_slug=scheme.slug,
        is_ready_to_apply=is_ready,
        readiness_percentage=percentage,
        mandatory_total=mandatory_total,
        mandatory_available=mandatory_available,
        optional_total=optional_total,
        optional_available=optional_available,
        checklist=checklist,
        summary=summary,
    )


# --- V2.0 Fact Extraction & Profile Merge Service ---


def extract_facts_from_user_document(
    db: Session, user_id: int, document_id: int
) -> ExtractedDocumentFactsResponse:
    doc = db.scalar(
        select(UserDocument).where(
            UserDocument.id == document_id, UserDocument.user_id == user_id
        )
    )
    if not doc:
        raise EntityNotFoundError("UserDocument", document_id)

    body_bytes, content_type, file_name = get_user_document_content(
        db=db, user_id=user_id, document_id=document_id
    )

    from app.modules.ocr.service import extract_document_facts_pipeline
    result = extract_document_facts_pipeline(
        file_bytes=body_bytes,
        mime_type=content_type or doc.mime_type,
        document_type_hint=doc.document_type,
        file_name=file_name,
    )
    result.document_id = document_id
    return result


def confirm_and_sync_profile_from_facts(
    db: Session,
    user_id: int,
    payload: ConfirmFactsAndSyncProfileRequest,
    document_id: int | None = None,
) -> ConfirmFactsAndSyncProfileResponse:
    from datetime import date
    from app.modules.auth.models import Profile

    profile = db.scalar(select(Profile).where(Profile.user_id == user_id))

    synced_fields: list[str] = []
    data = payload.model_dump(exclude_unset=True)

    if not profile:
        # Create fresh profile with sensible fallbacks
        dob = date(2000, 1, 1)
        if payload.date_of_birth:
            try:
                parts = [int(p) for p in payload.date_of_birth.split("-")]
                dob = date(parts[0], parts[1], parts[2])
            except Exception:
                pass

        profile = Profile(
            user_id=user_id,
            full_name=payload.full_name or "Citizen",
            date_of_birth=dob,
            gender=payload.gender or "other",
            state=payload.state or "All-India",
            district=payload.district or "General",
            annual_income=payload.annual_income or 0,
            occupation=payload.occupation or "self_employed",
            caste_category=payload.caste_category,
            has_land=payload.has_land,
            is_differently_abled=payload.is_differently_abled,
        )
        db.add(profile)
        synced_fields = [k for k, v in data.items() if v is not None]
    else:
        # Progressively update non-null fields
        for field, val in data.items():
            if val is not None:
                if field == "date_of_birth" and isinstance(val, str):
                    try:
                        parts = [int(p) for p in val.split("-")]
                        setattr(profile, field, date(parts[0], parts[1], parts[2]))
                        synced_fields.append(field)
                    except Exception:
                        pass
                elif hasattr(profile, field):
                    setattr(profile, field, val)
                    synced_fields.append(field)

    # Mark document as verified if document_id provided
    if document_id:
        doc = db.scalar(
            select(UserDocument).where(
                UserDocument.id == document_id, UserDocument.user_id == user_id
            )
        )
        if doc:
            doc.is_verified = True

    # Record immutable audit trail in citizen_facts table
    from app.modules.auth.service import record_citizen_fact

    for field in synced_fields:
        val = data.get(field)
        if val is not None:
            record_citizen_fact(
                db=db,
                user_id=user_id,
                fact_key=field,
                fact_value=val,
                source_document_id=document_id,
                verified_by_user_id=user_id,
            )

    try:
        db.commit()
        db.refresh(profile)
    except Exception:
        db.rollback()
        raise

    profile_dict = {
        "full_name": profile.full_name,
        "date_of_birth": str(profile.date_of_birth),
        "gender": profile.gender,
        "state": profile.state,
        "district": profile.district,
        "annual_income": profile.annual_income,
        "occupation": profile.occupation,
        "caste_category": profile.caste_category,
        "has_land": profile.has_land,
        "is_differently_abled": profile.is_differently_abled,
    }

    return ConfirmFactsAndSyncProfileResponse(
        status="synced",
        synced_fields=synced_fields,
        message=f"Successfully synced {len(synced_fields)} verified field(s) into citizen profile.",
        profile=profile_dict,
    )

