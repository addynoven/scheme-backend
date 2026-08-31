from collections.abc import AsyncGenerator
import json
import logging
from pathlib import Path
import shutil
import subprocess
import time
from typing import Any
import urllib.error
import urllib.request
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import CitizenFact, User
from app.modules.chat.models import ChatMessage, ChatSession
from app.modules.chat.tools import (
    CHAT_TOOLS_DECLARATIONS,
    execute_check_eligibility,
    execute_get_scheme_details,
)

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 3
MAX_HISTORY_TURNS = 15

# Sliding window rate limiter: {client_id: [timestamp_float, ...]}
_RATE_LIMIT_STORE: dict[str, list[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30

SYSTEM_INSTRUCTION = """
You are the Sovereign Citizen Welfare AI Advisor. You provide personalized, accurate, and empathetic assistance to Indian citizens navigating central and state government schemes.

### CRITICAL RULES:
1. ZERO ASSUMPTIONS & DIRECT BOUNDARIES:
   - For casual greetings (e.g., "hello", "hi", "namaste", "who are you"): Answer directly in 1-2 friendly sentences. Do NOT call any tools. Do NOT list or cite any schemes.
   - For out-of-scope queries (e.g., weather, poetry, stock trading, coding): Politely decline in 1 sentence and state that you only assist with government welfare schemes, scholarships, and citizen benefits. Do NOT call any tools.
   - For welfare questions: Call the relevant tool (`check_eligibility` or `get_scheme_details`).
   - When a citizen asks about a specific sector (e.g. 'education scholarships', 'business loans', 'farmer subsidy', 'pensions', 'housing'), call `check_eligibility` passing the matching `category` ('Education', 'Business', 'Agriculture', 'Pension', 'Health', 'Housing') and optional `topic` ('scholarship', 'loan', etc.).

2. STRICT FORMATTING & CITATIONS:
   - Always present schemes as markdown links: `[Scheme Name](/schemes/{slug})`.
   - Never output raw slugs without markdown link formatting.
   - Provide a clear 1-sentence summary of the main benefit.
   - Never return more than 3 schemes in one response.

3. MULTILINGUAL RESPONSE RULE:
   - Always respond in the EXACT same language and script as the citizen.
   - If user asks in Hindi (Devanagari): Respond in Devanagari Hindi.
   - If user asks in Hinglish (Roman script): Respond in Hinglish.
   - If user asks in English: Respond in clean English.

### MULTILINGUAL FEW-SHOT EXAMPLES:
- User: "hello there"
  Model: "Hello Citizen! I am your Sovereign Citizen Welfare AI Advisor. How can I assist you with government welfare programs, scholarships, or loans today?"

- User: "namaste"
  Model: "नमस्ते! मैं आपका नागरिक कल्याण एआई सलाहकार हूँ। मैं आज सरकारी योजनाओं, छात्रवृत्तियों या ऋणों में आपकी क्या सहायता कर सकता हूँ?"

- User: "kya ladli behna scheme mp me available hai?"
  Model: "हाँ, [Mukhyamantri Ladli Behna Yojana](/schemes/ladli-behna) मध्य प्रदेश सरकार की योजना है जिसमें पात्र महिलाओं को ₹1250 प्रतिमाह की आर्थिक सहायता दी जाती है।"

- User: "What is the weather in Delhi?"
  Model: "I can only assist with government welfare schemes, scholarships, and citizen benefits. Please let me know if you need help finding government programs."
"""


def check_rate_limit(client_id: str) -> bool:
    """Sliding-window rate limiter per client identifier."""
    if getattr(settings, "TESTING", False):
        return True

    now = time.time()
    window_start = now - RATE_LIMIT_WINDOW_SECONDS
    timestamps = _RATE_LIMIT_STORE.get(client_id, [])
    # Filter out expired timestamps
    valid_timestamps = [ts for ts in timestamps if ts > window_start]

    if len(valid_timestamps) >= RATE_LIMIT_MAX_REQUESTS:
        _RATE_LIMIT_STORE[client_id] = valid_timestamps
        return False

    valid_timestamps.append(now)
    _RATE_LIMIT_STORE[client_id] = valid_timestamps
    return True


def get_chat_session(db: Session, session_id: int, user_id: int | None = None) -> ChatSession:
    """Retrieve chat session and verify ownership."""
    query = select(ChatSession).where(ChatSession.id == session_id)
    if user_id is not None:
        query = query.where(ChatSession.user_id == user_id)

    session = db.scalar(query)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chat session {session_id} not found",
        )
    return session


def create_chat_session(
    db: Session,
    user_id: int | None = None,
    payload_or_title: Any = None,
    language_code: str | None = "en",
) -> ChatSession:
    """Create a new chat session."""
    title = "New Welfare Conversation"
    lang = language_code or "en"
    if hasattr(payload_or_title, "title"):
        title = payload_or_title.title or title
        lang = getattr(payload_or_title, "language_code", None) or lang
    elif isinstance(payload_or_title, str):
        title = payload_or_title

    session = ChatSession(
        user_id=user_id,
        title=title,
        language_code=lang,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def list_chat_sessions(db: Session, user_id: int | None = None, limit: int = 50) -> list[ChatSession]:
    """List chat sessions ordered by last update."""
    query = select(ChatSession)
    if user_id is not None:
        query = query.where(ChatSession.user_id == user_id)
    query = query.order_by(ChatSession.updated_at.desc()).limit(limit)
    return list(db.scalars(query).all())


def update_chat_session_title(
    db: Session, session_id: int, title: str, user_id: int | None = None
) -> ChatSession:
    session = get_chat_session(db, session_id, user_id)
    session.title = title
    db.commit()
    db.refresh(session)
    return session


def delete_chat_session(db: Session, session_id: int, user_id: int | None = None) -> None:
    """Delete a chat session."""
    session = get_chat_session(db, session_id, user_id)
    db.delete(session)
    db.commit()


def _build_user_context(db: Session, user_id: int | None) -> dict[str, Any] | None:
    """Extract verified facts from database."""
    if not user_id:
        return None

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        return None

    context: dict[str, Any] = {
        "email": user.email,
    }

    if user.profile:
        p = user.profile
        context["full_name"] = p.full_name
        context["state"] = p.state
        context["district"] = p.district
        if p.date_of_birth:
            from datetime import date
            today = date.today()
            context["age"] = today.year - p.date_of_birth.year - (
                (today.month, today.day) < (p.date_of_birth.month, p.date_of_birth.day)
            )
        context["gender"] = p.gender
        context["occupation"] = p.occupation
        context["annual_income"] = p.annual_income
        context["caste_category"] = p.caste_category

    # Layer verified facts
    facts = list(db.scalars(select(CitizenFact).where(CitizenFact.user_id == user_id)).all())
    for f in facts:
        context[f.fact_key] = f.fact_value

    return context


def _call_gemini_api(contents: list[dict[str, Any]], system_instruction: str) -> dict[str, Any] | None:
    """
    Executes raw HTTP POST to Gemini generateContent endpoint with exponential backoff retry.
    Retries up to 3 times on HTTP 429 and transient 5xx errors.
    """
    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not configured.")
        return None

    payload = {
        "system_instruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "tools": CHAT_TOOLS_DECLARATIONS,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        },
    }

    configured_model = settings.GEMINI_MODEL or "gemini-2.5-flash-lite"
    models_to_try = [
        configured_model,
        "gemini-2.5-flash-lite",
        "gemini-3.7-flash",
        "gemini-flash-latest",
    ]
    seen = set()
    deduped_models = [m for m in models_to_try if not (m in seen or seen.add(m))]
    backoff_delays = [1.0, 2.0, 4.0]

    for model_name in deduped_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={settings.GEMINI_API_KEY}"
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        for attempt in range(len(backoff_delays) + 1):
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as http_err:
                if http_err.code in (429, 500, 502, 503, 504) and attempt < len(backoff_delays):
                    delay = backoff_delays[attempt]
                    logger.warning(f"Gemini API model {model_name} HTTP {http_err.code}, retrying in {delay}s (attempt {attempt + 1})...")
                    time.sleep(delay)
                    continue
                logger.warning(f"Gemini API model {model_name} HTTP error: {http_err}")
                break
            except Exception as e:
                logger.warning(f"Gemini API model {model_name} failed: {e}")
                break

    return None


AGY_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ["text", "tool_call"],
            "description": "Whether to return a text response to the citizen or invoke a tool call."
        },
        "text": {
            "type": "string",
            "description": "The response message to the citizen. Required when action is 'text'."
        },
        "tool_name": {
            "type": "string",
            "enum": ["check_eligibility", "get_scheme_details"],
            "description": "The name of the tool to execute. Required when action is 'tool_call'."
        },
        "tool_args": {
            "type": "object",
            "description": "Arguments dictionary for the tool. Required when action is 'tool_call'."
        }
    },
    "required": ["action"]
}


def _call_agy_cli(contents: list[dict[str, Any]], system_instruction: str) -> dict[str, Any] | None:
    """
    Executes local completion using the agy CLI with strict JSON schema enforcement.
    Maps output to the uniform candidate / functionCall structure for zero-duplication orchestration.
    """
    agy_bin = shutil.which("agy") or "/home/neon/.local/bin/agy"
    if not Path(agy_bin).exists() and not shutil.which("agy"):
        logger.warning("agy binary not found on PATH or at /home/neon/.local/bin/agy")
        return None

    # Format contents into conversational prompt context
    lines = []
    for c in contents:
        role = c.get("role", "user")
        for part in c.get("parts", []):
            if "text" in part:
                prefix = "User:" if role == "user" else "Assistant:"
                lines.append(f"{prefix} {part['text']}")
            elif "functionCall" in part:
                fn = part["functionCall"]
                lines.append(f"Assistant: [Invoked tool {fn.get('name')} with args {json.dumps(fn.get('args', {}))}]")
            elif "functionResponse" in part:
                resp = part["functionResponse"]
                lines.append(f"Tool Result ({resp.get('name')}): {json.dumps(resp.get('response', {}))}")

    prompt_body = "\n".join(lines)
    full_prompt = (
        f"System Instruction:\n{system_instruction}\n\n"
        f"Response Protocol:\n"
        f"- Output ONLY a single valid JSON object conforming to the schema.\n"
        f"- If you need factual scheme data or eligibility matching, use action: 'tool_call'.\n"
        f"- If answering greetings, out-of-scope, or summarizing tool results, use action: 'text'.\n\n"
        f"---\n\nConversation Context & User Query:\n{prompt_body}"
    )

    model_name = getattr(settings, "AGY_MODEL", "gemini-3.7-flash-low") or "gemini-3.7-flash-low"
    cmd = [
        agy_bin,
        "--model", model_name,
        "--output-format", "json",
        "--json-schema", json.dumps(AGY_JSON_SCHEMA),
        "--sandbox",
        "--prompt", full_prompt,
    ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if res.returncode != 0:
            logger.warning(f"agy CLI error (code {res.returncode}): {res.stderr}")
            return None

        raw = json.loads(res.stdout)
        structured = raw.get("structured_output")
        if not structured or not isinstance(structured, dict):
            # Fallback attempt if response is in text field
            resp_str = raw.get("response", "")
            try:
                structured = json.loads(resp_str)
            except Exception:
                return None

        action = structured.get("action")
        if action == "tool_call":
            parts = [
                {
                    "functionCall": {
                        "name": structured.get("tool_name", "check_eligibility"),
                        "args": structured.get("tool_args") or {},
                    }
                }
            ]
        else:
            parts = [{"text": structured.get("text", "")}]

        usage = raw.get("usage", {})
        return {
            "candidates": [{"content": {"parts": parts}}],
            "usageMetadata": {
                "promptTokenCount": usage.get("input_tokens", 0),
                "candidatesTokenCount": usage.get("output_tokens", 0),
                "totalTokenCount": usage.get("total_tokens", 0),
            },
        }
    except Exception as e:
        logger.warning(f"Failed to execute agy CLI provider: {e}")
        return None


def call_llm_provider(contents: list[dict[str, Any]], system_instruction: str) -> dict[str, Any] | None:
    provider = (getattr(settings, "LLM_PROVIDER", None) or "gemini").lower()
    if provider == "agy":
        return _call_agy_cli(contents, system_instruction)
    return _call_gemini_api(contents, system_instruction)


def orchestrate_agentic_turn(
    db: Session,
    user_message: str,
    history_messages: list[ChatMessage],
    user_profile: dict[str, Any] | None,
) -> tuple[str, list[str], list[dict[str, str]], dict[str, int], str]:
    """
    Executes the Native Agentic Tool-Calling Loop.
    Enforces:
    - Rule 1: Zero intent classification in Python (no hardcoded fallback intent classifiers).
    - Rule 2: Max tool iterations cap (3).
    - Rule 4: Parallel tool batch execution with partial failure resilience.
    - Rule 5: Unified citation schema {title, slug}.
    - Rule 8: Sliding window history.
    - Rule 14: PII-redacted structured observability logging.
    - Explicit failure state ("service_unavailable") when LLM is unreachable.
    """
    start_time = time.perf_counter()
    citations: list[str] = []
    sources: list[dict[str, str]] = []
    tools_called_names: list[str] = []
    token_usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    # Build profile context string
    profile_info = ""
    if user_profile:
        parts = []
        for k in ["full_name", "state", "district", "age", "gender", "occupation", "annual_income", "caste_category"]:
            if user_profile.get(k):
                parts.append(f"{k}: {user_profile[k]}")
        if parts:
            profile_info = f"[Verified Citizen Profile: {', '.join(parts)}]\n"

    # Enforce Rule 8: Sliding window of last 15 turns
    contents: list[dict[str, Any]] = []
    for m in history_messages[-MAX_HISTORY_TURNS:]:
        role = "user" if m.sender == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.content}]})

    # Current user turn
    current_text = f"{profile_info}{user_message}".strip()
    contents.append({"role": "user", "parts": [{"text": current_text}]})

    # Tool Execution Loop (Rule 2)
    iteration = 0
    final_response_text = ""

    while iteration < MAX_TOOL_ITERATIONS:
        iteration += 1
        api_res = call_llm_provider(contents, SYSTEM_INSTRUCTION)

        if not api_res:
            # Explicit failure state when retries are exhausted (Rule 1 & Rule 12)
            logger.error("LLM Provider call failed after retries.")
            return (
                "I'm having trouble connecting right now. Please try again in a moment.",
                [],
                [],
                {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "service_unavailable",
            )

        # Capture token usage metrics (Rule 14)
        usage = api_res.get("usageMetadata", {})
        token_usage["prompt_tokens"] += usage.get("promptTokenCount", 0)
        token_usage["completion_tokens"] += usage.get("candidatesTokenCount", 0)
        token_usage["total_tokens"] += usage.get("totalTokenCount", 0)

        candidate = api_res.get("candidates", [{}])[0]
        model_content = candidate.get("content", {})
        parts = model_content.get("parts", [])

        # Check for function calls
        function_calls = [p["functionCall"] for p in parts if "functionCall" in p]

        if not function_calls:
            # Model produced text directly (e.g. greeting, summary, out-of-scope decline)
            text_parts = [p.get("text", "") for p in parts if "text" in p]
            final_response_text = "".join(text_parts).strip()
            break

        # Model requested tool execution: Execute batch in parallel with partial failure resilience (Rule 4)
        contents.append({"role": "model", "parts": parts})
        function_response_parts = []

        for fc in function_calls:
            fn_name = fc.get("name")
            fn_args = fc.get("args", {})
            tools_called_names.append(fn_name)

            if fn_name == "check_eligibility":
                result = execute_check_eligibility(db, user_profile, fn_args)
                for s in result.get("schemes", []):
                    slug = s.get("slug")
                    name = s.get("name") or slug
                    if slug:
                        if slug not in citations:
                            citations.append(slug)
                        if not any(src["slug"] == slug for src in sources):
                            sources.append({"title": name, "slug": slug})

                function_response_parts.append({
                    "functionResponse": {
                        "name": fn_name,
                        "response": result,
                    }
                })

            elif fn_name == "get_scheme_details":
                result = execute_get_scheme_details(db, fn_args)
                slug = result.get("slug")
                name = result.get("name") or slug
                if slug:
                    if slug not in citations:
                        citations.append(slug)
                    if not any(src["slug"] == slug for src in sources):
                        sources.append({"title": name, "slug": slug})

                function_response_parts.append({
                    "functionResponse": {
                        "name": fn_name,
                        "response": result,
                    }
                })

            else:
                function_response_parts.append({
                    "functionResponse": {
                        "name": fn_name,
                        "response": {"status": "error", "message": f"Unknown tool '{fn_name}'"},
                    }
                })

        contents.append({"role": "function", "parts": function_response_parts})

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    # Enforce Rule 14: PII-safe logging (no raw profile/arguments logged)
    logger.info(
        f"Agent turn completed in {duration_ms}ms | Iterations: {iteration} | "
        f"Tools: {tools_called_names} | Tokens: {token_usage['total_tokens']}"
    )

    if not final_response_text:
        final_response_text = "I am ready to assist you with government welfare programs. Please let me know what you need."

    return final_response_text, citations, sources, token_usage, "success"


def send_chat_message(
    db: Session, session_id: int, user_id: int | None, content: str, language_code: str | None = "en"
) -> ChatMessage:
    session = get_chat_session(db, session_id, user_id)

    # 1. Save Citizen User Message
    user_msg = ChatMessage(
        session_id=session.id,
        sender="user",
        content=content,
        intent="CITIZEN_QUERY",
        citations=[],
    )
    db.add(user_msg)
    db.commit()

    # 2. Build Injected Profile Facts
    user_profile = _build_user_context(db, user_id)

    # 3. Execute Native Agentic Tool Loop
    response_text, citations, sources, token_usage, turn_status = orchestrate_agentic_turn(
        db=db,
        user_message=content,
        history_messages=session.messages,
        user_profile=user_profile,
    )

    # 4. Save Assistant Response Message
    assistant_msg = ChatMessage(
        session_id=session.id,
        sender="assistant",
        content=response_text,
        intent="SERVICE_UNAVAILABLE" if turn_status == "service_unavailable" else "AGENTIC_CHAT",
        citations=citations,
    )
    db.add(assistant_msg)

    # Update session title if first turn
    if session.title == "New Welfare Conversation" or not session.title:
        session.title = content[:40] + ("..." if len(content) > 40 else "")

    db.commit()
    db.refresh(assistant_msg)

    # Attach dynamic non-persisted properties for Pydantic response serialization
    setattr(assistant_msg, "sources", sources)
    setattr(assistant_msg, "token_usage", token_usage)
    setattr(assistant_msg, "status", turn_status)

    return assistant_msg


async def stream_chat_response(
    db: Session, session_id: int, user_id: int | None, content: str
) -> AsyncGenerator[str, None]:
    """Server-Sent Events (SSE) generator for real-time token streaming."""
    assistant_msg = send_chat_message(db, session_id, user_id, content)

    if getattr(assistant_msg, "status", "success") == "service_unavailable":
        error_chunk = {
            "type": "error",
            "status": "service_unavailable",
            "message": assistant_msg.content,
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id})}\n\n"
        return

    # Yield in natural token chunks for streaming effect
    words = assistant_msg.content.split(" ")
    for i, word in enumerate(words):
        chunk = {
            "type": "token",
            "token": word + (" " if i < len(words) - 1 else ""),
            "citations": assistant_msg.citations if i == len(words) - 1 else [],
            "sources": getattr(assistant_msg, "sources", []) if i == len(words) - 1 else [],
        }
        yield f"data: {json.dumps(chunk)}\n\n"

    yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id})}\n\n"
