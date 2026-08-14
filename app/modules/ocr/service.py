import base64
import json
import logging
import re
import urllib.error
import urllib.request
from datetime import datetime

from app.core.config import settings
from app.modules.ocr.prompts import EXTRACTION_USER_PROMPT, SYSTEM_PROMPT
from app.modules.ocr.schemas import (
    ExtractedDocumentFacts,
    ExtractedDocumentFactsResponse,
)

logger = logging.getLogger(__name__)


def _sanitize_json_text(raw_text: str) -> str:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n", "", cleaned)
        cleaned = re.sub(r"\n```$", "", cleaned)
    return cleaned.strip()


def _normalize_extracted_facts(raw_facts: dict) -> ExtractedDocumentFacts:
    dob = raw_facts.get("date_of_birth")
    age = raw_facts.get("age")

    if dob and not age:
        try:
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
                try:
                    dt = datetime.strptime(dob, fmt)
                    now = datetime.now()
                    calculated_age = now.year - dt.year - ((now.month, now.day) < (dt.month, dt.day))
                    if 0 < calculated_age < 120:
                        age = calculated_age
                    dob = dt.strftime("%Y-%m-%d")
                    break
                except ValueError:
                    continue
        except Exception:
            pass

    income = raw_facts.get("annual_income")
    if income is not None:
        try:
            income = int(str(income).replace(",", "").replace("₹", "").replace("/-", "").strip())
        except (ValueError, TypeError):
            income = None

    gender = raw_facts.get("gender")
    if gender:
        gender = str(gender).lower().strip()
        if gender in ("m", "male", "purush"):
            gender = "male"
        elif gender in ("f", "female", "mahila", "stree"):
            gender = "female"
        elif gender not in ("male", "female", "other"):
            gender = None

    return ExtractedDocumentFacts(
        full_name=raw_facts.get("full_name"),
        date_of_birth=dob,
        age=age,
        gender=gender,
        state=raw_facts.get("state"),
        district=raw_facts.get("district"),
        annual_income=income,
        occupation=raw_facts.get("occupation"),
        caste_category=raw_facts.get("caste_category"),
        has_land=raw_facts.get("has_land"),
        is_differently_abled=raw_facts.get("is_differently_abled"),
        document_number_masked=raw_facts.get("document_number_masked"),
    )


def extract_facts_with_gemini_vision(
    file_bytes: bytes,
    mime_type: str = "image/jpeg",
    document_type_hint: str | None = None,
) -> ExtractedDocumentFactsResponse:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured in environment.")

    model = settings.GEMINI_MODEL or "gemini-3.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    b64_data = base64.b64encode(file_bytes).decode("utf-8")
    hint_text = f"\nUser Hint: The user claims this is a '{document_type_hint}'." if document_type_hint else ""

    payload = {
        "system_instruction": {
            "parts": [{"text": SYSTEM_PROMPT}]
        },
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type if mime_type in ("image/jpeg", "image/png", "image/webp", "application/pdf") else "image/jpeg",
                            "data": b64_data,
                        }
                    },
                    {
                        "text": EXTRACTION_USER_PROMPT + hint_text
                    },
                ]
            }
        ],
        "generationConfig": {
            "response_mime_type": "application/json",
            "temperature": 0.1,
        },
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-goog-api-key": settings.GEMINI_API_KEY,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp_data = json.loads(resp.read().decode("utf-8"))
            candidates = resp_data.get("candidates", [])
            if not candidates:
                raise ValueError("Gemini returned zero candidates.")

            raw_text = candidates[0]["content"]["parts"][0]["text"]
            cleaned_json = _sanitize_json_text(raw_text)
            parsed = json.loads(cleaned_json)

            detected_type = parsed.get("detected_document_type", document_type_hint or "Unknown Document")
            confidence = float(parsed.get("confidence_score", 0.90))
            summary = parsed.get("evidence_summary", "Extracted facts from document image.")
            raw_facts = parsed.get("extracted_facts", {})
            applicable_fields = parsed.get("applicable_profile_fields", [])

            normalized_facts = _normalize_extracted_facts(raw_facts)

            return ExtractedDocumentFactsResponse(
                status="success",
                detected_document_type=detected_type,
                confidence_score=min(max(confidence, 0.0), 1.0),
                evidence_summary=summary,
                extracted_facts=normalized_facts,
                applicable_profile_fields=applicable_fields,
            )
    except urllib.error.HTTPError as he:
        err_msg = he.read().decode("utf-8")
        logger.error(f"Gemini API HTTP Error {he.code}: {err_msg}")
        raise RuntimeError(f"Gemini Multimodal API Error: {he.code} - {err_msg}")
    except Exception as e:
        logger.error(f"Failed to extract facts via Gemini Vision: {str(e)}")
        raise


def extract_facts_from_raw_text_patterns(
    text_content: str,
    document_type_hint: str | None = None,
) -> ExtractedDocumentFactsResponse:
    """
    Pure regex pattern extractor on readable text without inventing fake personas.
    """
    facts = ExtractedDocumentFacts()
    applicable_fields: list[str] = []
    detected_type = document_type_hint or "Document"
    confidence = 0.0

    # PAN pattern: 5 uppercase letters, 4 digits, 1 uppercase letter
    pan_match = re.search(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b", text_content)
    if pan_match:
        detected_type = "PAN Card"
        pan = pan_match.group(1)
        facts.document_number_masked = f"{pan[:2]}XXXXX{pan[-2:]}"
        confidence = 0.85
        applicable_fields.append("document_number_masked")

    # Aadhaar pattern: 12 digits (often in 4-4-4 groups)
    aadhaar_match = re.search(r"\b(\d{4})[\s-](\d{4})[\s-](\d{4})\b", text_content)
    if aadhaar_match:
        detected_type = "Aadhaar Card"
        facts.document_number_masked = f"XXXX-XXXX-{aadhaar_match.group(3)}"
        confidence = 0.85
        applicable_fields.append("document_number_masked")

    # DOB pattern: DD/MM/YYYY or YYYY-MM-DD
    dob_match = re.search(r"\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}[/-]\d{2}[/-]\d{2})\b", text_content)
    if dob_match:
        facts.date_of_birth = dob_match.group(1)
        applicable_fields.append("date_of_birth")

    summary = (
        f"Extracted pattern-matched facts for {detected_type}."
        if applicable_fields
        else "No recognized government document patterns found in text."
    )

    return ExtractedDocumentFactsResponse(
        status="success" if applicable_fields else "unprocessed",
        detected_document_type=detected_type,
        confidence_score=confidence,
        evidence_summary=summary,
        extracted_facts=facts,
        applicable_profile_fields=applicable_fields,
    )


def extract_document_facts_pipeline(
    file_bytes: bytes,
    mime_type: str = "image/jpeg",
    document_type_hint: str | None = None,
    file_name: str | None = None,
) -> ExtractedDocumentFactsResponse:
    # 1. Primary: Gemini Multimodal Vision if key is available
    if settings.GEMINI_API_KEY:
        try:
            return extract_facts_with_gemini_vision(
                file_bytes=file_bytes,
                mime_type=mime_type,
                document_type_hint=document_type_hint,
            )
        except Exception as e:
            logger.warning(f"Gemini Vision extraction failed: {e}")

    # 2. Secondary: Real text pattern extraction if text stream is present
    try:
        text_content = file_bytes.decode("utf-8", errors="ignore")
        if text_content.strip():
            return extract_facts_from_raw_text_patterns(
                text_content=text_content,
                document_type_hint=document_type_hint,
            )
    except Exception:
        pass

    # 3. Default safe fallback: Return empty facts with 0.0 confidence (never fake identities)
    return ExtractedDocumentFactsResponse(
        status="unprocessed",
        detected_document_type=document_type_hint or "Document",
        confidence_score=0.0,
        evidence_summary="Could not extract facts from document. Please review and input your details manually.",
        extracted_facts=ExtractedDocumentFacts(),
        applicable_profile_fields=[],
    )
