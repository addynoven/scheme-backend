from fastapi import APIRouter, Depends, File, Form, Header, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_db
from app.core.security import decode_token
from app.modules.ocr.schemas import ExtractedDocumentFactsResponse
from app.modules.ocr.service import extract_document_facts_pipeline

router = APIRouter(prefix="/ocr", tags=["Multimodal Vision & OCR"])


@router.post(
    "/extract",
    response_model=ExtractedDocumentFactsResponse,
    summary="1-Click Auto-Fill & Document Fact Extraction",
    description="Accepts an image or PDF upload (Aadhaar, PAN, Income Certificate, etc.) and runs Multimodal Vision LLM extraction (Gemini 3.5 Flash) to return structured citizen demographic facts for 1-click onboarding. If a citizen Bearer token is provided, the document is also automatically persisted into their S3 Document Vault.",
    response_description="Structured facts extracted strictly from document content",
)
async def extract_facts_endpoint(
    file: UploadFile = File(..., description="Aadhaar, PAN, or Certificate binary (image/pdf)"),
    document_type: str | None = Form(None, description="Optional document type hint"),
    authorization: str | None = Header(None, description="Optional Bearer token to auto-save document to citizen's vault"),
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException, status
    from app.core.config import settings
    from app.modules.chat.rate_limit import check_rate_limit
    from app.modules.vault.service import read_upload_file_bounded

    client_id = "anon_ocr"
    if authorization and authorization.startswith("Bearer "):
        try:
            tok = authorization.split(" ")[1]
            p = decode_token(tok)
            if p and "sub" in p:
                client_id = f"user_{p['sub']}"
        except Exception:
            pass

    if not getattr(settings, "TESTING", False) and not check_rate_limit(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before uploading another document.",
        )

    file_bytes = await read_upload_file_bounded(file)
    mime_type = file.content_type or "application/octet-stream"
    file_name = file.filename or "uploaded_document"

    result = extract_document_facts_pipeline(
        file_bytes=file_bytes,
        mime_type=mime_type,
        document_type_hint=document_type,
        file_name=file_name,
    )

    # If citizen is logged in, auto-save to S3 Document Vault
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_token(token)
        if payload and "sub" in payload:
            try:
                from app.modules.vault.service import upload_user_document

                user_id = int(payload["sub"])
                saved_doc = upload_user_document(
                    db=db,
                    user_id=user_id,
                    document_type=result.detected_document_type or document_type or "Identity Document",
                    file_name=file_name,
                    file_bytes=file_bytes,
                    mime_type=mime_type,
                    document_number_masked=result.extracted_facts.document_number_masked,
                )
                result.document_id = saved_doc.id
            except Exception:
                pass

    return result
