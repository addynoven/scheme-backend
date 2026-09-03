from fastapi import APIRouter, Depends, File, UploadFile, WebSocket, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.database import SessionLocal
from app.modules.auth.models import User
from app.modules.voice.live_gateway import live_voice_gateway
from app.modules.voice.schemas import (
    VoiceChatResponse,
    VoiceSynthesisRequest,
    VoiceSynthesisResponse,
    VoiceTranscriptionResponse,
)
from app.modules.voice.service import voice_service
from app.modules.voice.tools import VOICE_AGENT_TOOLS

router = APIRouter(prefix="/voice", tags=["Voice-First Multilingual Speech Engine"])


@router.get("/tools")
def get_voice_agent_tools():
    """
    Returns MCP / Gemini-Compliant Tool Declarations for Live Voice RPC.
    """
    return {"tools": VOICE_AGENT_TOOLS}


@router.websocket("/live")
async def live_voice_websocket_endpoint(
    websocket: WebSocket,
    token: str | None = Query(None),
):
    """
    Real-Time Bidirectional Voice Call with Grounded Tool Calling (WebSocket Gateway).
    Requires a valid JWT access token supplied via ?token=<access_token>.
    """
    if not token:
        await websocket.close(code=4001, reason="Authentication token is required")
        return

    from app.core.security import decode_token
    from app.modules.auth.service import get_user_by_id

    try:
        payload = decode_token(token)
        if payload.get("type") == "refresh":
            await websocket.close(code=4001, reason="Invalid token type")
            return
        user_id_str = payload.get("sub") or payload.get("id")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token payload")
            return
        user_id = int(user_id_str)
    except Exception:
        await websocket.close(code=4001, reason="Could not validate credentials")
        return

    db = SessionLocal()
    try:
        user = get_user_by_id(db, user_id)
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return

        await live_voice_gateway.handle_client_session(
            websocket=websocket,
            db=db,
            current_user=user,
        )
    finally:
        db.close()


@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio_endpoint(
    file: UploadFile = File(...),
):
    """
    Transcribes audio note into text across 12+ Indic languages (Hindi, Marathi, Tamil, etc.).
    Supports .mp3, .wav, .m4a, .ogg, and .webm.
    """
    content = await file.read()
    return voice_service.transcribe_audio(
        audio_bytes=content,
        filename=file.filename or "audio.mp3",
        mime_type=file.content_type or "audio/mp3",
    )


@router.post("/chat", response_model=VoiceChatResponse)
async def voice_chat_endpoint(
    file: UploadFile = File(...),
    session_id: int | None = Query(None, description="Optional chat session ID for multi-turn voice memory"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    End-to-End Voice Chat: Upload voice question ➔ Audio STT ➔ Query Router ➔ Conversational Response.
    """
    from fastapi import HTTPException, status
    from app.core.config import settings
    from app.modules.chat.rate_limit import check_rate_limit

    client_id = f"user_{current_user.id}"
    if not getattr(settings, "TESTING", False) and not check_rate_limit(client_id):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a moment before sending another voice message.",
        )

    content = await file.read()
    return voice_service.execute_voice_chat(
        db=db,
        user_id=current_user.id,
        audio_bytes=content,
        filename=file.filename or "audio.mp3",
        mime_type=file.content_type or "audio/mp3",
        session_id=session_id,
    )


@router.post("/synthesize", response_model=VoiceSynthesisResponse)
def synthesize_speech_endpoint(
    payload: VoiceSynthesisRequest,
):
    """
    Synthesizes text into spoken audio voice stream for low-literacy citizens.
    """
    return voice_service.synthesize_speech(
        text=payload.text,
        language_code=payload.language_code,
    )
