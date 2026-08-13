import uuid
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError, SchemeNotFoundError
from app.core.storage import storage_service
from app.modules.schemes.models import RequiredDocument
from app.modules.schemes.models import Scheme
from app.modules.vault.models import UserDocument
from app.modules.vault.schemas import (
    DocumentReadinessItem,
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
