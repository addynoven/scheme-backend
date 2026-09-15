import json
from unittest.mock import MagicMock, patch
import urllib.error
import pytest

from app.core.config import settings
from app.modules.chat.agent_orchestrator import _call_gemini_api, orchestrate_agentic_turn
from app.modules.chat.chat_graph import agent_node
from app.modules.chat.groq_provider import call_groq_api, call_groq_for_langgraph
from langchain_core.messages import AIMessage, HumanMessage


def test_call_groq_api_text_generation():
    """Verify call_groq_api handles text generation correctly with mocked Groq client."""
    mock_choice = MagicMock()
    mock_choice.message.content = "Namaste! PM Kisan provides ₹6,000 annually."
    mock_choice.message.tool_calls = None

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_completion.usage.prompt_tokens = 42
    mock_completion.usage.completion_tokens = 15
    mock_completion.usage.total_tokens = 57

    with patch("groq.Groq") as mock_groq_cls:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        mock_groq_cls.return_value = mock_client

        with patch.object(settings, "GROQ_API_KEY", "test_groq_key"):
            res = call_groq_api(
                contents=[{"role": "user", "parts": [{"text": "Tell me about PM Kisan"}]}],
                system_instruction="You are a helpful assistant.",
            )

            assert res is not None
            assert res["provider"] == "groq"
            cand = res["candidates"][0]
            assert cand["content"]["parts"][0]["text"] == "Namaste! PM Kisan provides ₹6,000 annually."
            assert res["usageMetadata"]["totalTokenCount"] == 57


def test_call_groq_api_tool_calls():
    """Verify call_groq_api correctly parses function/tool calls from Groq response."""
    mock_tool_call = MagicMock()
    mock_tool_call.function.name = "check_eligibility"
    mock_tool_call.function.arguments = json.dumps({"state": "Madhya Pradesh", "category": "Education"})

    mock_choice = MagicMock()
    mock_choice.message.content = None
    mock_choice.message.tool_calls = [mock_tool_call]

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_completion.usage.prompt_tokens = 50
    mock_completion.usage.completion_tokens = 20
    mock_completion.usage.total_tokens = 70

    with patch("groq.Groq") as mock_groq_cls:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        mock_groq_cls.return_value = mock_client

        with patch.object(settings, "GROQ_API_KEY", "test_groq_key"):
            res = call_groq_api(
                contents=[{"role": "user", "parts": [{"text": "Am I eligible for scholarships in MP?"}]}],
                system_instruction="You are a welfare advisor.",
            )

            assert res is not None
            assert res["provider"] == "groq"
            parts = res["candidates"][0]["content"]["parts"]
            assert len(parts) == 1
            assert "functionCall" in parts[0]
            assert parts[0]["functionCall"]["name"] == "check_eligibility"
            assert parts[0]["functionCall"]["args"]["state"] == "Madhya Pradesh"


def test_call_groq_for_langgraph():
    """Verify call_groq_for_langgraph returns an AIMessage compatible with LangGraph StateGraph."""
    mock_tool_call = MagicMock()
    mock_tool_call.id = "call_abc123"
    mock_tool_call.function.name = "search_schemes_directory"
    mock_tool_call.function.arguments = json.dumps({"state": "Uttar Pradesh"})

    mock_choice = MagicMock()
    mock_choice.message.content = "Searching the scheme database for Uttar Pradesh..."
    mock_choice.message.tool_calls = [mock_tool_call]

    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_completion.usage.prompt_tokens = 60
    mock_completion.usage.completion_tokens = 25
    mock_completion.usage.total_tokens = 85

    with patch("groq.Groq") as mock_groq_cls:
        mock_client = MagicMock()
        mock_client.chat.completions.create.return_value = mock_completion
        mock_groq_cls.return_value = mock_client

        with patch.object(settings, "GROQ_API_KEY", "test_groq_key"):
            groq_res = call_groq_for_langgraph(
                messages=[HumanMessage(content="How many schemes in Uttar Pradesh?")]
            )

            assert groq_res is not None
            msg, usage, model = groq_res
            assert isinstance(msg, AIMessage)
            assert "Searching the scheme database" in msg.content
            assert len(msg.tool_calls) == 1
            tc = msg.tool_calls[0]
            assert tc["name"] == "search_schemes_directory"
            assert tc["args"]["state"] == "Uttar Pradesh"
            assert msg.response_metadata["provider"] == "groq"
            assert usage["total_tokens"] == 85
            assert model == "qwen/qwen3.8-27b"


def test_gemini_429_rate_limit_failover_to_groq():
    """Verify that when Gemini returns HTTP 429, orchestrator seamlessly fails over to Groq."""
    http_429_err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        code=429,
        msg="Too Many Requests: ResourceExhausted quota exceeded",
        hdrs={},
        fp=None,
    )

    groq_mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Groq Failover: Ladli Behna Yojana provides ₹1,250 monthly to women in MP."}]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 30, "candidatesTokenCount": 20, "totalTokenCount": 50},
        "actual_model": "qwen/qwen3.8-27b",
        "provider": "groq",
    }

    with patch("urllib.request.urlopen", side_effect=http_429_err), \
         patch("app.modules.chat.groq_provider.call_groq_api", return_value=groq_mock_response) as mock_groq:

        with patch.object(settings, "GROQ_API_KEY", "test_groq_key"), \
             patch.object(settings, "GEMINI_API_KEY", "test_gemini_key"):

            res = _call_gemini_api(
                contents=[{"role": "user", "parts": [{"text": "Tell me about Ladli Behna"}]}],
                system_instruction="Citizen Welfare AI",
            )

            assert res is not None
            assert res["provider"] == "groq"
            assert res["actual_model"] == "qwen/qwen3.8-27b"
            assert "Ladli Behna Yojana provides ₹1,250" in res["candidates"][0]["content"]["parts"][0]["text"]
            mock_groq.assert_called_once()


def test_langgraph_agent_node_failover_to_groq():
    """Verify that in LangGraph StateGraph, agent_node fails over to Groq if Gemini fails."""
    groq_ai_msg = AIMessage(
        content="LangGraph Groq Failover Response: You are eligible for PM Awas Yojana.",
        response_metadata={"provider": "groq", "model": "qwen/qwen3.8-27b"},
    )

    state = {
        "messages": [HumanMessage(content="Am I eligible for housing scheme?")],
        "turns": 0,
        "active_topic": None,
        "detected_intent": None,
        "token_usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }

    with patch("langchain_google_genai.ChatGoogleGenerativeAI", side_effect=RuntimeError("Gemini 429 Quota Exceeded")), \
         patch("app.modules.chat.groq_provider.call_groq_for_langgraph", return_value=(groq_ai_msg, {"prompt_tokens": 15, "completion_tokens": 10, "total_tokens": 25}, "qwen/qwen3.8-27b")) as mock_groq_lg:

        with patch.object(settings, "GROQ_API_KEY", "test_groq_key"), \
             patch.object(settings, "GEMINI_API_KEY", "test_gemini_key"), \
             patch.object(settings, "LLM_PROVIDER", "gemini"):

            new_state = agent_node(state)
            assert len(new_state["messages"]) == 1
            result_msg = new_state["messages"][0]
            assert isinstance(result_msg, AIMessage)
            assert "LangGraph Groq Failover Response" in result_msg.content
            assert new_state["token_usage"]["total_tokens"] == 25
            mock_groq_lg.assert_called_once()



def test_groq_rate_limit_failover_to_agy_cli():
    """Verify that when provider=groq and Groq hits rate limit/fails, orchestrator falls back to agy CLI."""
    agy_mock_response = {
        "candidates": [{"content": {"parts": [{"text": "Local agy CLI fallback response for citizen."}]}}],
        "usageMetadata": {"promptTokenCount": 20, "candidatesTokenCount": 15, "totalTokenCount": 35},
        "provider": "agy",
    }

    with patch("app.modules.chat.groq_provider.call_groq_api", return_value=None), \
         patch("app.modules.chat.agent_orchestrator._call_agy_cli", return_value=agy_mock_response) as mock_agy:

        with patch.object(settings, "LLM_PROVIDER", "groq"):
            from app.modules.chat.agent_orchestrator import call_llm_provider
            res = call_llm_provider(
                contents=[{"role": "user", "parts": [{"text": "Hello"}]}],
                system_instruction="Advisor",
            )

            assert res is not None
            assert res["provider"] == "agy"
            assert "Local agy CLI fallback" in res["candidates"][0]["content"]["parts"][0]["text"]
            mock_agy.assert_called_once()


def test_gemini_and_groq_429_failover_to_agy_cli():
    """Verify that when Gemini 429 occurs and Groq also fails, orchestrator falls back to agy CLI."""
    http_429_err = urllib.error.HTTPError(
        url="https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        code=429,
        msg="Too Many Requests: ResourceExhausted",
        hdrs={},
        fp=None,
    )

    agy_mock_response = {
        "candidates": [{"content": {"parts": [{"text": "Local agy CLI handled request after Gemini & Groq 429."}]}}],
        "usageMetadata": {"promptTokenCount": 25, "candidatesTokenCount": 15, "totalTokenCount": 40},
        "provider": "agy",
    }

    with patch("urllib.request.urlopen", side_effect=http_429_err), \
         patch("app.modules.chat.groq_provider.call_groq_api", return_value=None), \
         patch("app.modules.chat.agent_orchestrator._call_agy_cli", return_value=agy_mock_response) as mock_agy:

        with patch.object(settings, "GEMINI_API_KEY", "test_gemini_key"), \
             patch.object(settings, "GROQ_API_KEY", "test_groq_key"):

            res = _call_gemini_api(
                contents=[{"role": "user", "parts": [{"text": "Hello"}]}],
                system_instruction="Advisor",
            )

            assert res is not None
            assert res["provider"] == "agy"
            assert "after Gemini & Groq 429" in res["candidates"][0]["content"]["parts"][0]["text"]
            mock_agy.assert_called_once()


def test_langgraph_gemini_and_groq_failover_to_agy_cli():
    """Verify that in LangGraph agent_node, when Gemini and Groq fail, it falls back to agy CLI."""
    state = {
        "messages": [HumanMessage(content="Check schemes for farmer in MP")],
        "turns": 0,
        "active_topic": None,
        "detected_intent": None,
        "token_usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
    }

    agy_mock_response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {
                            "functionCall": {
                                "name": "check_eligibility",
                                "args": {"state": "Madhya Pradesh", "occupation": "farmer"},
                            }
                        }
                    ]
                }
            }
        ],
        "usageMetadata": {"promptTokenCount": 30, "candidatesTokenCount": 15, "totalTokenCount": 45},
    }

    with patch("langchain_google_genai.ChatGoogleGenerativeAI", side_effect=RuntimeError("Gemini 429")), \
         patch("app.modules.chat.groq_provider.call_groq_for_langgraph", return_value=None), \
         patch("app.modules.chat.agent_orchestrator._call_agy_cli", return_value=agy_mock_response) as mock_agy:

        with patch.object(settings, "LLM_PROVIDER", "gemini"), \
             patch.object(settings, "GEMINI_API_KEY", "test_gemini_key"), \
             patch.object(settings, "GROQ_API_KEY", "test_groq_key"):

            new_state = agent_node(state)
            assert len(new_state["messages"]) == 1
            ai_msg = new_state["messages"][0]
            assert isinstance(ai_msg, AIMessage)
            assert len(ai_msg.tool_calls) == 1
            assert ai_msg.tool_calls[0]["name"] == "check_eligibility"
            assert ai_msg.tool_calls[0]["args"]["occupation"] == "farmer"
            mock_agy.assert_called_once()

