from fastapi import APIRouter, Depends, File, Form, Header, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.core.storage import storage_service
from app.modules.auth.models import User
from app.modules.ocr.schemas import ExtractedDocumentFactsResponse
from app.modules.vault.schemas import (
    ConfirmFactsAndSyncProfileRequest,
    ConfirmFactsAndSyncProfileResponse,
    DirectUploadConfirmRequest,
    DirectUploadParamsRequest,
    DirectUploadParamsResponse,
    SchemeDocumentReadinessResponse,
    UserDocumentResponse,
)
from app.modules.vault.service import (
    confirm_and_sync_profile_from_facts,
    confirm_direct_upload,
    delete_user_document,
    evaluate_document_readiness,
    extract_facts_from_user_document,
    list_user_documents,
    upload_user_document,
)

router = APIRouter(prefix="/vault", tags=["Document Vault & Readiness"])


@router.post(
    "/documents/direct-upload-params",
    response_model=DirectUploadParamsResponse,
    summary="Get signed direct upload parameters for Cloudinary (Zero double-upload)",
    description="Generates cryptographically signed upload parameters so mobile/web clients can upload files directly to Cloudinary CDN, bypassing server bandwidth and RAM limits.",
)
def get_direct_upload_params_endpoint(
    payload: DirectUploadParamsRequest,
    current_user: User = Depends(get_current_user),
):
    sig_data = storage_service.generate_upload_signature(user_id=current_user.id, folder="vault")
    return DirectUploadParamsResponse(
        upload_url=sig_data["upload_url"],
        cloud_name=sig_data["cloud_name"],
        api_key=sig_data["api_key"],
        timestamp=sig_data["timestamp"],
        signature=sig_data["signature"],
        public_id=sig_data["public_id"],
        folder=sig_data["folder"],
    )


@router.post(
    "/documents/direct-upload-confirm",
    response_model=UserDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Confirm direct upload and register document in citizen vault",
    description="Called after client successfully uploads file directly to Cloudinary to save document metadata and trigger readiness evaluation.",
)
def confirm_direct_upload_endpoint(
    payload: DirectUploadConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return confirm_direct_upload(
        db=db,
        user_id=current_user.id,
        payload=payload,
    )



@router.post(
    "/documents/upload",
    response_model=UserDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload citizen document to vault",
    description="Uploads a PDF or image document (e.g. Aadhaar Card, Bank Passbook, Land Records) to MinIO/S3 object storage and associates it with the authenticated citizen or specific household member.",
    response_description="Saved document metadata and secure presigned download URL",
)
async def upload_document_endpoint(
    document_type: str = Form(..., description="Type of document e.g. 'Aadhaar Card', 'Bank Passbook', 'Land Records', 'Income Certificate'"),
    document_number_masked: str | None = Form(None, description="Optional masked document identifier e.g. 'XXXX-XXXX-4532'"),
    household_member_id: int | None = Form(None, description="Optional target family member ID"),
    file: UploadFile = File(..., description="Document file binary (PDF, PNG, JPG)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.vault.service import read_upload_file_bounded

    file_bytes = await read_upload_file_bounded(file)
    mime_type = file.content_type or "application/octet-stream"

    return upload_user_document(
        db=db,
        user_id=current_user.id,
        document_type=document_type,
        file_name=file.filename or "uploaded_document",
        file_bytes=file_bytes,
        mime_type=mime_type,
        document_number_masked=document_number_masked,
        household_member_id=household_member_id,
    )


@router.get(
    "/documents",
    response_model=list[UserDocumentResponse],
    summary="List citizen's vault documents",
    description="Returns all uploaded documents in the citizen's vault with fresh 1-hour presigned download URLs, optionally filtered by family member.",
    response_description="List of citizen vault documents",
)
def list_my_vault_documents_endpoint(
    household_member_id: int | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_documents(
        db=db,
        user_id=current_user.id,
        household_member_id=household_member_id,
    )


@router.get(
    "/documents/{document_id}/download",
    summary="Download or view a citizen vault document",
    description="Redirects directly to a secure presigned S3/MinIO URL for RAM-free direct browser download.",
)
def download_vault_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import RedirectResponse
    from sqlalchemy import select
    from app.core.exceptions import EntityNotFoundError
    from app.core.storage import storage_service
    from app.modules.vault.models import UserDocument

    doc = db.scalar(
        select(UserDocument).where(
            UserDocument.id == document_id,
            UserDocument.user_id == current_user.id,
        )
    )
    if not doc:
        raise EntityNotFoundError("UserDocument", document_id)

    presigned_url = storage_service.generate_presigned_download_url(doc.file_key)
    return RedirectResponse(
        url=presigned_url,
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )


@router.delete(
    "/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a vault document",
    description="Deletes a document permanently from S3 object storage and removes its record from the database.",
)
def delete_vault_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_user_document(db=db, user_id=current_user.id, document_id=document_id)
    return None


@router.get(
    "/readiness/schemes/{scheme_id}",
    response_model=SchemeDocumentReadinessResponse,
    summary="Evaluate document application readiness for a target scheme",
    description="Compares the citizen's uploaded vault documents against the scheme's mandatory and optional document requirements. Returns a percentage readiness score and actionable checklist.",
    response_description="Document readiness score and checklist (available vs missing)",
)
def get_scheme_document_readiness_endpoint(
    scheme_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return evaluate_document_readiness(
        db=db, user_id=current_user.id, scheme_id=scheme_id
    )


@router.post(
    "/documents/{document_id}/extract-facts",
    response_model=ExtractedDocumentFactsResponse,
    summary="Extract demographic facts from vault document (Gemini 3.5 Flash Vision)",
    description="Runs Multimodal Vision LLM extraction on an existing vault document in S3 to extract document-specific facts (e.g. DOB, Gender, State from Aadhaar; Income from Income Certificate).",
    response_description="Detected facts and confidence score for citizen verification",
)
def extract_facts_from_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return extract_facts_from_user_document(
        db=db, user_id=current_user.id, document_id=document_id
    )


@router.post(
    "/documents/{document_id}/confirm-and-sync-profile",
    response_model=ConfirmFactsAndSyncProfileResponse,
    summary="Citizen confirmation: Merge verified facts into Profile",
    description="Applies citizen-verified / edited facts to their SQL database profile, progressively enriching demographic data and recalculating scheme eligibility.",
    response_description="Sync status and updated profile object",
)
def confirm_and_sync_profile_endpoint(
    document_id: int,
    payload: ConfirmFactsAndSyncProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return confirm_and_sync_profile_from_facts(
        db=db,
        user_id=current_user.id,
        payload=payload,
        document_id=document_id,
    )


@router.post(
    "/extract-quick",
    response_model=ExtractedDocumentFactsResponse,
    summary="1-Click Auto-Fill: Extract facts from uploaded file (Aadhaar/PAN/Income)",
    description="Delegates to the dedicated OCR extraction module.",
    response_description="Extracted facts for instant form population",
    include_in_schema=False,
)
async def extract_quick_endpoint(
    file: UploadFile = File(..., description="Aadhaar, PAN, or Certificate binary"),
    document_type: str | None = Form(None, description="Optional document type hint"),
    authorization: str | None = Header(None, description="Optional Bearer token to auto-save to Vault"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.modules.ocr.router import extract_facts_endpoint

    return await extract_facts_endpoint(
        file=file,
        document_type=document_type,
        authorization=authorization,
        db=db,
    )
