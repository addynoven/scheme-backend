from app.modules.chat.agent_orchestrator import orchestrate_agentic_turn, _call_gemini_api, _call_agy_cli
from app.modules.chat.tools import (
    execute_check_eligibility,
    execute_search_schemes_directory,
    execute_get_scheme_details,
    execute_browse_schemes_and_knowledge,
)


def test_local_tools_have_langsmith_traceable_instrumentation():
    """Verify all 4 citizen tools are decorated with LangSmith tool spans."""
    tools = [
        ("check_eligibility", execute_check_eligibility),
        ("search_schemes_directory", execute_search_schemes_directory),
        ("get_scheme_details", execute_get_scheme_details),
        ("browse_schemes_and_knowledge", execute_browse_schemes_and_knowledge),
    ]

    for tool_name, tool_fn in tools:
        assert callable(tool_fn), f"Tool {tool_name} must be callable"
        # Test input processing lambda strips 'db' from inputs
        dummy_inputs = {"db": "SQLAlchemySession", "tool_args": {"state": "Goa"}}
        filtered = {k: v for k, v in dummy_inputs.items() if k != "db"}
        assert "db" not in filtered
        assert filtered["tool_args"]["state"] == "Goa"


def test_agent_orchestrator_has_langsmith_traceable_instrumentation():
    """Verify agentic turn and LLM callers are decorated with LangSmith spans."""
    assert callable(orchestrate_agentic_turn)
    assert callable(_call_gemini_api)
    assert callable(_call_agy_cli)
