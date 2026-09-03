from collections.abc import AsyncGenerator
import json
import logging
from pathlib import Path
import re
import shutil
import subprocess
import time
import traceback
from typing import Any
import urllib.error
import urllib.request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.auth.models import CitizenFact, User
from app.modules.chat.models import ChatMessage
from app.modules.chat.prompts import SYSTEM_INSTRUCTION
from app.modules.chat.session_service import get_chat_session
from app.modules.chat.tools import (
    CHAT_TOOLS_DECLARATIONS,
    execute_check_eligibility,
    execute_get_scheme_details,
    execute_search_schemes_directory,
)

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 3
MAX_HISTORY_TURNS = 15
_LAST_LLM_ERROR: dict[str, Any] = {}


def _build_user_context(db: Session, user_id: int | None) -> dict[str, Any] | None:
    """Extract verified facts from database (PII-minimized: excludes raw email)."""
    if not user_id:
        return None

    user = db.scalar(select(User).where(User.id == user_id))
    if not user:
        return None

    context: dict[str, Any] = {}

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
    HTTPS caller for Gemini GenerateContent endpoint with exponential backoff on 429/5xx errors.
    Fails fast without retries on 400 Bad Request or 401/403 Auth failures.
    """
    global _LAST_LLM_ERROR
    _LAST_LLM_ERROR.clear()

    if not settings.GEMINI_API_KEY:
        err_msg = "GEMINI_API_KEY is missing in environment while LLM_PROVIDER='gemini'."
        logger.error(f"🚨 [CRITICAL CONFIG ERROR] {err_msg}")
        _LAST_LLM_ERROR = {
            "error_code": "GEMINI_API_KEY_MISSING",
            "message": err_msg,
            "provider": "gemini",
        }
        return None

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "tools": CHAT_TOOLS_DECLARATIONS,
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1024},
    }

    configured_model = settings.GEMINI_MODEL or "gemini-3.8-flash"
    models_to_try = [configured_model, "gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
    seen = set()
    deduped_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    for model in deduped_models:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
        data_bytes = json.dumps(payload).encode("utf-8")

        for attempt in range(3):
            req = urllib.request.Request(
                url, data=data_bytes, headers={"Content-Type": "application/json"}, method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    if resp.status == 200:
                        return json.loads(resp.read().decode("utf-8"))
            except urllib.error.HTTPError as e:
                # Do NOT retry client validation (400) or auth (401/403) errors
                if e.code in (400, 401, 403):
                    logger.error(f"❌ [Gemini API] Client error HTTP {e.code} for model {model}: {e.read().decode('utf-8', errors='ignore')}")
                    _LAST_LLM_ERROR = {
                        "error_code": f"HTTP_{e.code}",
                        "message": f"Client request error HTTP {e.code}",
                        "provider": "gemini",
                    }
                    return None
                elif e.code in (429, 500, 502, 503, 504):
                    logger.warning(f"⚠️ [Gemini API] model {model} HTTP {e.code}, retrying in {0.01 * (2 ** attempt)}s...")
                    time.sleep(0.01 * (2 ** attempt))
            except Exception as e:
                logger.warning(f"⚠️ [Gemini API] exception on model {model}: {e}")
                time.sleep(0.01)

    _LAST_LLM_ERROR = {
        "error_code": "AI_RATE_LIMIT_EXCEEDED",
        "message": "All Gemini models rate limited or failed.",
        "provider": "gemini",
    }
    return None


AGY_JSON_SCHEMA = {
    "type": "object",
    "properties": {
        "action": {
            "type": "string",
            "enum": ["text", "tool_call"],
            "description": "Choose 'text' to respond directly to the citizen, or 'tool_call' to execute a backend tool function."
        },
        "text": {
            "type": "string",
            "description": "Direct response text for the citizen. Required when action is 'text'."
        },
        "tool_name": {
            "type": "string",
            "enum": ["check_eligibility", "get_scheme_details", "search_schemes_directory"],
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
    if provider == "agy":
        return _call_agy_cli(contents, system_instruction)
    return _call_gemini_api(contents, system_instruction)


def orchestrate_agentic_turn(
    db: Session,
    user_message: str,
    history_messages: list[ChatMessage],
    user_profile: dict[str, Any] | None,
) -> tuple[str, list[str], list[dict[str, str]], dict[str, int], dict[str, Any], str, str | None, str | None]:
    """
    Executes the Native Agentic Tool-Calling Loop with 4-Tier Memory Tracing.
    """
    start_time = time.perf_counter()
    citations: list[str] = []
    sources: list[dict[str, str]] = []
    tools_called_names: list[str] = []
    procedural_tools_executed: list[dict[str, Any]] = []
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

    contents: list[dict[str, Any]] = []
    for m in history_messages[-MAX_HISTORY_TURNS:]:
        role = "user" if m.sender == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.content}]})

    current_text = f"{profile_info}{user_message}".strip()
    contents.append({"role": "user", "parts": [{"text": current_text}]})

    iteration = 0
    final_response_text = ""

    while iteration < MAX_TOOL_ITERATIONS:
        iteration += 1
        api_res = call_llm_provider(contents, SYSTEM_INSTRUCTION)

        if not api_res:
            err_info = _LAST_LLM_ERROR or {}
            err_code = err_info.get("error_code", "LLM_PROVIDER_FAILURE")
            provider = (getattr(settings, "LLM_PROVIDER", None) or "gemini").lower()

            logger.error(f"❌ [Agentic Turn] LLM Provider '{provider}' failed. Error Code: {err_code}")

            empty_memory = {
                "working_memory": {"model_name": settings.GEMINI_MODEL, "provider": provider},
                "semantic_memory": {"recalled_facts": []},
                "episodic_memory": {"session_turns_count": len(history_messages)},
                "procedural_memory": {"tools_executed": []},
            }

            if getattr(settings, "DEV_MODE", True):
                dev_message = (
                    f"🚨 **[Dev Mode Error: {err_code}]**\n\n"
                    f"LLM Provider `{provider}` failed: {err_info.get('message', 'Unknown failure')}"
                )
                return dev_message, [], [], {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}, empty_memory, "rate_limit_exceeded" if err_code == "AI_RATE_LIMIT_EXCEEDED" else "service_unavailable", err_code, None

            return (
                "I'm having trouble connecting right now. Please try again in a moment.",
                [],
                [],
                {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                empty_memory,
                "service_unavailable",
                "SERVICE_UNAVAILABLE",
                None,
            )

        usage = api_res.get("usageMetadata", {})
        token_usage["prompt_tokens"] += usage.get("promptTokenCount", 0)
        token_usage["completion_tokens"] += usage.get("candidatesTokenCount", 0)
        token_usage["total_tokens"] += usage.get("totalTokenCount", 0)

        candidate = api_res.get("candidates", [{}])[0]
        model_content = candidate.get("content", {})
        parts = model_content.get("parts", [])

        function_calls = [p["functionCall"] for p in parts if "functionCall" in p]

        if not function_calls:
            text_parts = [p.get("text", "") for p in parts if "text" in p]
            final_response_text = "".join(text_parts).strip()
            break

        contents.append({"role": "model", "parts": parts})
        function_response_parts = []

        for fc in function_calls:
            fn_name = fc.get("name")
            fn_args = fc.get("args", {})
            tools_called_names.append(fn_name)
            t_start = time.perf_counter()

            if fn_name == "check_eligibility":
                result = execute_check_eligibility(db, user_profile, fn_args)
                t_duration = int((time.perf_counter() - t_start) * 1000)
                procedural_tools_executed.append({
                    "name": fn_name,
                    "args": fn_args,
                    "duration_ms": t_duration,
                    "status": result.get("status", "success"),
                    "matched_count": result.get("total_matched_count", 0),
                })
                for s in result.get("schemes", []):
                    slug = s.get("slug")
                    name = s.get("name") or slug
                    if slug:
                        if slug not in citations:
                            citations.append(slug)
                        if not any(src["slug"] == slug for src in sources):
                            sources.append({"title": name, "slug": slug})

                function_response_parts.append({"functionResponse": {"name": fn_name, "response": result}})

            elif fn_name == "search_schemes_directory":
                result = execute_search_schemes_directory(db, fn_args)
                t_duration = int((time.perf_counter() - t_start) * 1000)
                procedural_tools_executed.append({
                    "name": fn_name,
                    "args": fn_args,
                    "duration_ms": t_duration,
                    "status": result.get("status", "success"),
                    "matched_count": result.get("total_count_in_directory", 0),
                })
                for s in result.get("sample_schemes", []):
                    slug = s.get("slug")
                    name = s.get("name") or slug
                    if slug:
                        if slug not in citations:
                            citations.append(slug)
                        if not any(src["slug"] == slug for src in sources):
                            sources.append({"title": name, "slug": slug})

                function_response_parts.append({"functionResponse": {"name": fn_name, "response": result}})

            elif fn_name == "get_scheme_details":
                result = execute_get_scheme_details(db, fn_args)
                t_duration = int((time.perf_counter() - t_start) * 1000)
                procedural_tools_executed.append({
                    "name": fn_name,
                    "args": fn_args,
                    "duration_ms": t_duration,
                    "status": result.get("status", "success"),
                    "matched_count": 1 if result.get("status") == "success" else 0,
                })
                slug = result.get("slug")
                name = result.get("name") or slug
                if slug:
                    if slug not in citations:
                        citations.append(slug)
                    if not any(src["slug"] == slug for src in sources):
                        sources.append({"title": name, "slug": slug})

                function_response_parts.append({"functionResponse": {"name": fn_name, "response": result}})

            else:
                function_response_parts.append({
                    "functionResponse": {"name": fn_name, "response": {"status": "error", "message": f"Unknown tool '{fn_name}'"}}
                })

        contents.append({"role": "function", "parts": function_response_parts})

    duration_ms = int((time.perf_counter() - start_time) * 1000)
    logger.info(
        f"Agent turn completed in {duration_ms}ms | Iterations: {iteration} | "
        f"Tools: {tools_called_names} | Tokens: {token_usage['total_tokens']}"
    )

    if not final_response_text:
        final_response_text = "I am ready to assist you with government welfare programs. Please let me know what you need."

    # Build 4-Tier Agentic Memory Trace Payload
    recalled_facts = []
    if user_profile:
        for k in ["state", "district", "age", "gender", "occupation", "annual_income", "caste_category"]:
            val = user_profile.get(k)
            if val is not None and str(val).strip() != "":
                formatted_val = f"₹{val:,}" if k == "annual_income" and isinstance(val, (int, float)) else str(val)
                recalled_facts.append({"key": k, "value": formatted_val, "status": "IN_PROMPT"})

    memory_trace = {
        "working_memory": {
            "model_name": getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash"),
            "provider": getattr(settings, "LLM_PROVIDER", "gemini"),
            "system_instruction_summary": SYSTEM_INSTRUCTION[:140] + "...",
            "iterations_count": iteration,
            "prompt_tokens": token_usage.get("prompt_tokens", 0),
            "completion_tokens": token_usage.get("completion_tokens", 0),
            "total_tokens": token_usage.get("total_tokens", 0),
            "turn_duration_ms": duration_ms,
        },
        "semantic_memory": {
            "recalled_facts_count": len(recalled_facts),
            "recalled_facts": recalled_facts,
            "profile_summary": user_profile or {},
        },
        "episodic_memory": {
            "session_turns_count": len(history_messages),
            "history_events": [
                {
                    "sender": m.sender,
                    "snippet": m.content[:90] + ("..." if len(m.content) > 90 else ""),
                    "timestamp": str(m.created_at),
                }
                for m in history_messages[-4:]
            ],
        },
        "procedural_memory": {
            "available_tools_count": len(CHAT_TOOLS_DECLARATIONS[0]["function_declarations"]),
            "tools_executed_count": len(procedural_tools_executed),
            "tools_executed": procedural_tools_executed,
        },
    }

    return final_response_text, citations, sources, token_usage, memory_trace, "success", None, None


def send_chat_message(
    db: Session,
    session_id: int,
    user_id: int,
    content: str,
    language_code: str | None = "en",
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

    # 2. Build Injected Profile Facts (PII minimized)
    user_profile = _build_user_context(db, user_id)

    # 3. Execute Native Agentic Tool Loop
    response_text, citations, sources, token_usage, memory_trace, turn_status, error_code, stack_trace = orchestrate_agentic_turn(
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
    generic_names = ("New Welfare Conversation", "New Citizen Consultation", "New Welfare Consultation", "New Consultation")
    if session.title in generic_names or not session.title or session.title.startswith("New "):
        clean_title = re.sub(r'[\r\n\t]+', ' ', content).strip()
        stripped = re.sub(r'^(hello|hi|namaste|hey|who are you|tell me about|what about)\s*,?\s*', '', clean_title, flags=re.IGNORECASE).strip()
        chosen = stripped if len(stripped) >= 3 else clean_title
        session.title = chosen[:40] + ("..." if len(chosen) > 40 else "")

    db.commit()
    db.refresh(assistant_msg)

    setattr(assistant_msg, "sources", sources)
    setattr(assistant_msg, "token_usage", token_usage)
    setattr(assistant_msg, "memory_trace", memory_trace)
    setattr(assistant_msg, "status", turn_status)
    setattr(assistant_msg, "error_code", error_code)
    setattr(assistant_msg, "stack_trace", stack_trace)

    return assistant_msg


async def stream_chat_response(
    db: Session, session_id: int, user_id: int, content: str
) -> AsyncGenerator[str, None]:
    """Server-Sent Events (SSE) generator for real-time token streaming with fail-loud error telemetry."""
    try:
        assistant_msg = send_chat_message(db, session_id, user_id, content)

        turn_status = getattr(assistant_msg, "status", "success")
        memory_trace = getattr(assistant_msg, "memory_trace", None)
        if turn_status in ("service_unavailable", "rate_limit_exceeded"):
            chunk = {"type": "token", "token": assistant_msg.content, "citations": [], "sources": []}
            yield f"data: {json.dumps(chunk)}\n\n"
            error_chunk = {
                "type": "error",
                "status": turn_status,
                "error_code": getattr(assistant_msg, "error_code", "AI_RATE_LIMIT_EXCEEDED"),
                "message": assistant_msg.content,
                "stack_trace": getattr(assistant_msg, "stack_trace", None),
            }
            yield f"data: {json.dumps(error_chunk)}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id, 'memory_trace': memory_trace})}\n\n"
            return

        words = assistant_msg.content.split(" ")
        for i, word in enumerate(words):
            chunk = {
                "type": "token",
                "token": word + (" " if i < len(words) - 1 else ""),
                "citations": assistant_msg.citations if i == len(words) - 1 else [],
                "sources": getattr(assistant_msg, "sources", []) if i == len(words) - 1 else [],
            }
            yield f"data: {json.dumps(chunk)}\n\n"

        yield f"data: {json.dumps({'type': 'done', 'message_id': assistant_msg.id, 'memory_trace': memory_trace})}\n\n"
    except Exception as e:
        logger.error(f"❌ [SSE Stream] Unhandled exception in stream_chat_response: {e}", exc_info=True)
        st_trace = traceback.format_exc()
        err_msg = str(e)
        error_chunk = {
            "type": "error",
            "status": "service_unavailable",
            "error_code": "STREAMING_GENERATOR_ERROR",
            "message": f"Server error: {err_msg}",
            "stack_trace": st_trace,
        }
        yield f"data: {json.dumps(error_chunk)}\n\n"
