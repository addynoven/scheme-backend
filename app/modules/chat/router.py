from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_current_user_optional, get_db
from app.modules.auth.models import User
from app.modules.chat.schemas import (
    ChatMessageCreate,
    ChatMessageResponse,
    ChatSessionCreate,
    ChatSessionResponse,
)
from app.modules.chat.service import (
    create_chat_session,
    get_chat_session,
    list_chat_sessions,
    send_chat_message,
    stream_chat_response,
)

router = APIRouter(prefix="/chat", tags=["Conversational Chat Assistant"])


@router.post("/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_session_endpoint(
    payload: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Create a new conversational chat session (Authenticated or Guest)."""
    user_id = current_user.id if current_user else None
    return create_chat_session(db, user_id, payload)


@router.get("/sessions", response_model=list[ChatSessionResponse])
def list_sessions_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all previous chat sessions for the authenticated citizen."""
    return list_chat_sessions(db, current_user.id)


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_session_endpoint(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Retrieve full chat history for a session."""
    user_id = current_user.id if current_user else None
    return get_chat_session(db, session_id, user_id)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse)
def send_message_endpoint(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Send message in a chat session and get synchronous response with citations."""
    user_id = current_user.id if current_user else None
    return send_chat_message(
        db=db,
        session_id=session_id,
        user_id=user_id,
        content=payload.content,
        language_code=payload.language_code,
    )


@router.post("/sessions/{session_id}/messages/stream")
async def stream_message_endpoint(
    session_id: int,
    payload: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """Send message and receive real-time Server-Sent Events (SSE) token stream."""
    user_id = current_user.id if current_user else None
    return StreamingResponse(
        stream_chat_response(db, session_id, user_id, payload.content),
        media_type="text/event-stream",
    )
