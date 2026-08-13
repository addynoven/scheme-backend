"""
Open Government Data Feeds Router (V1.5).
Serves official dataset endpoints for National and State Government Portals with RFC 7232 ETag support.
"""

from fastapi import APIRouter, Header, Response, status
from fastapi.responses import JSONResponse, PlainTextResponse

from app.services.ingestion.open_gov_data import (
    REAL_GOV_FEEDS,
    get_feed_etag,
    get_gov_feed,
)

router = APIRouter(prefix="/open-data", tags=["Open Government Data Feeds"])


@router.get("/feeds/{source_key}")
def get_government_feed(
    source_key: str,
    if_none_match: str | None = Header(None, alias="if-none-match"),
    corrupt: bool = False,
):
    """
    Public open government welfare schemes feed endpoint.
    Complies with RFC 7232 Zero-Bandwidth caching (HTTP 304 on matching ETag).
    """
    data = get_gov_feed(source_key)
    if not data:
        return JSONResponse(
            status_code=404,
            content={"error": "FEED_NOT_FOUND", "message": f"Source feed '{source_key}' not found"},
        )

    if corrupt:
        # Returns corrupted HTML error page to test Gate 2 circuit breaker
        return PlainTextResponse(
            content="<html><head><title>502 Bad Gateway Cloudflare</title></head><body><h1>502 Bad Gateway</h1></body></html>",
            status_code=status.HTTP_200_OK,
            media_type="text/html",
        )

    etag = get_feed_etag(source_key)

    # Gate 1: Check conditional ETag
    if if_none_match and if_none_match.strip() == etag.strip():
        return Response(
            status_code=status.HTTP_304_NOT_MODIFIED,
            headers={
                "ETag": etag,
                "Cache-Control": "public, max-age=3600, must-revalidate",
            },
        )

    data = get_gov_feed(source_key)
    return JSONResponse(
        content=data,
        status_code=status.HTTP_200_OK,
        headers={
            "ETag": etag,
            "Cache-Control": "public, max-age=3600, must-revalidate",
            "Last-Modified": "Wed, 13 Aug 2026 00:00:00 GMT",
        },
    )
