from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.document_vault import (
    SchemeDocumentReadinessResponse,
    UserDocumentResponse,
)
from app.services.document_vault import (
    delete_user_document,
    evaluate_document_readiness,
    get_user_document_content,
    list_user_documents,
    upload_user_document,
)

router = APIRouter(prefix="/vault", tags=["Document Vault & Readiness"])


@router.post(
    "/documents/upload",
    response_model=UserDocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload citizen document to vault",
    description="Uploads a PDF or image document (e.g. Aadhaar Card, Bank Passbook, Land Records) to MinIO/S3 object storage and associates it with the authenticated citizen.",
    response_description="Saved document metadata and secure presigned download URL",
)
async def upload_document_endpoint(
    document_type: str = Form(..., description="Type of document e.g. 'Aadhaar Card', 'Bank Passbook', 'Land Records', 'Income Certificate'"),
    document_number_masked: str | None = Form(None, description="Optional masked document identifier e.g. 'XXXX-XXXX-4532'"),
    file: UploadFile = File(..., description="Document file binary (PDF, PNG, JPG)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    mime_type = file.content_type or "application/octet-stream"

    return upload_user_document(
        db=db,
        user_id=current_user.id,
        document_type=document_type,
        file_name=file.filename or "uploaded_document",
        file_bytes=file_bytes,
        mime_type=mime_type,
        document_number_masked=document_number_masked,
    )


@router.get(
    "/documents",
    response_model=list[UserDocumentResponse],
    summary="List citizen's vault documents",
    description="Returns all uploaded documents in the citizen's vault with fresh 1-hour presigned download URLs.",
    response_description="List of citizen vault documents",
)
def list_my_vault_documents_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_user_documents(db=db, user_id=current_user.id)


@router.get(
    "/documents/{document_id}/download",
    summary="Download or view a citizen vault document",
    description="Streams the decrypted document directly from secure S3 storage with inline disposition for browser viewing.",
)
def download_vault_document_endpoint(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from fastapi.responses import Response

    body_bytes, content_type, filename = get_user_document_content(
        db=db, user_id=current_user.id, document_id=document_id
    )
    return Response(
        content=body_bytes,
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
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
    scheme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return evaluate_document_readiness(
        db=db, user_id=current_user.id, scheme_id=scheme_id
    )
