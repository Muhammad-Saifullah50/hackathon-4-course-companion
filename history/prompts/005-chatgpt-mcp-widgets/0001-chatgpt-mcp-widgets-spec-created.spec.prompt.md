---
id: "0001"
title: chatgpt-mcp-widgets-spec-created
stage: spec
date: 2026-06-05
surface: claude-code
model: claude-sonnet-4-6
feature: 005-chatgpt-mcp-widgets
branch: 005-chatgpt-mcp-widgets
user: Muhammad
command: /sp.specify
labels: [spec, chatgpt-app, mcp, widgets, stytch-auth]
links:
  spec: specs/005-chatgpt-mcp-widgets/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/005-chatgpt-mcp-widgets/spec.md
  - specs/005-chatgpt-mcp-widgets/checklists/requirements.md
  - history/research/chatgpt-app-python-mcp.md
tests: []
---

## Prompt

Feature 6: ChatGPT App — MCP Server + React Widgets. Build chatgpt-app/ as a separate Vercel-deployed FastMCP (Python) server that exposes the Claude Teacher FastAPI backend as MCP tools ChatGPT can call. Pure thin adapter — zero business logic, zero DB/R2 access in the MCP layer. All tool handlers make a single httpx call to the FastAPI backend and return structured results. Auth via Stytch Connected Apps (BearerAuthProvider pointing at existing Stytch JWKS). 7 tools: list_chapters (noauth), get_chapter (noauth), get_quiz (oauth2), submit_quiz_answer (oauth2, app-only visibility), get_progress (oauth2), search_content (noauth), check_access (oauth2). 6 React widgets (built with Vite + @openai/apps-sdk-ui): chapter-nav, chapter-reader, quiz (shared by get_quiz + submit_quiz_answer), progress, search-results, access-status. FastMCP instructions contain a brief tutor description + available tools summary (no skill files — those are Feature 7). Skills files are explicitly OUT OF SCOPE. manifest.yaml defines app name, description, auth, and MCP server URL.

## Response snapshot

Spec written to specs/005-chatgpt-mcp-widgets/spec.md on branch 005-chatgpt-mcp-widgets. Covers 5 user stories (P1–P5): chapter browsing (unauthenticated), quiz taking (authenticated), progress viewing (authenticated), keyword search (unauthenticated), access tier checking (authenticated). 17 functional requirements, 7 success criteria, 6 edge cases, key entities, assumptions, and out-of-scope section. Quality checklist created and all items pass. Stytch Connected Apps auth research added to history/research/chatgpt-app-python-mcp.md as Section 13.

## Outcome

- ✅ Impact: Full spec for Feature 6 ready for planning
- 🧪 Tests: No tests at spec stage
- 📁 Files: specs/005-chatgpt-mcp-widgets/spec.md, checklists/requirements.md
- 🔁 Next prompts: /sp.plan
- 🧠 Reflection: Brainstorming session before spec produced clear design decisions — React widgets for all tools, thin adapter pattern, Stytch Connected Apps for auth, Vercel deployment. Spec written without implementation details as required.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): quality checklist — all PASS
- Prompt variant (if applicable): preceded by /brainstorming session
- Next experiment: proceed directly to /sp.plan given fully resolved spec
