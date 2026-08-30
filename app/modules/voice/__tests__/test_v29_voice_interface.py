import io
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.modules.eligibility.bitmask_engine import bitmask_engine
from app.modules.schemes.models import Benefit, EligibilityRule, Scheme


def test_voice_transcription_and_speech_endpoints(client: TestClient, db_session: Session):
    s = Scheme(
        name="Mukhyamantri Medhavi Vidyarthi Yojana",
        slug="mp-medhavi-vidyarthi-yojana",
        state="Madhya Pradesh",
        category="Education",
        ministry="Higher Education Department MP",
        description="Scholarship for meritorious students in Madhya Pradesh",
    )
    db_session.add(s)
    db_session.flush()
    db_session.add(EligibilityRule(scheme_id=s.id, field_name="occupation", operator="eq", rule_value="student"))
    db_session.add(Benefit(scheme_id=s.id, title="100% Tuition Fee Waiver", description="Fee waiver"))
    db_session.commit()
    bitmask_engine.warm_up(db_session)

    # 1. Test Transcribe Endpoint with Audio Payload
    fake_audio = io.BytesIO(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
    files = {"file": ("test_voice.wav", fake_audio, "audio/wav")}

    res_transcribe = client.post("/voice/transcribe", files=files)
    assert res_transcribe.status_code == 200
    t_data = res_transcribe.json()
    assert "transcribed_text" in t_data
    assert len(t_data["transcribed_text"]) > 0

    # 2. Test Synthesize Speech Endpoint (TTS)
    tts_payload = {"text": "Aapki scholarship manzoor ho gayi hai", "language_code": "hi"}
    res_tts = client.post("/voice/synthesize", json=tts_payload)
    assert res_tts.status_code == 200
    tts_data = res_tts.json()
    assert tts_data["audio_format"] == "mp3"
    assert tts_data["audio_base64"] is not None

    # 3. Test End-to-End Voice Chat Endpoint
    fake_audio.seek(0)
    files_chat = {"file": ("query.wav", fake_audio, "audio/wav")}
    res_chat = client.post("/voice/chat", files=files_chat)
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "transcribed_query" in chat_data
    assert "response_text" in chat_data
    assert len(chat_data["response_text"]) > 0
