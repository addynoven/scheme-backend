import json
import logging
from datetime import date
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.modules.auth.models import User
from app.modules.voice.tools import VOICE_AGENT_TOOLS, execute_voice_tool

logger = logging.getLogger(__name__)


def build_grounding_context(user: User | None, db: Session) -> str:
    """
    Builds pre-session grounding instructions injecting verified facts and strict guidelines.
    """
    if not user or not user.profile:
        return (
            "You are 'SevaSaathi', an empathetic AI voice assistant for Indian Government Welfare Schemes.\n"
            "You are speaking with a citizen over a live audio call.\n"
            "Whenever the citizen asks for schemes or required documents, use the registered tools to get exact data."
        )

    p = user.profile
    today = date.today()
    dob = p.date_of_birth
    computed_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day)) if dob else 25

    facts_summary = "\n".join([f"- {f.fact_key}: {f.fact_value}" for f in user.facts])

    return f"""
You are 'SevaSaathi', an empathetic and authoritative AI voice assistant for Indian Welfare Schemes.
You are speaking directly with a citizen in real-time over a voice call.

VERIFIED CITIZEN FACTS (Official Database Records):
- Full Name: {p.full_name}
- State: {p.state} (District: {p.district})
- Age: {computed_age} years | Gender: {p.gender}
- Annual Income: ₹{p.annual_income:,} | Category: {p.caste_category or 'General'}
- Occupation: {p.occupation}
{facts_summary}

RULES FOR REAL-TIME VOICE CONVERSATION:
1. NEVER ask the citizen for information already listed above.
2. If the citizen asks for schemes, eligibility, or family benefits, CALL the tool 'search_eligible_schemes' or 'evaluate_family_schemes'.
3. If the citizen asks what documents are needed, ALWAYS CALL the tool 'get_scheme_documents'. NEVER guess or invent documents.
4. If the citizen mentions a change in income or status, CALL 'record_spoken_fact'.
5. Speak in clear, polite Hindi/Hinglish with natural conversational cadence. State exact rupee amounts and official portal URLs.
"""


class LiveVoiceGateway:
    """
    Manages Real-Time WebSocket Voice Session with Bidirectional Tool Calling.
    """

    async def handle_client_session(
        self,
        websocket: WebSocket,
        db: Session,
        current_user: User | None = None,
    ):
        await websocket.accept()
        user_id = current_user.id if current_user else None
        grounding_prompt = build_grounding_context(current_user, db)

        # 1. Send Session Initialized Handshake
        await websocket.send_json({
            "type": "session_ready",
            "session_id": f"voice_live_{user_id or 'anon'}",
            "available_tools": [t["name"] for t in VOICE_AGENT_TOOLS],
            "grounding_summary": {
                "user_name": current_user.profile.full_name if current_user and current_user.profile else "Citizen",
                "state": current_user.profile.state if current_user and current_user.profile else "All India",
            },
        })

        try:
            while True:
                data = await websocket.receive_text()
                event = json.loads(data)
                event_type = event.get("type")

                # Handle Client-Emitted Tool Call Request (or Simulated Gemini RPC)
                if event_type == "tool_call":
                    call_id = event.get("call_id", "call_default")
                    tool_name = event.get("name")
                    tool_args = event.get("args", {})

                    # Execute Tool Locally in < 0.05ms
                    tool_output = execute_voice_tool(
                        tool_name=tool_name,
                        args=tool_args,
                        db=db,
                        user_id=user_id,
                    )

                    # Send Tool Response Back
                    await websocket.send_json({
                        "type": "tool_response",
                        "call_id": call_id,
                        "name": tool_name,
                        "output": tool_output,
                    })

                elif event_type == "audio_frame":
                    # Echo / Process live PCM audio chunk
                    await websocket.send_json({
                        "type": "audio_ack",
                        "bytes_received": len(event.get("data", "")),
                    })

                elif event_type == "ping":
                    await websocket.send_json({"type": "pong"})

        except WebSocketDisconnect:
            logger.info("Live Voice WebSocket disconnected cleanly.")
        except Exception as e:
            logger.error(f"Live Voice WebSocket error: {e}")
            await websocket.close()


live_voice_gateway = LiveVoiceGateway()
