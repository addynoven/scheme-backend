from datetime import datetime, timezone
import logging
import time
from typing import Any
import httpx
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import EntityNotFoundError
from app.core.storage import storage_service
from app.models.benefit import Benefit
from app.models.eligibility_rule import EligibilityRule
from app.models.ingestion_source import IngestionSource
from app.models.ingestion_triage import IngestionTriageItem
from app.models.required_document import RequiredDocument
from app.models.scheme import Scheme
from app.schemas.ingestion import IngestionSyncRunResult
from app.services.ingestion.circuit_breaker import (
    CircuitBreakerError,
    validate_payload_structure,
)
from app.services.ingestion.diff_classifier import classify_scheme_diff
from app.services.ingestion.semantic_hasher import compute_semantic_hash

logger = logging.getLogger("app.ingestion.service")


def get_or_create_default_sources(db: Session) -> list[IngestionSource]:
    defaults = [
        {
            "source_key": "data_gov_in_welfare",
            "name": "Data.gov.in National Welfare Schemes API",
            "endpoint_url": "https://api.data.gov.in/resource/welfare-schemes-v1.json",
            "source_type": "json_feed",
            "status": "active",
        },
        {
            "source_key": "mp_state_portal",
            "name": "Madhya Pradesh State Welfare Portal Feed",
            "endpoint_url": "https://mpwelfare.gov.in/api/v1/schemes.json",
            "source_type": "json_feed",
            "status": "active",
        },
        {
            "source_key": "mh_state_portal",
            "name": "Maharashtra State Welfare Feed",
            "endpoint_url": "https://mahaschemes.maharashtra.gov.in/api/v1/feed.json",
            "source_type": "json_feed",
            "status": "active",
        },
    ]

    for d in defaults:
        existing = db.scalar(
            select(IngestionSource).where(IngestionSource.source_key == d["source_key"])
        )
        if not existing:
            source = IngestionSource(**d)
            db.add(source)

    try:
        db.commit()
    except Exception:
        db.rollback()

    return list(db.scalars(select(IngestionSource).order_by(IngestionSource.id)).all())


def run_ingestion_pipeline(
    db: Session,
    source_key: str | None = None,
    client: httpx.Client | None = None,
) -> list[IngestionSyncRunResult]:
    sources = get_or_create_default_sources(db)
    if source_key:
        sources = [s for s in sources if s.source_key == source_key]
        if not sources:
            raise EntityNotFoundError("IngestionSource", source_key)

    results: list[IngestionSyncRunResult] = []
    for source in sources:
        res = _process_single_source(db=db, source=source, client=client)
        results.append(res)

    return results


def _process_single_source(
    db: Session,
    source: IngestionSource,
    client: httpx.Client | None = None,
) -> IngestionSyncRunResult:
    start_time = time.perf_counter()

    # 1. GATE 1: ZERO-BANDWIDTH RFC 7232 HTTP CHECK
    headers = {
        "User-Agent": "SchemeDiscovery-GovIngestion/1.5 (+https://schemediscovery.gov.in)",
        "Accept": "application/json",
    }
    if source.etag:
        headers["If-None-Match"] = source.etag
    if source.last_modified_header:
        headers["If-Modified-Since"] = source.last_modified_header

    http_client = client or httpx.Client(timeout=10.0)
    try:
        try:
            resp = http_client.get(source.endpoint_url, headers=headers)
        except Exception as e:
            source.failure_count += 1
            source.status = "error"
            source.last_checked_at = datetime.now(timezone.utc)
            db.commit()
            duration_ms = (time.perf_counter() - start_time) * 1000
            return IngestionSyncRunResult(
                source_key=source.source_key,
                status="network_error",
                http_status=None,
                bytes_downloaded=0,
                message=f"Network connection failed: {e}",
                duration_ms=duration_ms,
            )

        # Handle HTTP 304 Not Modified
        if resp.status_code == 304:
            source.last_checked_at = datetime.now(timezone.utc)
            source.failure_count = 0
            source.status = "healthy"
            db.commit()
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"Gate 1 [304]: Source '{source.source_key}' unchanged. 0 bytes downloaded.")
            return IngestionSyncRunResult(
                source_key=source.source_key,
                status="unchanged_304",
                http_status=304,
                bytes_downloaded=0,
                message="HTTP 304 Not Modified. Source payload unchanged on government server.",
                duration_ms=duration_ms,
            )

        if resp.status_code != 200:
            source.failure_count += 1
            source.status = "degraded"
            source.last_checked_at = datetime.now(timezone.utc)
            db.commit()
            duration_ms = (time.perf_counter() - start_time) * 1000
            return IngestionSyncRunResult(
                source_key=source.source_key,
                status="http_error",
                http_status=resp.status_code,
                bytes_downloaded=len(resp.content),
                message=f"Received non-200 HTTP status {resp.status_code}",
                duration_ms=duration_ms,
            )

        raw_bytes = resp.content
        bytes_downloaded = len(raw_bytes)

        # 2. STAGE 1: MINIO S3 RAW SNAPSHOT BLOB
        timestamp_str = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        s3_key = f"ingestion_raw/{source.source_key}/{timestamp_str}.json"
        try:
            storage_service.upload_bytes(
                file_bytes=raw_bytes,
                object_key=s3_key,
                content_type="application/json",
            )
        except Exception as e:
            logger.warning(f"Failed to archive raw blob to S3: {e}")

        # 3. GATE 2: CIRCUIT BREAKER
        try:
            incoming_schemes = validate_payload_structure(raw_bytes, source.source_key)
            source.failure_count = 0
            source.status = "healthy"
        except CircuitBreakerError as e:
            source.failure_count += 1
            source.status = "degraded"
            source.last_checked_at = datetime.now(timezone.utc)
            db.commit()
            duration_ms = (time.perf_counter() - start_time) * 1000
            return IngestionSyncRunResult(
                source_key=source.source_key,
                status="circuit_broken",
                http_status=200,
                bytes_downloaded=bytes_downloaded,
                raw_s3_key=s3_key,
                message=str(e),
                duration_ms=duration_ms,
            )

        # 4. GATE 3: SEMANTIC HASH DIFF
        computed_hash = compute_semantic_hash(incoming_schemes)
        if source.content_hash == computed_hash:
            # 0 business diffs
            source.etag = resp.headers.get("ETag", source.etag)
            source.last_modified_header = resp.headers.get("Last-Modified", source.last_modified_header)
            source.last_checked_at = datetime.now(timezone.utc)
            db.commit()
            duration_ms = (time.perf_counter() - start_time) * 1000
            logger.info(f"Gate 3 [Hash Match]: Source '{source.source_key}' 0 semantic changes.")
            return IngestionSyncRunResult(
                source_key=source.source_key,
                status="hash_matched_0_diff",
                http_status=200,
                bytes_downloaded=bytes_downloaded,
                raw_s3_key=s3_key,
                semantic_hash=computed_hash,
                message="Semantic SHA-256 matched. Zero business differences found.",
                duration_ms=duration_ms,
            )

        # 5. CLASSIFY CHANGES & STAGING BATCH WRITE
        schemes_created = 0
        schemes_updated = 0
        breaking_changes_triaged = 0

        for incoming in incoming_schemes:
            slug = incoming.get("slug") or incoming.get("name", "").lower().replace(" ", "-")
            existing = db.scalar(select(Scheme).where(Scheme.slug == slug))

            existing_dict = _scheme_to_dict(existing) if existing else None
            diff = classify_scheme_diff(existing_dict, incoming)

            if not diff:
                continue

            if diff.is_breaking:
                # Route to Admin Triage Queue
                triage_item = IngestionTriageItem(
                    source_id=source.id,
                    scheme_slug=slug,
                    scheme_name=diff.scheme_name,
                    change_type=diff.change_type,
                    impact_level=diff.impact_level,
                    diff_summary=diff.summary,
                    diff_payload={
                        "before_state": diff.before_state,
                        "after_state": diff.after_state,
                    },
                    status="pending_review",
                )
                db.add(triage_item)
                breaking_changes_triaged += 1
            else:
                # Non-breaking -> Auto-apply to database
                if diff.is_new:
                    _create_new_scheme_from_payload(db, incoming)
                    schemes_created += 1
                else:
                    _apply_non_breaking_scheme_update(db, existing, incoming)
                    schemes_updated += 1

        # Update source tracking headers
        source.content_hash = computed_hash
        source.etag = resp.headers.get("ETag", source.etag)
        source.last_modified_header = resp.headers.get("Last-Modified", source.last_modified_header)
        source.last_checked_at = datetime.now(timezone.utc)
        source.last_synced_at = datetime.now(timezone.utc)

        db.commit()

        duration_ms = (time.perf_counter() - start_time) * 1000
        sync_status = "routed_to_triage" if breaking_changes_triaged > 0 else "synced_auto_approved"

        return IngestionSyncRunResult(
            source_key=source.source_key,
            status=sync_status,
            http_status=200,
            bytes_downloaded=bytes_downloaded,
            raw_s3_key=s3_key,
            semantic_hash=computed_hash,
            schemes_created=schemes_created,
            schemes_updated=schemes_updated,
            breaking_changes_triaged=breaking_changes_triaged,
            message=f"Sync complete: {schemes_created} created, {schemes_updated} updated, {breaking_changes_triaged} breaking changes routed to triage.",
            duration_ms=duration_ms,
        )

    finally:
        if not client:
            http_client.close()


def _scheme_to_dict(scheme: Scheme) -> dict[str, Any]:
    return {
        "id": scheme.id,
        "name": scheme.name,
        "slug": scheme.slug,
        "state": scheme.state,
        "category": scheme.category,
        "ministry": scheme.ministry,
        "description": scheme.description,
        "status": scheme.status,
        "application_url": scheme.application_url,
        "official_website": scheme.official_website,
        "eligibility_rules": [
            {
                "field_name": r.field_name,
                "operator": r.operator,
                "rule_value": r.rule_value,
            }
            for r in scheme.eligibility_rules
        ],
        "benefits": [
            {
                "title": b.title,
                "description": b.description,
            }
            for b in scheme.benefits
        ],
        "required_documents": [
            {
                "document_name": d.document_name,
                "is_mandatory": d.is_mandatory,
                "description": d.description,
            }
            for d in scheme.required_documents
        ],
    }


def _create_new_scheme_from_payload(db: Session, data: dict[str, Any]) -> Scheme:
    slug = data.get("slug") or data.get("name", "").lower().replace(" ", "-")
    scheme = Scheme(
        name=data.get("name", "Untitled Scheme"),
        slug=slug,
        state=data.get("state", "ALL_INDIA"),
        category=data.get("category", "General"),
        ministry=data.get("ministry", "Government of India"),
        description=data.get("description", ""),
        status=data.get("status", "Active"),
        application_url=data.get("application_url"),
        official_website=data.get("official_website"),
    )
    db.add(scheme)
    db.flush()

    for r in data.get("eligibility_rules", []):
        rule_val = str(r.get("rule_value") or r.get("value_criteria") or "")
        db.add(
            EligibilityRule(
                scheme_id=scheme.id,
                field_name=r.get("field_name", "custom_field"),
                operator=r.get("operator", "="),
                rule_value=rule_val,
            )
        )

    for b in data.get("benefits", []):
        title = b.get("title") or b.get("benefit_type") or "Benefit"
        db.add(
            Benefit(
                scheme_id=scheme.id,
                title=title,
                description=b.get("description", ""),
            )
        )

    for d in data.get("required_documents", []):
        db.add(
            RequiredDocument(
                scheme_id=scheme.id,
                document_name=d.get("document_name", "Required Document"),
                is_mandatory=bool(d.get("is_mandatory", True)),
                description=d.get("description", ""),
            )
        )

    return scheme


def _apply_non_breaking_scheme_update(
    db: Session, scheme: Scheme, data: dict[str, Any]
) -> None:
    if "description" in data:
        scheme.description = data["description"]
    if "application_url" in data:
        scheme.application_url = data["application_url"]
    if "official_website" in data:
        scheme.official_website = data["official_website"]
    if "ministry" in data:
        scheme.ministry = data["ministry"]
    if "category" in data:
        scheme.category = data["category"]

    # Add new benefits
    for b in data.get("benefits", []):
        b_title = b.get("title") or b.get("benefit_type") or "Benefit"
        target = next((x for x in scheme.benefits if x.title.lower() == b_title.lower()), None)
        if target:
            target.description = b.get("description", target.description)
        else:
            db.add(
                Benefit(
                    scheme_id=scheme.id,
                    title=b_title,
                    description=b.get("description", ""),
                )
            )

    # Add optional documents
    for d in data.get("required_documents", []):
        doc_name = d.get("document_name", "").lower()
        target = next((x for x in scheme.required_documents if x.document_name.lower() == doc_name), None)
        if not target and not d.get("is_mandatory", True):
            db.add(
                RequiredDocument(
                    scheme_id=scheme.id,
                    document_name=d.get("document_name", "Optional Document"),
                    is_mandatory=False,
                    description=d.get("description", ""),
                )
            )
