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

    return get_gov_feed(source_key)


# --- MyScheme Automated Ingestion Endpoint ---

from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db
from app.modules.ingestion.myscheme_scraper import parse_myscheme_text_or_markdown, save_parsed_scheme_to_db_and_okf


class MySchemeIngestRequest(BaseModel):
    raw_content: str
    slug_override: str | None = None


class MySchemeIngestResponse(BaseModel):
    id: int
    slug: str
    name: str
    category: str
    state: str
    benefits_count: int
    rules_count: int
    okf_file_path: str


@router.post(
    "/ingest/myscheme-text",
    response_model=MySchemeIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Parse raw MyScheme scheme text and ingest into DB + OKF",
    description="Accepts raw text or markdown from MyScheme.gov.in, automatically parses all 8 canonical sections, inserts into PostgreSQL, and generates the OKF Markdown file.",
    response_description="Ingested scheme summary and OKF file path",
)
def ingest_myscheme_text_endpoint(
    payload: MySchemeIngestRequest,
    db: Session = Depends(get_db),
):
    parsed = parse_myscheme_text_or_markdown(
        raw_text=payload.raw_content, fallback_slug=payload.slug_override
    )
    scheme = save_parsed_scheme_to_db_and_okf(db=db, parsed=parsed)
    return MySchemeIngestResponse(
        id=scheme.id,
        slug=scheme.slug,
        name=scheme.name,
        category=scheme.category,
        state=scheme.state,
        benefits_count=len(scheme.benefits),
        rules_count=len(scheme.eligibility_rules),
        okf_file_path=f"knowledge/schemes/{scheme.slug}.md",
    )

