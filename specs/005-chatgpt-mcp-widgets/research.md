# Research: ChatGPT App — MCP Server + React Widgets

**Feature**: `005-chatgpt-mcp-widgets` | **Date**: 2026-06-07

---

## 1. OpenAI Apps SDK / MCP Server Architecture

**Decision**: Use `fastmcp` (Python) as the MCP server framework.

**Rationale**: FastMCP provides `@mcp.tool()` decorators, built-in `BearerAuthProvider` for JWT validation, HTTP transport compatible with ChatGPT's JSON-RPC 2.0 protocol, and Vercel-compatible deployment. It maps cleanly to the existing FastAPI backend pattern.

**Alternatives considered**:
- Raw `mcp` SDK: More boilerplate; FastMCP wraps it with ergonomic decorators
- FastAPI as the MCP transport: Non-standard; ChatGPT expects the MCP protocol, not REST

**Tool definition pattern**:
```python
@mcp.tool()
async def get_chapter(slug: str) -> ChapterPanel:
    """Fetch and display a course chapter by slug."""
    data = await backend.get(f"/chapters/{slug}")
    return ChapterPanel(**data)
```

**Visual panel format**: Tool responses are Pydantic models serialized to JSON. ChatGPT renders the `content` field as a panel with optional `actions` (buttons that trigger further tool calls without a new user message). Panels are rendered inside the conversation thread.

---

## 2. Stytch Connected Apps OAuth

**Decision**: Use `BearerAuthProvider` with Stytch JWKS URI in FastMCP. MCP server forwards the Bearer token downstream to FastAPI — no re-validation at the MCP layer.

**Rationale**: The FastAPI backend already validates Stytch JWTs via `sessions.authenticate_jwt()`. Adding a second validation in the MCP server would duplicate logic and add latency. The MCP server only needs to verify presence of a token for protected tools; full validation happens in FastAPI.

**Alternatives considered**:
- Full JWT validation in MCP server: Redundant given backend already validates; doubles JWKS calls
- Session-based auth: ChatGPT OAuth flow only provides Bearer tokens; sessions not applicable

**Required env vars** (MCP server only):
```
STYTCH_PROJECT_DOMAIN=https://<project-id>.api.stytch.com
STYTCH_PROJECT_ID=<project-id>
BACKEND_URL=https://api.claudeteacher.example.com
```

**JWKS URI**: `${STYTCH_PROJECT_DOMAIN}/.well-known/jwks.json`  
**Algorithm**: RS256  
**Audience**: `STYTCH_PROJECT_ID`

**Public vs protected tools**:
- Public (no auth required): `list_chapters`, `get_chapter`, `search_content`
- Protected (Bearer token required): `get_quiz`, `submit_quiz`, `get_progress`, `check_access`

---

## 3. Existing Backend API Surface

All 7 MCP tools map to existing, stable FastAPI endpoints — no backend changes needed:

| MCP Tool | Backend Endpoint | Auth Required |
|----------|-----------------|---------------|
| `list_chapters` | `GET /chapters` | No |
| `get_chapter` | `GET /chapters/{slug}` | No |
| `get_quiz` | `GET /quizzes/{chapter_slug}` | No (fetch) |
| `submit_quiz` | `POST /quizzes/{chapter_slug}/submit` | Yes |
| `get_progress` | `GET /users/{user_id}/progress` | Yes |
| `search_content` | `GET /search?q={query}&limit=20` | No |
| `check_access` | `GET /access/check?resource=...` | Yes |

**Key finding**: Backend is fully implemented and stable. The MCP server is purely an adapter layer.

---

## 4. React Widget Bundle

**Decision**: Build React 19 components with Vite, bundled as static HTML/JS. ChatGPT renders the panel content from the tool response.

**Rationale**: React 19 is already in the project tech stack (web-app). Vite produces optimized bundles. Components can be developed and tested independently before ChatGPT integration.

**Alternatives considered**:
- Plain HTML/CSS panels without React: Simpler but inconsistent with project stack; no component reuse
- Next.js for widgets: Overkill; no SSR needed for embeddable panels

**Widget → tool mapping**:
| Widget | Tool(s) |
|--------|---------|
| ChapterList | `list_chapters` |
| ChapterReader | `get_chapter` |
| QuizPanel | `get_quiz`, `submit_quiz` |
| ProgressDashboard | `get_progress` |
| SearchResults | `search_content` |
| AccessStatus | `check_access` |

---

## 5. Deployment

**Decision**: MCP server deployed to Vercel (Python serverless functions), same account as backend. Widgets bundled and served as static assets from the MCP server or a Vercel static site.

**Rationale**: Vercel already hosts the backend; consistent deployment model. Python serverless functions support FastMCP's HTTP transport. No additional infrastructure needed.

**Manifest**: `chatgpt-app/manifest.yaml` declares all tools, OAuth config, and the MCP server base URL. This is submitted to OpenAI Apps dashboard for review.

---

## Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| FastMCP version and API | `fastmcp>=2.0` — provides `BearerAuthProvider`, `@mcp.tool()`, HTTP transport |
| Widget rendering format | Pydantic models serialized to JSON; `content` + `actions` fields drive panel UI |
| Auth token handling | MCP forwards Bearer header to FastAPI; FastAPI validates against Stytch JWKS |
| chatgpt-app/ directory | Needs to be created from scratch — empty currently |
| Backend changes needed | None — all 7 tools map to existing stable endpoints |
