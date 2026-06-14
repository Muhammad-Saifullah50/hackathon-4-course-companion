# Implementation Plan: ChatGPT App — MCP Server + React Widgets

**Branch**: `005-chatgpt-mcp-widgets` | **Date**: 2026-06-07 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/005-chatgpt-mcp-widgets/spec.md`

## Summary

Build the ChatGPT-facing layer of Claude Teacher: a Python FastMCP server that exposes 7 deterministic tools (chapters, quiz, progress, search, access), plus React widget bundles that render as visual panels inside ChatGPT conversations. The MCP server acts as a stateless proxy — it forwards every request to the existing FastAPI backend and returns structured panel responses. Authentication is handled by Stytch Connected Apps (OAuth 2.1), with the MCP server forwarding Bearer tokens downstream to FastAPI for validation. Zero LLM calls anywhere in this layer.

## Technical Context

**Language/Version**: Python 3.12 (MCP server), TypeScript + React 19 (widgets)  
**Primary Dependencies**: `fastmcp>=2.0`, `httpx>=0.27`, `pydantic>=2.0` (server); `react@19`, `vite@6`, `typescript@5` (widgets)  
**Storage**: N/A — MCP server is stateless; all data read from existing FastAPI backend  
**Testing**: pytest + httpx test client (MCP server); Vitest (widgets); manual ChatGPT Developer Mode  
**Target Platform**: ChatGPT App (OpenAI Apps SDK / MCP), deployed on Vercel  
**Project Type**: Web — two sub-projects (MCP server + widget bundle) under `chatgpt-app/`  
**Performance Goals**: <3 s search response; <1 s chapter load as perceived in ChatGPT  
**Constraints**: Phase 1 — zero LLM calls or LLM SDK imports anywhere in `chatgpt-app/`; MCP server must be publicly reachable over HTTPS  
**Scale/Scope**: 7 MCP tools, 5 user stories, single ChatGPT app manifest

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Zero-Backend-LLM (Phase 1) | ✅ PASS | MCP server is a deterministic proxy — no `anthropic`, `openai`, or LLM imports anywhere |
| Single Backend | ✅ PASS | MCP server calls existing FastAPI backend via httpx; no new DB access |
| Content in Cloudflare R2 | ✅ PASS | Content served by backend, which reads R2; MCP server never touches R2 directly |
| Repository layer | ✅ PASS | MCP server has no database access; backend service layer handles all DB ops |
| Pydantic v2 models | ✅ PASS | All tool input/output schemas use Pydantic v2 |
| Secrets in env vars | ✅ PASS | `STYTCH_PROJECT_DOMAIN`, `STYTCH_PROJECT_ID`, `BACKEND_URL` via env; never hardcoded |
| Freemium gating server-side | ✅ PASS | Access tier checked by FastAPI backend on every protected tool call |

**No violations. Phase 0 gate: PASS.**

## Project Structure

### Documentation (this feature)

```text
specs/005-chatgpt-mcp-widgets/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (/sp.plan command)
├── data-model.md        # Phase 1 output (/sp.plan command)
├── quickstart.md        # Phase 1 output (/sp.plan command)
├── contracts/           # Phase 1 output (/sp.plan command)
│   ├── tools.yaml       # MCP tool schemas (OpenAPI-style)
│   └── widgets.ts       # Widget prop type interfaces
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
chatgpt-app/
├── server/                       # Python FastMCP server
│   ├── src/
│   │   ├── main.py               # FastMCP app entry point + tool registration
│   │   ├── auth.py               # BearerAuthProvider (Stytch JWKS) + token forwarding
│   │   ├── client.py             # httpx async backend client (base URL from env)
│   │   └── tools/
│   │       ├── chapters.py       # list_chapters, get_chapter (public)
│   │       ├── quiz.py           # get_quiz, submit_quiz (submit: authenticated)
│   │       ├── progress.py       # get_progress (authenticated)
│   │       ├── search.py         # search_content (public)
│   │       └── access.py         # check_access (authenticated)
│   ├── tests/
│   │   ├── test_chapters.py
│   │   ├── test_quiz.py
│   │   ├── test_progress.py
│   │   ├── test_search.py
│   │   └── test_access.py
│   └── pyproject.toml
├── widgets/                      # React widget bundle
│   ├── src/
│   │   ├── ChapterList/          # Chapter listing panel
│   │   ├── ChapterReader/        # Full chapter reader with nav
│   │   ├── QuizPanel/            # Interactive quiz (Q+A+score)
│   │   ├── ProgressDashboard/    # Streak + completion panel
│   │   ├── SearchResults/        # Keyword search results panel
│   │   └── AccessStatus/         # Tier display panel
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── manifest.yaml                 # ChatGPT App manifest (tools + auth config)
```

**Structure Decision**: Two sub-projects under `chatgpt-app/` — the Python MCP server handles tool logic and the React widget bundle provides the visual panel UI. Both are deployed independently. The backend remains untouched.

## Complexity Tracking

> No constitution violations — this section left intentionally minimal.

| Aspect | Decision |
|--------|----------|
| Two sub-projects | Required — Python for MCP server runtime; React/TS for widget UI. ChatGPT requires both |
| No DB access in MCP server | MCP server is a thin proxy; all data concerns stay in FastAPI backend |
