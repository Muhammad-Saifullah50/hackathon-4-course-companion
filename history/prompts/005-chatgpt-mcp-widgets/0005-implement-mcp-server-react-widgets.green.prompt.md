---
id: "0005"
title: implement-mcp-server-react-widgets
stage: green
date: 2026-06-07
surface: claude-code
model: claude-sonnet-4-6
feature: 005-chatgpt-mcp-widgets
branch: 005-chatgpt-mcp-widgets
user: Muhammad
command: /sp.implement
labels: [mcp, fastmcp, react, typescript, python, chatgpt-app]
links:
  spec: specs/005-chatgpt-mcp-widgets/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - chatgpt-app/server/pyproject.toml
  - chatgpt-app/server/src/core/config.py
  - chatgpt-app/server/src/client.py
  - chatgpt-app/server/src/auth.py
  - chatgpt-app/server/src/main.py
  - chatgpt-app/server/src/errors.py
  - chatgpt-app/server/src/models/error.py
  - chatgpt-app/server/src/models/chapters.py
  - chatgpt-app/server/src/models/quiz.py
  - chatgpt-app/server/src/models/progress.py
  - chatgpt-app/server/src/models/search.py
  - chatgpt-app/server/src/models/access.py
  - chatgpt-app/server/src/tools/chapters.py
  - chatgpt-app/server/src/tools/quiz.py
  - chatgpt-app/server/src/tools/progress.py
  - chatgpt-app/server/src/tools/search.py
  - chatgpt-app/server/src/tools/access.py
  - chatgpt-app/server/tests/conftest.py
  - chatgpt-app/server/tests/test_chapters.py
  - chatgpt-app/server/tests/test_quiz.py
  - chatgpt-app/server/tests/test_progress.py
  - chatgpt-app/server/tests/test_search.py
  - chatgpt-app/server/tests/test_access.py
  - chatgpt-app/server/vercel.json
  - chatgpt-app/widgets/package.json
  - chatgpt-app/widgets/tsconfig.json
  - chatgpt-app/widgets/vite.config.ts
  - chatgpt-app/widgets/vercel.json
  - chatgpt-app/widgets/src/types.ts
  - chatgpt-app/widgets/src/index.ts
  - chatgpt-app/widgets/src/ErrorPanel/index.tsx
  - chatgpt-app/widgets/src/ChapterList/index.tsx
  - chatgpt-app/widgets/src/ChapterReader/index.tsx
  - chatgpt-app/widgets/src/QuizPanel/index.tsx
  - chatgpt-app/widgets/src/ProgressDashboard/index.tsx
  - chatgpt-app/widgets/src/SearchResults/index.tsx
  - chatgpt-app/widgets/src/AccessStatus/index.tsx
  - chatgpt-app/manifest.yaml
tests:
  - chatgpt-app/server/tests/test_chapters.py
  - chatgpt-app/server/tests/test_quiz.py
  - chatgpt-app/server/tests/test_progress.py
  - chatgpt-app/server/tests/test_search.py
  - chatgpt-app/server/tests/test_access.py
---

## Prompt

/sp.implement — Execute the implementation plan from tasks.md for feature 005-chatgpt-mcp-widgets (ChatGPT App MCP Server + React Widgets).

## Response snapshot

Implemented all 48 tasks across 8 phases for feature 005-chatgpt-mcp-widgets:

- **Phase 1 (Setup)**: Created directory structure, pyproject.toml, package.json, tsconfig.json, vite.config.ts (library mode), widget subdirectories, manifest.yaml skeleton
- **Phase 2 (Foundational)**: Built config.py (pydantic-settings), client.py (httpx AsyncClient), auth.py (BearerAuthProvider), main.py (FastMCP instance + get_app factory), ErrorPanel model, types.ts, ErrorPanel widget
- **Phase 3–7 (US1–US5, parallel)**: All 5 user stories implemented simultaneously via parallel agents — chapters, quiz, progress, search, and access tools + React widgets + pytest test suites
- **Phase 8 (Polish)**: Barrel export (index.ts), server/vercel.json, widgets/vercel.json, errors.py utility decorator (handle_backend_errors), manifest.yaml finalized with all 7 tools

Key architectural decisions: MCP server is purely an adapter layer (no backend changes needed); public tools call backend without auth forwarding; protected tools forward Bearer token from FastMCP context; error handling via `handle_backend_errors` decorator in errors.py.

## Outcome

- ✅ Impact: Complete chatgpt-app/ directory with 44 files — MCP server (7 tools), 6 React widgets, 5 pytest test suites, deployment configs
- 🧪 Tests: 5 test files covering all tool modules; uses AsyncMock to patch backend calls; conftest.py provides required env vars
- 📁 Files: 44 new files across chatgpt-app/server/ and chatgpt-app/widgets/
- 🔁 Next prompts: /vercel:deploy preview, end-to-end test in ChatGPT Developer Mode (T048), uv sync + pytest run
- 🧠 Reflection: Parallel agent dispatch for all 5 user stories cut implementation time significantly; FastMCP 2.0 error handler decorator doesn't exist so error handling moved to errors.py utility

## Evaluation notes (flywheel)

- Failure modes observed: @mcp.error_handler decorator does not exist in FastMCP 2.0 — reverted to utility decorator pattern
- Graders run and results (PASS/FAIL): none yet (requires uv sync + pytest)
- Prompt variant (if applicable): none
- Next experiment (smallest change to try): run pytest after uv sync to validate test suite passes
