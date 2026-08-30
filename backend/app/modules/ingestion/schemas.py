from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class IngestionSourceBase(BaseModel):
    source_key: str = Field(..., description="Unique slug key for feed source")
    name: str = Field(..., description="Human-readable source name")
    endpoint_url: str = Field(..., description="Feed target URL")
    source_type: str = Field("json_feed", description="Source format: rest_api, json_feed, csv_feed")
    status: str = Field("active", description="Status: active, paused, degraded")


class IngestionSourceCreate(IngestionSourceBase):
    pass


class IngestionSourceUpdate(BaseModel):
    name: str | None = None
    endpoint_url: str | None = None
    source_type: str | None = None
    status: str | None = None


class IngestionSourceResponse(IngestionSourceBase):
    id: int
    etag: str | None = None
    last_modified_header: str | None = None
    content_hash: str | None = None
    failure_count: int
    last_checked_at: datetime | None = None
    last_synced_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IngestionTriageItemResponse(BaseModel):
    id: int
    source_id: int
    scheme_slug: str
    scheme_name: str
    change_type: str
    impact_level: str
    diff_summary: str
    diff_payload: dict[str, Any]
    status: str
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IngestionSyncRunResult(BaseModel):
    source_key: str
    status: str  # unchanged_304, hash_matched_0_diff, synced_auto_approved, routed_to_triage, error, circuit_broken
    http_status: int | None = None
    bytes_downloaded: int = 0
    raw_s3_key: str | None = None
    semantic_hash: str | None = None
    schemes_created: int = 0
    schemes_updated: int = 0
    breaking_changes_triaged: int = 0
    message: str
    duration_ms: float


class IngestionTriageActionRequest(BaseModel):
    action: str = Field(..., description="'approve' or 'reject'")
    notes: str | None = Field(None, description="Optional reviewer justification notes")

