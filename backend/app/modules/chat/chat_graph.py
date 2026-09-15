import json
import logging
import time
from typing import Annotated, Any, Literal
from typing_extensions import TypedDict
import uuid

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.runnables import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages
from sqlalchemy.orm import Session

from app.core.config import settings
from app.modules.chat.prompts import SYSTEM_INSTRUCTION
from app.modules.chat.tools import (
    LANGGRAPH_TOOLS,
    execute_browse_schemes_and_knowledge,
    execute_check_eligibility,
    execute_get_scheme_details,
    execute_search_schemes_directory,
)

logger = logging.getLogger(__name__)


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    user_profile: dict[str, Any] | None
    citations: list[str]
    sources: list[dict[str, str]]
    token_usage: dict[str, int]
    procedural_tools_executed: list[dict[str, Any]]
    turn_status: str
    error_code: str | None
    memory_trace: dict[str, Any]


def enrich_context_node(state: AgentState) -> dict[str, Any]:
    """Injects verified citizen profile facts into the initial system message."""
    user_profile = state.get("user_profile")
    profile_info = ""
    if user_profile:
        parts = []
        for k in ["full_name", "state", "district", "age", "gender", "occupation", "annual_income", "caste_category"]:
            if user_profile.get(k):
                parts.append(f"{k}: {user_profile[k]}")
        if parts:
            profile_info = f"\n\n[Verified Citizen Profile: {', '.join(parts)}]"

    full_system = f"{SYSTEM_INSTRUCTION}{profile_info}"
    messages = state.get("messages", [])
    if not messages or not isinstance(messages[0], SystemMessage):
        return {"messages": [SystemMessage(content=full_system)]}
    return {}


def agent_node(state: AgentState, config: RunnableConfig | None = None) -> dict[str, Any]:
    """Invokes the configured LLM provider (Gemini or local CLI) with tools bound."""
    messages = state["messages"]
    token_usage = state.get("token_usage") or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

    provider = (getattr(settings, "LLM_PROVIDER", None) or "gemini").lower()
    if provider == "agy":
        from app.modules.chat.agent_orchestrator import _call_agy_cli
        api_res = _call_agy_cli(messages, SYSTEM_INSTRUCTION)
        if not api_res:
            return {
                "turn_status": "service_unavailable",
                "error_code": "AGY_PROVIDER_FAILURE",
                "messages": [AIMessage(content="Service temporarily unavailable.")],
            }
        parts = api_res.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        fc = [p["functionCall"] for p in parts if "functionCall" in p]
        if fc:
            tool_calls = [{"name": f["name"], "args": f.get("args", {}), "id": str(uuid.uuid4())} for f in fc]
            return {"messages": [AIMessage(content="", tool_calls=tool_calls)]}
        text = "".join(p.get("text", "") for p in parts if "text" in p)
        return {"messages": [AIMessage(content=text)]}

    elif provider == "groq":
        from app.modules.chat.groq_provider import call_groq_for_langgraph
        groq_res = call_groq_for_langgraph(messages)
        if groq_res:
            ai_msg, usage_dict, groq_model = groq_res
            new_token_usage = {
                "prompt_tokens": token_usage.get("prompt_tokens", 0) + usage_dict.get("prompt_tokens", 0),
                "completion_tokens": token_usage.get("completion_tokens", 0) + usage_dict.get("completion_tokens", 0),
                "total_tokens": token_usage.get("total_tokens", 0) + usage_dict.get("total_tokens", 0),
            }
            return {"messages": [ai_msg], "token_usage": new_token_usage}

        logger.warning("⚠️ [LangGraph Groq] Groq failed. Falling back to local CLI AI (agy)...")
        from app.modules.chat.agent_orchestrator import _call_agy_cli, SYSTEM_INSTRUCTION
        api_res = _call_agy_cli(messages, SYSTEM_INSTRUCTION)
        if api_res:
            parts = api_res.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            fc = [p["functionCall"] for p in parts if "functionCall" in p]
            if fc:
                tool_calls = [{"name": f["name"], "args": f.get("args", {}), "id": str(uuid.uuid4())} for f in fc]
                return {"messages": [AIMessage(content="", tool_calls=tool_calls)]}
            text = "".join(p.get("text", "") for p in parts if "text" in p)
            return {"messages": [AIMessage(content=text)]}

        return {
            "turn_status": "service_unavailable",
            "error_code": "GROQ_INVOCATION_FAILURE",
            "messages": [AIMessage(content="Service temporarily unavailable.")],
        }

    # Default Google Gemini GenAI LLM with Groq failover
    try:
        model_name = settings.GEMINI_MODEL or "gemini-3.8-flash"
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.2,
            max_output_tokens=1024,
        )
        model_with_tools = llm.bind_tools(LANGGRAPH_TOOLS)
        response = model_with_tools.invoke(messages)

        usage = getattr(response, "usage_metadata", None) or {}
        prompt_tokens = usage.get("input_tokens", 0)
        completion_tokens = usage.get("output_tokens", 0)
        new_token_usage = {
            "prompt_tokens": token_usage.get("prompt_tokens", 0) + prompt_tokens,
            "completion_tokens": token_usage.get("completion_tokens", 0) + completion_tokens,
            "total_tokens": token_usage.get("total_tokens", 0) + prompt_tokens + completion_tokens,
        }

        return {"messages": [response], "token_usage": new_token_usage}
    except Exception as e:
        logger.warning(f"⚠️ [LangGraph agent_node] Gemini LLM execution failed/rate-limited: {e}")

        # Seamless failover to Groq AI on rate-limit (429) or error
        if getattr(settings, "GROQ_API_KEY", None):
            logger.info("⚡ [LangGraph Failover] Failing over seamlessly to Groq AI...")
            from app.modules.chat.groq_provider import call_groq_for_langgraph
            groq_res = call_groq_for_langgraph(messages)
            if groq_res:
                ai_msg, usage_dict, groq_model = groq_res
                new_token_usage = {
                    "prompt_tokens": token_usage.get("prompt_tokens", 0) + usage_dict.get("prompt_tokens", 0),
                    "completion_tokens": token_usage.get("completion_tokens", 0) + usage_dict.get("completion_tokens", 0),
                    "total_tokens": token_usage.get("total_tokens", 0) + usage_dict.get("total_tokens", 0),
                }
                logger.info(f"✅ [LangGraph Failover Success] Handled by Groq model {groq_model}.")
                return {"messages": [ai_msg], "token_usage": new_token_usage}

        # Secondary failover to Local CLI AI (agy) if Groq also unavailable or failed
        logger.info("⚡ [LangGraph Failover] Falling back to local CLI AI (agy)...")
        from app.modules.chat.agent_orchestrator import _call_agy_cli, SYSTEM_INSTRUCTION
        api_res = _call_agy_cli(messages, SYSTEM_INSTRUCTION)
        if api_res:
            parts = api_res.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            fc = [p["functionCall"] for p in parts if "functionCall" in p]
            if fc:
                tool_calls = [{"name": f["name"], "args": f.get("args", {}), "id": str(uuid.uuid4())} for f in fc]
                return {"messages": [AIMessage(content="", tool_calls=tool_calls)]}
            text = "".join(p.get("text", "") for p in parts if "text" in p)
            return {"messages": [AIMessage(content=text)]}

        logger.error(f"❌ [LangGraph agent_node] Both primary and fallback failed: {e}", exc_info=True)
        return {
            "turn_status": "service_unavailable",
            "error_code": "AI_RATE_LIMIT_EXCEEDED" if "429" in str(e) or "rate" in str(e).lower() else "GEMINI_INVOCATION_FAILURE",
            "messages": [AIMessage(content="I'm having trouble connecting right now. Please try again in a moment.")],
        }


def should_continue(state: AgentState) -> Literal["tools", "format_output"]:
    """Determines if the agent requested tool execution or generated final text."""
    if state.get("turn_status") in ("service_unavailable", "rate_limit_exceeded"):
        return "format_output"

    messages = state.get("messages", [])
    if not messages:
        return "format_output"

    last_msg = messages[-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return "format_output"


def tools_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """Executes requested local backend tools and captures citations, sources, and latency."""
    db: Session | None = config.get("configurable", {}).get("db")
    user_profile = state.get("user_profile")
    citations = list(state.get("citations", []))
    sources = list(state.get("sources", []))
    procedural_tools = list(state.get("procedural_tools_executed", []))

    last_msg = state["messages"][-1]
    tool_messages = []

    for tc in last_msg.tool_calls:
        fn_name = tc["name"]
        fn_args = tc["args"]
        call_id = tc.get("id") or str(uuid.uuid4())
        t_start = time.perf_counter()

        result: dict[str, Any] = {}
        matched_count = 0

        if fn_name == "check_eligibility":
            result = execute_check_eligibility(db, user_profile, fn_args)
            matched_count = result.get("total_matched_count", 0)
            for s in result.get("schemes", []):
                slug = s.get("slug")
                name = s.get("name") or slug
                if slug:
                    if slug not in citations:
                        citations.append(slug)
                    if not any(src["slug"] == slug for src in sources):
                        sources.append({"title": name, "slug": slug})

        elif fn_name == "search_schemes_directory":
            result = execute_search_schemes_directory(db, fn_args)
            matched_count = result.get("total_count_in_directory", 0)
            for s in result.get("sample_schemes", []):
                slug = s.get("slug")
                name = s.get("name") or slug
                if slug:
                    if slug not in citations:
                        citations.append(slug)
                    if not any(src["slug"] == slug for src in sources):
                        sources.append({"title": name, "slug": slug})

        elif fn_name == "get_scheme_details":
            result = execute_get_scheme_details(db, fn_args)
            matched_count = 1 if result.get("status") == "success" else 0
            slug = result.get("slug")
            name = result.get("name") or slug
            if slug:
                if slug not in citations:
                    citations.append(slug)
                if not any(src["slug"] == slug for src in sources):
                    sources.append({"title": name, "slug": slug})

        elif fn_name == "browse_schemes_and_knowledge":
            result = execute_browse_schemes_and_knowledge(db, fn_args)
            matched_count = result.get("total_count", 0)
            for s in result.get("schemes", []):
                slug = s.get("slug")
                name = s.get("name") or slug
                if slug:
                    if slug not in citations:
                        citations.append(slug)
                    if not any(src["slug"] == slug for src in sources):
                        sources.append({"title": name, "slug": slug})

        else:
            result = {"status": "error", "message": f"Unknown tool '{fn_name}'"}

        t_duration = int((time.perf_counter() - t_start) * 1000)
        procedural_tools.append({
            "name": fn_name,
            "args": fn_args,
            "duration_ms": t_duration,
            "status": result.get("status", "success"),
            "matched_count": matched_count,
        })

        tool_messages.append(
            ToolMessage(content=json.dumps(result), name=fn_name, tool_call_id=call_id)
        )

    return {
        "messages": tool_messages,
        "citations": citations,
        "sources": sources,
        "procedural_tools_executed": procedural_tools,
    }


def format_output_node(state: AgentState, config: RunnableConfig) -> dict[str, Any]:
    """Assembles the 4-tier Agentic Memory Trace for LangSmith and frontend inspector drawer."""
    user_profile = state.get("user_profile")
    token_usage = state.get("token_usage") or {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
    procedural_tools = state.get("procedural_tools_executed") or []
    messages = state.get("messages", [])

    recalled_facts = []
    if user_profile:
        for k in ["state", "district", "age", "gender", "occupation", "annual_income", "caste_category"]:
            val = user_profile.get(k)
            if val is not None and str(val).strip() != "":
                formatted_val = f"₹{val:,}" if k == "annual_income" and isinstance(val, (int, float)) else str(val)
                recalled_facts.append({"key": k, "value": formatted_val, "status": "IN_PROMPT"})

    history_events = []
    for m in messages[-6:]:
        if isinstance(m, (HumanMessage, AIMessage)) and m.content:
            sender = "user" if isinstance(m, HumanMessage) else "assistant"
            history_events.append({
                "sender": sender,
                "snippet": m.content[:90] + ("..." if len(m.content) > 90 else ""),
                "timestamp": str(time.time()),
            })

    memory_trace = {
        "working_memory": {
            "model_name": getattr(settings, "GEMINI_MODEL", "gemini-3.8-flash"),
            "provider": getattr(settings, "LLM_PROVIDER", "gemini"),
            "system_instruction_summary": SYSTEM_INSTRUCTION[:140] + "...",
            "iterations_count": len(procedural_tools) + 1,
            "prompt_tokens": token_usage.get("prompt_tokens", 0),
            "completion_tokens": token_usage.get("completion_tokens", 0),
            "total_tokens": token_usage.get("total_tokens", 0),
            "turn_duration_ms": 0,
        },
        "semantic_memory": {
            "recalled_facts_count": len(recalled_facts),
            "recalled_facts": recalled_facts,
            "profile_summary": user_profile or {},
        },
        "episodic_memory": {
            "session_turns_count": len(messages),
            "history_events": history_events,
        },
        "procedural_memory": {
            "available_tools_count": len(LANGGRAPH_TOOLS),
            "tools_executed_count": len(procedural_tools),
            "tools_executed": procedural_tools,
        },
    }

    return {"memory_trace": memory_trace}


# ============================================================================
# COMPILE STATEGRAPH WORKFLOW
# ============================================================================

def create_chat_workflow() -> Any:
    workflow = StateGraph(AgentState)

    workflow.add_node("enrich_context", enrich_context_node)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("format_output", format_output_node)

    workflow.add_edge(START, "enrich_context")
    workflow.add_edge("enrich_context", "agent")
    workflow.add_conditional_edges("agent", should_continue, ["tools", "format_output"])
    workflow.add_edge("tools", "agent")
    workflow.add_edge("format_output", END)

    return workflow.compile()


chat_graph = create_chat_workflow()
