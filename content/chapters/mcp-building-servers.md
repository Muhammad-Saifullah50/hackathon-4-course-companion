# MCP Building Servers

## Introduction

Building an MCP server means exposing your tools, data, and capabilities to any MCP-compatible AI client. Once built, your server works with Claude Desktop, Cursor, custom agents, and any other MCP host — with no additional integration work.

This chapter walks through building production-ready MCP servers with the Python MCP SDK.

## Core Concepts

### Server Anatomy

An MCP server is a Python process that:
1. Declares its capabilities (tools, resources, prompts)
2. Handles incoming JSON-RPC requests
3. Returns results in the MCP response format

The Python SDK handles the protocol layer. You focus on business logic.

### Tool Definition

Tools are the most common MCP primitive. A tool needs:
- **Name**: unique identifier (snake_case)
- **Description**: tells the LLM when and how to use it
- **Input schema**: JSON Schema defining parameters
- **Handler**: Python function that executes the tool

### Resource Patterns

Resources expose read-only data. Two URI patterns:
- **Static**: `file:///documents/readme.txt` — fixed content
- **Dynamic**: `db://users/{id}` — parameterized content via templates

### Prompts

Prompts are reusable templates. They receive arguments and return a list of messages ready to inject into a conversation.

### Lifecycle Hooks

Servers can hook into the MCP lifecycle:
- `startup` — initialize connections, load config
- `shutdown` — clean up resources gracefully

## Code Examples

### Minimal MCP Server

```python
from mcp.server import FastMCP

mcp = FastMCP("Course Assistant")

@mcp.tool()
def get_chapter_list() -> list[dict]:
    """Return all available course chapters in order."""
    return [
        {"slug": "claude-agent-sdk-foundations", "title": "Claude Agent SDK Foundations", "order": 1},
        {"slug": "claude-agent-sdk-advanced", "title": "Claude Agent SDK Advanced", "order": 2},
    ]

@mcp.tool()
def get_chapter(slug: str) -> str:
    """Fetch the full content of a chapter by slug.
    
    Args:
        slug: The chapter identifier (e.g. 'claude-agent-sdk-foundations')
    """
    import httpx
    response = httpx.get(f"http://backend/chapters/{slug}")
    response.raise_for_status()
    return response.json()["content"]

if __name__ == "__main__":
    mcp.run()
```

### Server with Resources

```python
@mcp.resource("course://chapters/{slug}")
async def chapter_resource(slug: str) -> str:
    """Expose a chapter as a readable resource."""
    content = await fetch_chapter_content(slug)
    return content

@mcp.resource("course://manifest")
async def manifest_resource() -> str:
    """Expose the course manifest."""
    manifest = await fetch_manifest()
    return json.dumps(manifest, indent=2)
```

### Server with Prompts

```python
@mcp.prompt()
def explain_concept(concept: str, level: str = "beginner") -> list[dict]:
    """Generate a tutoring prompt for a concept."""
    return [
        {
            "role": "user",
            "content": f"Explain '{concept}' to a {level} student using examples from the course material."
        }
    ]
```

### Running as Subprocess (stdio)

```python
if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### Running as HTTP Server (SSE)

```python
if __name__ == "__main__":
    mcp.run(transport="sse", port=8001)
```

## Key Takeaways

- `FastMCP` is the high-level server builder — decorate functions to register tools, resources, prompts
- Tools are actions (write operations or complex queries); resources are data (read-only)
- Good tool descriptions are critical — the LLM reads them to decide when to use the tool
- Stdio transport for local subprocesses; SSE/WebSocket for remote servers
- The SDK handles protocol negotiation; you handle business logic
- Test your server independently before integrating with a host
