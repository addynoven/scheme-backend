import json
import logging
import time
from typing import Any
import uuid

from langsmith import traceable

from app.core.config import settings

logger = logging.getLogger(__name__)

# OpenAI / Groq Tool Declarations corresponding to our 4 citizen tools
GROQ_CHAT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "check_eligibility",
            "description": (
                "Check which government welfare schemes a citizen qualifies for based on demographic criteria and optional sector/category. "
                "Use this when the citizen asks what welfare schemes they qualify for or provides demographic details seeking personalized recommendations. "
                "Pass state (e.g. 'Uttar Pradesh', 'Goa', 'Madhya Pradesh', 'Maharashtra'), category (e.g. 'Education', 'Agriculture'), occupation (e.g. 'student', 'farmer'), age, annual_income."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Sector/category, e.g. Education, Business & Finance, Agriculture, Healthcare, Housing, Employment & Skills, Social Welfare, Women & Child.",
                    },
                    "topic": {
                        "type": "string",
                        "description": "Specific sub-topic or keyword to match, e.g. scholarship, tuition waiver, loan, tablet, coaching, subsidy.",
                    },
                    "state": {
                        "type": "string",
                        "description": "Indian state or union territory name, e.g. Uttar Pradesh, Madhya Pradesh, Goa, Maharashtra, or ALL_INDIA.",
                    },
                    "occupation": {
                        "type": "string",
                        "description": "Citizen occupation, e.g. student, farmer, artisan, unemployed, self-employed.",
                    },
                    "age": {
                        "type": "integer",
                        "description": "Age in years.",
                    },
                    "annual_income": {
                        "type": "number",
                        "description": "Annual household income in INR.",
                    },
                    "caste_category": {
                        "type": "string",
                        "description": "Caste category, e.g. General, OBC, SC, ST, EWS.",
                    },
                    "gender": {
                        "type": "string",
                        "description": "Gender, e.g. female, male, other.",
                    },
                    "jurisdiction": {
                        "type": "string",
                        "enum": ["both", "central_only", "state_only"],
                        "description": "Optional scheme jurisdiction: 'both' (default: state + central), 'central_only', or 'state_only'.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_schemes_directory",
            "description": (
                "Search and count all available government welfare schemes in the official registry by state, category, or keyword. "
                "Use this whenever the citizen asks how many schemes exist in total, asks for all schemes in a state or sector, "
                "or wants an honest directory count of available initiatives."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "state": {
                        "type": "string",
                        "description": "State name to filter by, e.g. 'Uttar Pradesh', 'Goa', 'All India'.",
                    },
                    "category": {
                        "type": "string",
                        "description": "Category filter, e.g. 'Education', 'Agriculture', 'Healthcare'.",
                    },
                    "search_query": {
                        "type": "string",
                        "description": "Keyword search query, e.g. 'scholarship', 'farmer', 'irrigation', 'pension'.",
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_scheme_details",
            "description": (
                "Fetches canonical markdown scheme documentation or database records for a specific scheme slug. "
                "Use this when the citizen asks for detailed requirements, application process, or benefits of a named scheme."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "scheme_slug": {
                        "type": "string",
                        "description": "The exact slug of the scheme, e.g. 'pm-kisan-samman-nidhi', 'ladli-behna'.",
                    },
                },
                "required": ["scheme_slug"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "browse_schemes_and_knowledge",
            "description": (
                "Browses scheme directory with multi-field demographic/policy filters AND inspects canonical @knowledge Markdown documentation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "search_query": {"type": "string"},
                    "state": {"type": "string"},
                    "category": {"type": "string"},
                    "occupation": {"type": "string"},
                    "gender": {"type": "string"},
                    "caste_category": {"type": "string"},
                    "annual_income": {"type": "number"},
                    "has_land": {"type": "boolean"},
                    "include_knowledge_md": {"type": "boolean"},
                },
            },
        },
    },
]


def _convert_contents_to_groq_messages(
    contents: list[dict[str, Any]], system_instruction: str
) -> list[dict[str, Any]]:
    """Converts internal contents structure into OpenAI/Groq chat messages format."""
    messages: list[dict[str, Any]] = []

    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})

    # Track tool call IDs to pair tool responses
    pending_tool_calls: list[str] = []

    for c in contents:
        role = c.get("role", "user")
        parts = c.get("parts", [])

        if role == "user":
            user_texts = [p["text"] for p in parts if "text" in p]
            if user_texts:
                messages.append({"role": "user", "content": "\n".join(user_texts)})

            # Check for functionResponse
            for p in parts:
                if "functionResponse" in p:
                    fn_resp = p["functionResponse"]
                    call_id = pending_tool_calls.pop(0) if pending_tool_calls else f"call_{uuid.uuid4().hex[:8]}"
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call_id,
                        "content": json.dumps(fn_resp.get("response", {})),
                    })

        elif role in ("function", "tool"):
            for p in parts:
                if "functionResponse" in p:
                    fn_resp = p["functionResponse"]
                    call_id = pending_tool_calls.pop(0) if pending_tool_calls else f"call_{uuid.uuid4().hex[:8]}"
                    messages.append({
                        "role": "tool",
                        "tool_call_id": call_id,
                        "content": json.dumps(fn_resp.get("response", {})),
                    })
        elif role in ("model", "assistant"):
            text_parts = [p["text"] for p in parts if "text" in p]
            fc_parts = [p["functionCall"] for p in parts if "functionCall" in p]

            if fc_parts:
                tool_calls = []
                for fc in fc_parts:
                    call_id = f"call_{uuid.uuid4().hex[:8]}"
                    pending_tool_calls.append(call_id)
                    tool_calls.append({
                        "id": call_id,
                        "type": "function",
                        "function": {
                            "name": fc["name"],
                            "arguments": json.dumps(fc.get("args", {})),
                        },
                    })
                assistant_msg: dict[str, Any] = {"role": "assistant", "tool_calls": tool_calls}
                if text_parts:
                    assistant_msg["content"] = "\n".join(text_parts)
                messages.append(assistant_msg)
            elif text_parts:
                messages.append({"role": "assistant", "content": "\n".join(text_parts)})

    # If any pending tool calls remain unfulfilled, synthesize dummy responses to satisfy Groq/OpenAI contract
    while pending_tool_calls:
        orphan_id = pending_tool_calls.pop(0)
        messages.append({
            "role": "tool",
            "tool_call_id": orphan_id,
            "content": json.dumps({"status": "completed"}),
        })

    return messages


@traceable(
    run_type="llm",
    name="Groq ChatCompletion",
)
def call_groq_api(
    contents: list[dict[str, Any]],
    system_instruction: str,
    tools: list[dict[str, Any]] | None = None,
) -> dict[str, Any] | None:
    """
    Executes chat completion via Groq AI with automatic multi-model fallback cascade.
    Supports tool calling with openai/gpt-oss-120b, qwen/qwen3.8-27b, and openai/gpt-oss-20b.
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY is not configured in environment.")
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key, max_retries=0)
    except ImportError:
        logger.error("groq package is not installed. Run `uv add groq`.")
        return None
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {e}")
        return None

    messages = _convert_contents_to_groq_messages(contents, system_instruction)
    has_tool_result = any(
        c.get("role") in ("function", "tool") or any("functionResponse" in p for p in c.get("parts", []))
        for c in contents
    )
    available_tools = None if has_tool_result else (tools if tools is not None else GROQ_CHAT_TOOLS)
    model = settings.GROQ_MODEL or "qwen/qwen3.8-27b"

    for attempt in range(2):
            try:
                t0 = time.perf_counter()
                kwargs: dict[str, Any] = {
                    "messages": messages,
                    "model": model,
                    "temperature": 0.2,
                    "max_tokens": 1024,
                }
                if available_tools:
                    kwargs["tools"] = available_tools
                    kwargs["tool_choice"] = "auto"

                completion = client.chat.completions.create(**kwargs)
                duration_ms = int((time.perf_counter() - t0) * 1000)

                if not completion.choices:
                    continue

                choice = completion.choices[0]
                msg = choice.message
                parts: list[dict[str, Any]] = []

                if getattr(msg, "tool_calls", None):
                    for tc in msg.tool_calls:
                        args = {}
                        if tc.function.arguments:
                            try:
                                args = json.loads(tc.function.arguments)
                            except Exception:
                                args = {}
                        parts.append({
                            "functionCall": {
                                "name": tc.function.name,
                                "args": args,
                            }
                        })
                elif msg.content:
                    parts.append({"text": msg.content})

                usage = getattr(completion, "usage", None)
                prompt_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
                completion_tokens = getattr(usage, "completion_tokens", 0) if usage else 0
                total_tokens = getattr(usage, "total_tokens", 0) if usage else (prompt_tokens + completion_tokens)

                logger.warning(
                    f"⚡ [Groq AI Call] Model '{model}' succeeded in {duration_ms}ms "
                    f"(tokens: prompt={prompt_tokens}, completion={completion_tokens}, parts={len(parts)})"
                )

                return {
                    "candidates": [{"content": {"parts": parts}}],
                    "usageMetadata": {
                        "promptTokenCount": prompt_tokens,
                        "candidatesTokenCount": completion_tokens,
                        "totalTokenCount": total_tokens,
                    },
                    "provider": "groq",
                    "model": model,
                    "actual_model": model,
                }

            except Exception as e:
                err_str = str(e)
                logger.warning(f"⚠️ [Groq AI] Model {model} attempt {attempt + 1} failed: {err_str}")
                if "rate_limit" in err_str.lower() or "429" in err_str:
                    logger.warning(f"⚠️ [Groq AI Rate Limit] Limit reached on {model}. Fast failover to local fallback...")
                    return None
                break

    logger.error("❌ [Groq AI] All Groq models exhausted.")
    return None


@traceable(
    run_type="llm",
    name="Groq LangGraph Invoke",
)
def call_groq_for_langgraph(
    messages: list[Any],
) -> tuple[Any, dict[str, int], str] | None:
    """
    Direct invocation of Groq API for LangGraph StateGraph nodes.
    Avoids incompatible langchain-groq packages by producing standard LangChain AIMessage directly.
    """
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage

    api_key = settings.GROQ_API_KEY
    if not api_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key, max_retries=0)
    except Exception as e:
        logger.error(f"Failed to initialize Groq client for LangGraph: {e}")
        return None

    groq_msgs: list[dict[str, Any]] = []
    for m in messages:
        if isinstance(m, SystemMessage):
            groq_msgs.append({"role": "system", "content": m.content})
        elif isinstance(m, HumanMessage):
            groq_msgs.append({"role": "user", "content": m.content})
        elif isinstance(m, AIMessage):
            msg_dict: dict[str, Any] = {"role": "assistant"}
            if m.content:
                msg_dict["content"] = m.content
            if getattr(m, "tool_calls", None):
                msg_dict["tool_calls"] = [
                    {
                        "id": tc.get("id") or f"call_{uuid.uuid4().hex[:8]}",
                        "type": "function",
                        "function": {
                            "name": tc["name"],
                            "arguments": json.dumps(tc["args"]) if isinstance(tc["args"], dict) else str(tc["args"]),
                        },
                    }
                    for tc in m.tool_calls
                ]
            groq_msgs.append(msg_dict)
        elif isinstance(m, ToolMessage):
            groq_msgs.append({
                "role": "tool",
                "tool_call_id": m.tool_call_id,
                "content": m.content if isinstance(m.content, str) else json.dumps(m.content),
            })

    model = settings.GROQ_MODEL or "qwen/qwen3.8-27b"

    for attempt in range(2):
        try:
            t0 = time.perf_counter()
            completion = client.chat.completions.create(
                messages=groq_msgs,
                model=model,
                tools=GROQ_CHAT_TOOLS,
                tool_choice="auto",
                temperature=0.2,
                max_tokens=1024,
            )
            duration_ms = int((time.perf_counter() - t0) * 1000)

            if not completion.choices:
                continue

            choice = completion.choices[0]
            choice_msg = choice.message
            tool_calls = []

            if getattr(choice_msg, "tool_calls", None):
                for tc in choice_msg.tool_calls:
                    args = {}
                    if tc.function.arguments:
                        try:
                            args = json.loads(tc.function.arguments)
                        except Exception:
                            args = {}
                    tool_calls.append({
                        "name": tc.function.name,
                        "args": args,
                        "id": tc.id or str(uuid.uuid4()),
                    })

            ai_message = AIMessage(
                content=choice_msg.content or "",
                tool_calls=tool_calls,
                response_metadata={"provider": "groq", "model": model},
            )

            usage = getattr(completion, "usage", None)
            usage_dict = {
                "prompt_tokens": getattr(usage, "prompt_tokens", 0) if usage else 0,
                "completion_tokens": getattr(usage, "completion_tokens", 0) if usage else 0,
                "total_tokens": getattr(usage, "total_tokens", 0) if usage else 0,
            }

            logger.warning(f"⚡ [LangGraph Groq Call] Succeeded in {duration_ms}ms with model '{model}'")
            return ai_message, usage_dict, model

        except Exception as e:
            err_str = str(e)
            logger.warning(f"⚠️ [LangGraph Groq] Model {model} failed: {err_str}")
            if "rate_limit" in err_str.lower() or "429" in err_str:
                return None
            continue

    return None

