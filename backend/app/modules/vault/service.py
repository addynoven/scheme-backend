import uuid
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError
from app.core.storage import storage_service
from app.modules.auth.models import User
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


MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB


def validate_file_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Validates file size (max 15MB) and inspects binary magic bytes.
    Returns normalized mime_type string if valid, raises InvalidFileFormatError if invalid.
    """
    from app.core.exceptions import InvalidFileFormatError

    if not file_bytes or len(file_bytes) == 0:
        raise InvalidFileFormatError("Uploaded file is empty")

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise InvalidFileFormatError("File size exceeds maximum limit of 15 MB")

    header = file_bytes[:16]

    # PDF: %PDF-
    if header.startswith(b"%PDF"):
        return "application/pdf"

    # PNG: \x89PNG\r\n\x1a\n
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"

    # JPEG / JPG: \xff\xd8\xff
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"

    # WebP: RIFF ... WEBP
    if header.startswith(b"RIFF") and b"WEBP" in header:
        return "image/webp"

    # WAV audio / RIFF container
    if header.startswith(b"RIFF") and b"WAVE" in header:
        return "audio/wav"

    raise InvalidFileFormatError(
        "Invalid or unsupported file type. Only PDF, PNG, JPG, WEBP, and WAV files are allowed."
    )


async def read_upload_file_bounded(file: Any, max_bytes: int = 15 * 1024 * 1024) -> bytes:
    from app.core.exceptions import InvalidFileFormatError

    if getattr(file, "size", None) and file.size > max_bytes:
        raise InvalidFileFormatError("File size exceeds maximum limit of 15 MB")

    chunks = []
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1MB chunks
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > max_bytes:
            raise InvalidFileFormatError("File size exceeds maximum limit of 15 MB")
        chunks.append(chunk)

    return b"".join(chunks)


def upload_user_document(
    db: Session,
    user_id: int,
    document_type: str,
    file_name: str,
    file_bytes: bytes,
    mime_type: str,
    document_number_masked: str | None = None,
    household_member_id: int | None = None,
) -> UserDocumentResponse:
    validated_mime = validate_file_bytes(file_bytes, file_name)

    storage_service.ensure_bucket_exists()

    import pathlib
    import re
    ext = pathlib.Path(file_name).suffix.lower()
    if not ext or len(ext) > 5:
        ext = ".pdf" if "pdf" in validated_mime else ".png"

    unique_uuid = uuid.uuid4().hex
    object_key = f"vault/user_{user_id}/{unique_uuid}{ext}"
    clean_file_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file_name).strip() or "document"

    storage_service.upload_bytes(
        file_bytes=file_bytes,
        object_key=object_key,
        content_type=validated_mime,
    )

    citizen_uid = None
    if household_member_id:
        from app.modules.household.models import HouseholdMember
        member = db.scalar(
            select(HouseholdMember).where(
                HouseholdMember.id == household_member_id,
                HouseholdMember.primary_user_id == user_id,
            )
        )
        if member:
            citizen_uid = member.citizen_uid
    else:
        user = db.scalar(select(User).where(User.id == user_id))
        if user:
            citizen_uid = user.citizen_uid

    doc = UserDocument(
        user_id=user_id,
        household_member_id=household_member_id,
        citizen_uid=citizen_uid,
        document_type=document_type.strip(),
        document_number_masked=document_number_masked,
        file_key=object_key,
        file_name=clean_file_name,
        file_size_bytes=len(file_bytes),
        mime_type=validated_mime,
        is_verified=False,
    )
    db.add(doc)
    try:
        db.commit()
    except Exception:
        db.rollback()
        try:
            storage_service.delete_object(object_key)
        except Exception:
            pass
        raise

    db.refresh(doc)

    download_url = storage_service.generate_presigned_download_url(doc.file_key)
    return UserDocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        household_member_id=doc.household_member_id,
        citizen_uid=doc.citizen_uid,
        document_type=doc.document_type,
        document_number_masked=doc.document_number_masked,
        file_name=doc.file_name,
        file_size_bytes=doc.file_size_bytes,
        mime_type=doc.mime_type,
        is_verified=doc.is_verified,
        download_url=download_url,
    )


def list_user_documents(
    db: Session,
    user_id: int,
    household_member_id: int | None = None,
) -> list[UserDocumentResponse]:
    stmt = select(UserDocument).where(UserDocument.user_id == user_id)
    if household_member_id is not None:
        stmt = stmt.where(UserDocument.household_member_id == household_member_id)

    stmt = stmt.order_by(UserDocument.uploaded_at.desc())
    docs = list(db.scalars(stmt).all())

    results = []
    for doc in docs:
        download_url = storage_service.generate_presigned_download_url(doc.file_key)
        results.append(
            UserDocumentResponse(
                id=doc.id,
                user_id=doc.user_id,
                household_member_id=doc.household_member_id,
                citizen_uid=doc.citizen_uid,
                document_type=doc.document_type,
                document_number_masked=doc.document_number_masked,
                file_name=doc.file_name,
                file_size_bytes=doc.file_size_bytes,
                mime_type=doc.mime_type,
                is_verified=doc.is_verified,
                download_url=download_url,
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

    file_key = doc.file_key

    # Delete from DB first
    db.delete(doc)
    try:
        db.commit()
        # Delete from S3 storage only after successful DB commit
        storage_service.delete_object(file_key)
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

        is_verified_available = matched_user_doc is not None and matched_user_doc.is_verified == True
        if matched_user_doc is None:
            item_status = "missing"
        elif matched_user_doc.is_verified:
            item_status = "available"
        else:
            item_status = "pending_verification"

        if req.is_mandatory:
            mandatory_total += 1
            if is_verified_available:
                mandatory_available += 1
        else:
            optional_total += 1
            if is_verified_available:
                optional_available += 1

        checklist.append(
            DocumentReadinessItem(
                document_name=req.document_name,
                description=req.description,
                is_mandatory=req.is_mandatory,
                status=item_status,
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

    # Verify document ownership if document_id is provided
    verified_doc = None
    if document_id:
        verified_doc = db.scalar(
            select(UserDocument).where(
                UserDocument.id == document_id, UserDocument.user_id == user_id
            )
        )
        if not verified_doc:
            raise EntityNotFoundError("UserDocument", document_id)
        verified_doc.is_verified = True

    if not profile:
        # Create fresh profile using provided facts
        dob = None
        if payload.date_of_birth:
            try:
                parts = [int(p) for p in payload.date_of_birth.split("-")]
                dob = date(parts[0], parts[1], parts[2])
            except Exception:
                pass

        profile = Profile(
            user_id=user_id,
            full_name=payload.full_name or "Citizen",
            date_of_birth=dob or date(1990, 1, 1),
            gender=payload.gender or "unspecified",
            state=payload.state or "ALL_INDIA",
            district=payload.district or "General",
            annual_income=payload.annual_income or 0,
            occupation=payload.occupation or "unspecified",
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

    # Record immutable audit trail in citizen_facts table with validated source document
    from app.modules.auth.service import record_citizen_fact

    source_type_val = "document_ocr" if verified_doc else "self_attested"
    linked_doc_id = verified_doc.id if verified_doc else None

    for field in synced_fields:
        val = data.get(field)
        if val is not None:
            record_citizen_fact(
                db=db,
                user_id=user_id,
                fact_key=field,
                fact_value=val,
                source_document_id=linked_doc_id,
                source_type=source_type_val,
                status="verified",
                verified_by_user_id=user_id,
            )
        if val is not None:
            record_citizen_fact(
                db=db,
                user_id=user_id,
                fact_key=field,
                fact_value=val,
                source_document_id=document_id,
                source_type=source_type_val,
                status="verified",
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

