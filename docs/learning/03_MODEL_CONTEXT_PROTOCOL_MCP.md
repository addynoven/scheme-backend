# 📖 Chapter 3: Model Context Protocol (MCP) — Building Agent-Ready Systems

> **Milestone:** V3.5 / Phase 7  
> **Core Concept:** How Anthropic's open Model Context Protocol (MCP) lets autonomous AI agents (Claude, Cursor, Antigravity) use our backend as a native set of tools.

---

## 1. What is Model Context Protocol (MCP)?

Before MCP, if you wanted an AI agent to interact with your backend, you had to write custom tool schemas for OpenAI, custom function calling for Anthropic, and custom plugins for IDEs.

**MCP is the open "USB-C standard" for AI agents.** It is an open protocol specification (using JSON-RPC 2.0) that standardizes how LLM agents discover and invoke capabilities on external servers.

```text
┌────────────────────────────────────────────────────────┐
│                    AI CLIENT / AGENT                   │
│         (Claude Desktop, Cursor IDE, Antigravity)      │
└───────────────────────────┬────────────────────────────┘
                            │
                            │  Standard MCP Protocol (JSON-RPC over STDIO or SSE)
                            │
┌───────────────────────────▼────────────────────────────┐
│                    OUR MCP SERVER                      │
│            (app/modules/mcp/server.py)                 │
├────────────────────────────────────────────────────────┤
│  Tools:                                                │
│    • find_schemes(keyword, state)                      │
│    • check_eligibility(user_id, scheme_slug)           │
│    • get_scheme_readiness(user_id, scheme_slug)        │
│    • get_verified_facts(user_id)                       │
│    • get_official_source(scheme_slug)                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
      Application Services (Postgres, Rules, OKF, S3)
```

---

## 2. The 3 Core Primitives of MCP

| Primitive | What It Is | Example in Our Benefits Navigator |
| :--- | :--- | :--- |
| **Tools** | Executable actions that the agent can call with structured parameters. | `check_eligibility(age=24, income=150000, state="Madhya Pradesh")` |
| **Resources** | Read-only data URIs providing context to the agent. | `scheme://pm-kisan-samman-nidhi` (returns canonical OKF markdown) |
| **Prompts** | Pre-packaged prompt templates for common workflows. | `prompt://eligibility_audit_report` |

---

## 3. Building an MCP Server in Python with FastMCP

Using the official Python `mcp` SDK (or `FastMCP`), writing an agent-ready server takes only a few lines of code:

```python
from mcp.server.fastmcp import FastMCP
from app.database import SessionLocal
from app.modules.schemes.service import list_schemes, get_scheme_by_slug
from app.modules.eligibility.engine import evaluate_scheme_eligibility
from app.modules.auth.service import get_citizen_facts_audit

# Initialize MCP Server
mcp = FastMCP("Government Benefits Navigator")

@mcp.tool()
def find_schemes(query: str, state: str | None = None) -> str:
    """Search the official government scheme catalog by need or persona."""
    db = SessionLocal()
    try:
        schemes, total = list_schemes(db=db, search=query, state=state, limit=5)
        return f"Found {total} schemes: " + ", ".join([s.title for s in schemes])
    finally:
        db.close()

@mcp.tool()
def check_citizen_eligibility(user_id: int, scheme_slug: str) -> dict:
    """Evaluate deterministic eligibility for a citizen based on their verified profile facts."""
    db = SessionLocal()
    try:
        audit = get_citizen_facts_audit(db, user_id=user_id)
        scheme = get_scheme_by_slug(db, scheme_slug)
        if not scheme:
            return {"error": f"Scheme '{scheme_slug}' not found."}
        
        # Run deterministic rules engine
        result = evaluate_scheme_eligibility(scheme=scheme, citizen_facts=audit.verified_facts)
        return {
            "scheme": scheme.title,
            "status": result.status,  # eligible, nearly_eligible, not_eligible
            "score": result.score,
            "passed_rules": result.passed_criteria,
            "failed_rules": result.failed_criteria,
        }
    finally:
        db.close()

if __name__ == "__main__":
    mcp.run()
```

---

## 4. How Any AI Agent Connects to Our App

When configured in Claude Desktop (`claude_desktop_config.json`) or Cursor or Antigravity:

```json
{
  "mcpServers": {
    "gov-benefits": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.modules.mcp.server"]
    }
  }
}
```

Now, when a user asks their AI:
> *"What schemes in Madhya Pradesh am I eligible for?"*

The AI automatically:
1. Calls `get_verified_facts(user_id=1)`
2. Calls `find_schemes(state="Madhya Pradesh")`
3. Calls `check_citizen_eligibility(user_id=1, scheme_slug="ladli-behna")`
4. Explains the result with 100% mathematical accuracy and zero hallucination!

---

## 📚 Recommended External Resources to Read

1. **Official Model Context Protocol:**
   - [Official MCP Specification & Docs](https://modelcontextprotocol.io/)
   - [Anthropic MCP Announcement & Architecture](https://www.anthropic.com/news/model-context-protocol)
   - [Official Python MCP SDK on GitHub](https://github.com/modelcontextprotocol/python-sdk)
2. **Interactive Tutorials:**
   - [Building your first MCP Server (Step-by-Step)](https://modelcontextprotocol.io/quickstart/server)
