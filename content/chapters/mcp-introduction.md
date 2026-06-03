# MCP Introduction

## Introduction

The Model Context Protocol (MCP) is an open standard that defines how AI models communicate with external tools, data sources, and services. Think of MCP as USB-C for AI — a universal connector that lets any model talk to any tool using a single protocol.

In this chapter, we cover what MCP is, why it matters, and the fundamental concepts you need to start building with it.

## Core Concepts

### The Problem MCP Solves

Before MCP, every AI application needed custom integration code for every tool. Want to give your agent access to a database? Write a custom connector. A file system? Another custom connector. Calendar? Slack? GitHub? Each one required bespoke plumbing.

MCP standardizes this. A tool exposes itself as an MCP server once, and any MCP-compatible client (Claude, Cursor, other agents) can use it without custom integration work.

### Protocol Architecture

MCP is a client-server protocol over JSON-RPC 2.0. Three transport layers are supported:
- **stdio** — for local processes (subprocess communication)
- **SSE (Server-Sent Events)** — for remote HTTP servers
- **WebSocket** — for bidirectional streaming

### Three Primitives

MCP exposes three types of capabilities:

1. **Tools** — functions the LLM can call (like function calling)
2. **Resources** — read-only data the LLM can access (files, database rows, URLs)
3. **Prompts** — reusable prompt templates with parameters

### MCP Hosts and Clients

- **Host**: The application that embeds an LLM (e.g., Claude Desktop, Cursor, your app)
- **Client**: The MCP client library inside the host that speaks the protocol
- **Server**: The MCP server that exposes tools/resources/prompts

A host can connect to multiple servers simultaneously.

### Discovery and Initialization

When an MCP client connects to a server, it performs a handshake:
1. `initialize` — client declares its capabilities
2. `initialized` — server confirms the connection
3. `tools/list`, `resources/list`, `prompts/list` — client discovers available capabilities

## Code Examples

### Connecting to an MCP Server (Python SDK)

```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

server_params = StdioServerParameters(
    command="python",
    args=["my_server.py"],
)

async with stdio_client(server_params) as (read, write):
    async with ClientSession(read, write) as session:
        await session.initialize()
        
        # List available tools
        tools = await session.list_tools()
        for tool in tools.tools:
            print(f"Tool: {tool.name} — {tool.description}")
```

### Calling a Tool via MCP

```python
result = await session.call_tool(
    "search_database",
    arguments={"query": "AI agent patterns", "limit": 5}
)
print(result.content[0].text)
```

### Reading a Resource

```python
resource = await session.read_resource("file:///path/to/document.txt")
print(resource.contents[0].text)
```

## Key Takeaways

- MCP is an open standard for AI-tool communication — write once, use everywhere
- Three transport layers: stdio (local), SSE (HTTP), WebSocket (bidirectional)
- Three primitives: Tools (actions), Resources (data), Prompts (templates)
- Hosts embed the LLM; clients speak MCP; servers expose capabilities
- Discovery happens at connection time via list calls
- MCP eliminates the N×M integration problem in AI tooling
