from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import get_current_user_optional, get_db
from app.modules.auth.models import User
from app.modules.voice.schemas import (
    VoiceChatResponse,
    VoiceSynthesisRequest,
    VoiceSynthesisResponse,
    VoiceTranscriptionResponse,
)
from app.modules.voice.service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice-First Multilingual Speech Engine"])


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
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    End-to-End Voice Chat: Upload voice question ➔ Audio STT ➔ Query Router ➔ Conversational Response.
    """
    content = await file.read()
    user_id = current_user.id if current_user else None
    return voice_service.execute_voice_chat(
        db=db,
        user_id=user_id,
        audio_bytes=content,
        filename=file.filename or "audio.mp3",
        mime_type=file.content_type or "audio/mp3",
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
