from typing import Any
from fastapi import APIRouter, Header, HTTPException, Response, status

from app.modules.ingestion.open_data import REAL_GOV_FEEDS, get_feed_etag, get_gov_feed

router = APIRouter(prefix="/open-data", tags=["Open Government Data Feeds (Mock Gov Portals)"])


@router.get(
    "/feeds/{source_key}",
    summary="Fetch official government open data feed",
    description="Simulates official government welfare data endpoints (data.gov.in, State Portals, MyScheme). Implements RFC 7232 Zero-Bandwidth caching (ETag & 304 Not Modified).",
    response_description="Array of official welfare scheme datasets",
)
def get_government_feed_endpoint(
    source_key: str,
    response: Response,
    if_none_match: str | None = Header(None, alias="if-none-match"),
) -> list[dict[str, Any]]:
    if source_key not in REAL_GOV_FEEDS and source_key != "bulk_gov_welfare_catalog":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Government feed source '{source_key}' not found",
        )

    current_etag = get_feed_etag(source_key)
    response.headers["ETag"] = current_etag
    response.headers["Cache-Control"] = "public, max-age=300"

    # RFC 7232 Check
    if if_none_match and if_none_match.strip() == current_etag:
        response.status_code = status.HTTP_304_NOT_MODIFIED
        return []

    return get_gov_feed(source_key)
