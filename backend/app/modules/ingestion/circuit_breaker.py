import json
import logging
from datetime import datetime
from typing import Any

from app.core.storage import storage_service

logger = logging.getLogger("app.ingestion.circuit_breaker")


class CircuitBreakerError(Exception):
    """Raised when an incoming government payload fails structural sanity checks."""
    pass


def validate_payload_structure(
    raw_content: bytes,
    source_key: str,
) -> list[dict[str, Any]]:
    """
    Validates structural integrity of an incoming government payload:
    1. Rejects HTML error pages masquerading under HTTP 200.
    2. Verifies JSON parseability.
    3. Verifies non-empty list of scheme items.
    4. Verifies mandatory fields exist on items.
    
    If structural corruption is detected, automatically quarantines the blob in S3
    and raises CircuitBreakerError to prevent database corruption.
    """
    text_content = raw_content.decode("utf-8", errors="replace").strip()

    # 1. Reject HTML pages (e.g. Cloudflare / WAF / Gov portal login wall)
    lower_text = text_content[:500].lower()
    if "<!doctype html" in lower_text or "<html" in lower_text or "<head" in lower_text:
        _quarantine_blob(raw_content, source_key, "HTML_PAYLOAD_DETECTED")
        raise CircuitBreakerError(
            f"Gate 2 tripped: Received HTML page instead of JSON dataset from source '{source_key}'."
        )

    # 2. Parse JSON
    try:
        data = json.loads(text_content)
    except Exception as e:
        _quarantine_blob(raw_content, source_key, "INVALID_JSON_SYNTAX")
        raise CircuitBreakerError(
            f"Gate 2 tripped: JSON syntax error in source '{source_key}': {e}"
        )

    # 3. Normalize into list of schemes
    if isinstance(data, dict):
        schemes = data.get("schemes") or data.get("data") or data.get("records")
        if not schemes and "name" in data:
            schemes = [data]
    elif isinstance(data, list):
        schemes = data
    else:
        schemes = None

    if not isinstance(schemes, list) or len(schemes) == 0:
        _quarantine_blob(raw_content, source_key, "EMPTY_DATASET")
        raise CircuitBreakerError(
            f"Gate 2 tripped: Dataset from source '{source_key}' is empty or has invalid list structure."
        )

    # 4. Check essential fields
    valid_count = 0
    for s in schemes:
        if isinstance(s, dict) and s.get("name") and (s.get("description") or s.get("ministry")):
            valid_count += 1

    if valid_count == 0 or (valid_count / len(schemes)) < 0.5:
        _quarantine_blob(raw_content, source_key, "MISSING_ESSENTIAL_FIELDS")
        raise CircuitBreakerError(
            f"Gate 2 tripped: >50% of items in source '{source_key}' are missing essential fields (name, ministry, description)."
        )

    return schemes


def _quarantine_blob(raw_content: bytes, source_key: str, reason: str) -> None:
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    object_key = f"ingestion_quarantine/{source_key}/{timestamp}_{reason}.raw"
    try:
        storage_service.upload_bytes(
            file_bytes=raw_content,
            object_key=object_key,
            content_type="text/plain",
        )
        logger.warning(f"Corrupted payload quarantined to S3: {object_key}")
    except Exception as e:
        logger.error(f"Failed to quarantine corrupted blob to S3: {e}")
