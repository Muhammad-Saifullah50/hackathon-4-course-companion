---
id: "0004"
title: chatgpt-mcp-widgets-task-generation
stage: tasks
date: 2026-06-07
surface: claude-code
model: claude-sonnet-4-6
feature: 005-chatgpt-mcp-widgets
branch: 005-chatgpt-mcp-widgets
user: Muhammad
command: /sp.tasks
labels: [tasks, mcp, fastmcp, react-widgets, chatgpt-app, task-generation]
links:
  spec: specs/005-chatgpt-mcp-widgets/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - specs/005-chatgpt-mcp-widgets/tasks.md
tests:
  - N/A (task planning phase)
---

## Prompt

/sp.tasks — Generate implementation task list for feature 005-chatgpt-mcp-widgets (ChatGPT App: MCP Server + React Widgets).

## Response snapshot

Generated tasks.md with 48 tasks across 8 phases:

- Phase 1 (Setup, 7 tasks): chatgpt-app/server/pyproject.toml, chatgpt-app/widgets/package.json + tsconfig + vite.config.ts, manifest.yaml skeleton, directory structure
- Phase 2 (Foundational, 7 tasks): pydantic-settings config, async httpx client with Bearer forwarding, Stytch BearerAuthProvider, FastMCP main.py skeleton, shared ErrorPanel model + React component
- Phase 3 (US1 Chapters, 7 tasks): ChapterSummary/ChapterPanel models, ChapterList + ChapterReader widgets, list_chapters + get_chapter tools, pytest tests
- Phase 4 (US2 Quiz, 6 tasks): QuizQuestion/QuizPanel/QuizResult models, QuizPanel widget, get_quiz + submit_quiz tools, pytest tests
- Phase 5 (US3 Progress, 5 tasks): ProgressPanel model, ProgressDashboard widget, get_progress tool, pytest tests
- Phase 6 (US4 Search, 5 tasks): SearchResultsPanel model, SearchResults widget, search_content tool, pytest tests
- Phase 7 (US5 Access, 5 tasks): AccessStatusPanel model, AccessStatus widget, check_access tool, pytest tests
- Phase 8 (Polish, 6 tasks): Complete manifest.yaml, widget barrel export, Vercel deployment configs, global error handler, end-to-end SC verification

22 of 48 tasks are parallelizable. MVP scope is phases 1+2+3 (21 tasks). All 5 user stories proceed in parallel after foundational phase.

## Outcome

- ✅ Impact: 48-task implementation roadmap ready for /sp.implement
- 🧪 Tests: Pytest test tasks included per tool module (constitution 80% coverage requirement)
- 📁 Files: specs/005-chatgpt-mcp-widgets/tasks.md
- 🔁 Next prompts: /sp.implement to execute tasks
- 🧠 Reflection: Clean separation — Python models per story, React widget per story, tool per story. MVP is phases 1+2+3 (chapters only, no auth needed). All stories are parallel-safe after foundational phase.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Verify fastmcp BearerAuthProvider constructor API before T010
