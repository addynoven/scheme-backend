from pydantic import BaseModel, Field


class VoiceTranscriptionResponse(BaseModel):
    transcribed_text: str
    detected_language: str
    confidence: float
    duration_seconds: float | None = None


class VoiceChatMatchedScheme(BaseModel):
    name: str
    slug: str
    benefit_title: str | None = "Government Welfare Assistance"
    application_url: str | None = None


class VoiceChatResponse(BaseModel):
    session_id: int | None = None
    transcribed_query: str
    transcribed_text: str
    detected_language: str
    response_text: str
    answer: str
    citations: list[str] = Field(default_factory=list)
    matched_schemes: list[VoiceChatMatchedScheme] = Field(default_factory=list)
    audio_url: str | None = None
    audio_base64: str | None = None
    synthesized_speech_base64: str | None = None



class VoiceSynthesisRequest(BaseModel):
    text: str = Field(..., min_length=1)
    language_code: str = "hi"
    voice_gender: str = "female"


class VoiceSynthesisResponse(BaseModel):
    audio_format: str = "mp3"
    audio_base64: str | None = None
    synthesized_text: str
    language_code: str
