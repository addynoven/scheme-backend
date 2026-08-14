from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1)
    language_code: str | None = "en"


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    sender: str
    content: str
    intent: str | None = None
    citations: list[str] = Field(default_factory=list)
    created_at: datetime


class ChatSessionCreate(BaseModel):
    title: str | None = "New Welfare Conversation"
    language_code: str | None = "en"


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    title: str
    language_code: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = Field(default_factory=list)
