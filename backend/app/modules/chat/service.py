from collections.abc import AsyncGenerator
import json
import logging
from pathlib import Path
import shutil
import subprocess
import time
import traceback
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
    execute_search_schemes_directory,
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
   - For welfare questions: Call the relevant tool (`check_eligibility`, `search_schemes_directory`, or `get_scheme_details`).
   - When a citizen asks for the count, list, or general availability of schemes in a state or sector (e.g. "how many schemes in UP for education", "schemes for Goa"), call `search_schemes_directory` or `check_eligibility`.

2. ACCURATE SCALE & CONCISE CHAT PRESENTATION:
   - For personalized eligibility: Highlight the top 2-3 matched schemes concisely (`[Scheme Name](/schemes/{slug})`). If `total_matched_count` is higher than shown, state the true total count and invite the citizen to view all schemes (e.g. "You qualify for **{total_matched_count} schemes** in total. Here are the top 3 recommendations for you: ... You can explore all {total_matched_count} on [Browse Schemes](/schemes)").
   - For catalog/count questions: State the exact total count from the directory (`total_count_in_directory`), list 2-3 sample names, and route the citizen to the directory page with pre-filled filters (e.g. "There are **28 educational schemes** in Uttar Pradesh. You can view, search, and filter all of them on [Browse Uttar Pradesh Education Schemes](/schemes?state=Uttar+Pradesh&category=Education)").
   - Never dump long walls of text in the chat window. Keep responses focused on 2-3 highlighted cards while honestly reporting the full scale.
   - Never claim or imply "no other schemes exist" when `total_matched_count` or `total_count_in_directory` exceeds the displayed items.

3. MULTILINGUAL RESPONSE RULE:
   - Always respond in the EXACT same language and script as the citizen.
   - If user asks in Hindi (Devanagari): Respond in Devanagari Hindi.
   - If user asks in Hinglish (Roman script): Respond in Hinglish.
   - If user asks in English: Respond in clean English.

4. STATE JURISDICTION & CENTRAL SCHEMES CLARITY:
   - When a citizen asks for schemes in a specific state (e.g. Uttar Pradesh, Maharashtra, Madhya Pradesh, Goa) or general benefits:
     - Clearly distinguish between State-specific initiatives and Central/National programs.
     - Add clear indicators e.g., "🏛️ **State Scheme (Uttar Pradesh)**: [Scheme Name](/schemes/{slug})" vs "🇮🇳 **Central / National Scheme** (Applicable across India): [Scheme Name](/schemes/{slug})".

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


_LAST_LLM_ERROR: dict[str, Any] = {}


def _call_gemini_api(contents: list[dict[str, Any]], system_instruction: str) -> dict[str, Any] | None:
    """
    Direct HTTPS caller for Google Gemini GenerateContent endpoint with exponential backoff.
    Fails LOUDLY with full stack traces on rate-limits (HTTP 429).
    """
    global _LAST_LLM_ERROR
    _LAST_LLM_ERROR.clear()

    if not settings.GEMINI_API_KEY:
        err_msg = (
            "GEMINI_API_KEY is missing in environment/backend/.env while LLM_PROVIDER='gemini'. "
            "Set GEMINI_API_KEY or switch to LLM_PROVIDER=agy for local CLI execution."
        )
        logger.error(
            "\n" + "=" * 80 + "\n"
            f"🚨 [CRITICAL CONFIG ERROR] GEMINI_API_KEY NOT SET!\n"
            f"{err_msg}\n"
            + "=" * 80
        )
        _LAST_LLM_ERROR = {
            "error_code": "GEMINI_API_KEY_MISSING",
            "message": err_msg,
            "provider": "gemini",
            "stack_trace": None,
        }
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

    last_exc = None
    last_status = None
    last_body = ""
    last_stack = None

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
                last_status = http_err.code
                last_exc = http_err
                last_stack = traceback.format_exc()
                try:
                    last_body = http_err.read().decode("utf-8")
                except Exception:
                    last_body = str(http_err)

                if http_err.code in (429, 500, 502, 503, 504) and attempt < len(backoff_delays):
                    delay = 0.01 if getattr(settings, "TESTING", False) else backoff_delays[attempt]
                    logger.warning(f"⚠️ [Gemini API] model {model_name} HTTP {http_err.code}, retrying in {delay}s (attempt {attempt + 1})...")
                    time.sleep(delay)
                    continue

                logger.error(
                    "\n" + "=" * 80 + "\n"
                    f"🚨 [CRITICAL LLM FAILURE] RATE LIMIT / HTTP ERROR ({http_err.code})\n"
                    f"• Provider: Gemini REST API\n"
                    f"• Model: {model_name}\n"
                    f"• Response Body:\n{last_body}\n\n"
                    f"• Full Python Stack Trace:\n{last_stack}\n"
                    f"💡 HOW TO UNBLOCK DEV:\n"
                    f"Set LLM_PROVIDER=agy in backend/.env to bypass API quotas using local CLI.\n"
                    + "=" * 80
                )
                break
            except Exception as e:
                last_exc = e
                last_stack = traceback.format_exc()
                logger.error(
                    "\n" + "=" * 80 + "\n"
                    f"🚨 [CRITICAL LLM EXCEPTION] {type(e).__name__}: {e}\n"
                    f"• Model: {model_name}\n"
                    f"• Full Python Stack Trace:\n{last_stack}\n"
                    + "=" * 80
                )
                break

    _LAST_LLM_ERROR = {
        "error_code": "AI_RATE_LIMIT_EXCEEDED" if last_status == 429 else "LLM_PROVIDER_FAILURE",
        "status_code": last_status,
        "message": f"Gemini API HTTP {last_status}: {last_body}" if last_body else str(last_exc),
        "provider": "gemini",
        "stack_trace": last_stack or (traceback.format_exc() if last_exc else None),
    }
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
    logger.info(f"🤖 [agy CLI] Executing prompt using model: {model_name} (sandbox=True)")
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
            logger.warning(f"❌ [agy CLI] Process returned non-zero code {res.returncode}: {res.stderr}")
            return None

        raw = json.loads(res.stdout)
        structured = raw.get("structured_output")
        if not structured or not isinstance(structured, dict):
            # Fallback attempt if response is in text field
            resp_str = raw.get("response", "")
            try:
                structured = json.loads(resp_str)
            except Exception:
                logger.warning(f"❌ [agy CLI] Failed to parse structured output from raw response: {res.stdout[:200]}")
                return None

        logger.info(f"✅ [agy CLI] Successfully received structured action: '{structured.get('action')}'")
        action = structured.get("action")
        if action == "tool_call":
            logger.info(f"🔧 [agy CLI] Model requested tool call: {structured.get('tool_name')} with args: {structured.get('tool_args')}")
            parts = [
                {
                    "functionCall": {
                        "name": structured.get("tool_name", "check_eligibility"),
                        "args": structured.get("tool_args") or {},
                    }
                }
            ]
        else:
            logger.info(f"💬 [agy CLI] Model returned direct text response ({len(structured.get('text', ''))} chars)")
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
        logger.warning(f"❌ [agy CLI] Execution exception: {e}")
        return None


def call_llm_provider(contents: list[dict[str, Any]], system_instruction: str) -> dict[str, Any] | None:
    provider = (getattr(settings, "LLM_PROVIDER", None) or "gemini").lower()
    logger.info(f"⚡ [LLM Dispatcher] Using provider: '{provider}'")
    if provider == "agy":
        return _call_agy_cli(contents, system_instruction)
    return _call_gemini_api(contents, system_instruction)


def orchestrate_agentic_turn(
    db: Session,
    user_message: str,
    history_messages: list[ChatMessage],
    user_profile: dict[str, Any] | None,
) -> tuple[str, list[str], list[dict[str, str]], dict[str, int], str, str | None, str | None]:
    """
    Executes the Native Agentic Tool-Calling Loop.
    Fails LOUDLY with full stack trace and actionable dev instructions if rate limits or provider failures occur.
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
            err_info = _LAST_LLM_ERROR or {}
            err_code = err_info.get("error_code", "LLM_PROVIDER_FAILURE")
            st_trace = err_info.get("stack_trace")
            provider = (getattr(settings, "LLM_PROVIDER", None) or "gemini").lower()

            logger.error(f"❌ [Agentic Turn] LLM Provider '{provider}' failed completely. Error Code: {err_code}")

            if getattr(settings, "DEV_MODE", True):
                if err_code == "AI_RATE_LIMIT_EXCEEDED":
                    dev_message = (
                        "🚨 **[Dev Mode: Upstream AI Rate Limit Exceeded — HTTP 429]**\n\n"
                        "The upstream Google Gemini API rejected the request because API quota/rate limits were exhausted.\n\n"
                        f"• **Provider**: `gemini` (Google REST API)\n"
                        f"• **Model**: `{settings.GEMINI_MODEL}`\n"
                        f"• **Status**: `HTTP 429: Too Many Requests`\n"
                        f"• **Detail**: {err_info.get('message', 'Rate limit reached')}\n\n"
                        "💡 **How to unblock immediately without API quota:**\n"
                        "1. Set `LLM_PROVIDER=agy` in `backend/.env`\n"
                        "2. Restart the backend: `uv run uvicorn app.main:app --reload`"
                    )
                elif err_code == "GEMINI_API_KEY_MISSING":
                    dev_message = (
                        "🚨 **[Dev Mode: GEMINI_API_KEY Missing]**\n\n"
                        "`LLM_PROVIDER` is set to `gemini` but no `GEMINI_API_KEY` was found in `backend/.env`.\n\n"
                        "💡 **How to fix:**\n"
                        "1. Add `GEMINI_API_KEY=your_key` in `backend/.env`\n"
                        "2. OR set `LLM_PROVIDER=agy` to use local AI without an API key."
                    )
                else:
                    dev_message = (
                        f"🚨 **[Dev Mode Error: {err_code}]**\n\n"
                        f"LLM Provider `{provider}` failed: {err_info.get('message', 'Unknown failure')}\n\n"
                        f"```python\n{st_trace or 'No stack trace available'}\n```"
                    )

                turn_status = "rate_limit_exceeded" if err_code == "AI_RATE_LIMIT_EXCEEDED" else "service_unavailable"
                return (
                    dev_message,
                    [],
                    [],
                    {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                    turn_status,
                    err_code,
                    st_trace,
                )

            # Production fallback
            return (
                "I'm having trouble connecting right now. Please try again in a moment.",
                [],
                [],
                {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                "service_unavailable",
                "SERVICE_UNAVAILABLE",
                None,
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

            elif fn_name == "search_schemes_directory":
                result = execute_search_schemes_directory(db, fn_args)
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

    return final_response_text, citations, sources, token_usage, "success", None, None


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
    response_text, citations, sources, token_usage, turn_status, error_code, stack_trace = orchestrate_agentic_turn(
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
        intent="SERVICE_UNAVAILABLE" if turn_status in ("service_unavailable", "rate_limit_exceeded") else "AGENTIC_CHAT",
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
    setattr(assistant_msg, "error_code", error_code)
    setattr(assistant_msg, "stack_trace", stack_trace)

    return assistant_msg


async def stream_chat_response(
    db: Session, session_id: int, user_id: int | None, content: str
) -> AsyncGenerator[str, None]:
    """Server-Sent Events (SSE) generator for real-time token streaming with fail-loud error telemetry."""
    assistant_msg = send_chat_message(db, session_id, user_id, content)

    turn_status = getattr(assistant_msg, "status", "success")
    if turn_status in ("service_unavailable", "rate_limit_exceeded"):
        chunk = {
            "type": "token",
            "token": assistant_msg.content,
            "citations": [],
            "sources": [],
        }
        yield f"data: {json.dumps(chunk)}\n\n"
        error_chunk = {
            "type": "error",
            "status": turn_status,
            "error_code": getattr(assistant_msg, "error_code", "AI_RATE_LIMIT_EXCEEDED"),
            "message": assistant_msg.content,
            "stack_trace": getattr(assistant_msg, "stack_trace", None),
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
