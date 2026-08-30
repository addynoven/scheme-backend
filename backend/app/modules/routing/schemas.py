from enum import Enum
from typing import Any
from pydantic import BaseModel, Field


class RouteType(str, Enum):
    SQL_RULES = "sql_rules"
    OKF_CANONICAL = "okf_canonical"
    HYBRID_RAG = "hybrid_rag"
    MULTI_SOURCE = "multi_source"


class SQLWorkerPayload(BaseModel):
    state: str | None = None
    age: int | None = None
    annual_income: float | None = None
    gender: str | None = None
    occupation: str | None = None
    caste_category: str | None = None
    category: str | None = None


class DecomposedQueryPlan(BaseModel):
    original_query: str
    detected_language: str = Field(default="en", description="Language code: en, hi, mr, ta, hinglish")
    canonical_english_intent: str = Field(description="Normalized structured English query")
    route_target: RouteType
    sql_payload: SQLWorkerPayload | None = None
    okf_target_paths: list[str] = Field(default_factory=list, description="Target OKF markdown paths")
    web_agent_query: str | None = None
    confidence: float = 0.95


class SynthesizerContext(BaseModel):
    original_query: str
    chat_history: list[dict[str, str]] = Field(default_factory=list)
    detected_language: str = "en"
    sql_eligibility_matches: list[dict[str, Any]] = Field(default_factory=list)
    okf_documents_content: list[dict[str, str]] = Field(default_factory=list)
    web_agent_live_facts: str | None = None


class QueryRouteRequest(BaseModel):
    query: str
    user_profile: dict[str, Any] | None = None
    chat_history: list[dict[str, str]] | None = None


class QueryRouteResponse(BaseModel):
    query: str
    route_used: RouteType
    plan: DecomposedQueryPlan
    response_text: str
    citations: list[str]
    matched_schemes: list[dict[str, Any]] = Field(default_factory=list)
