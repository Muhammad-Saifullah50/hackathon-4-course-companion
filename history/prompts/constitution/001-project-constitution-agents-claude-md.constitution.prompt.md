---
id: 001
title: Project Constitution, AGENTS.md, and CLAUDE.md Setup
stage: constitution
date: 2026-06-02
surface: agent
model: claude-sonnet-4-6
feature: none
branch: master
user: Muhammad
command: /interview + direct authoring
labels: ["constitution","agents.md","claude.md","project-setup","hackathon-iv"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
  - AGENTS.md
  - CLAUDE.md
tests:
  - none
---

## Prompt

User shared the Hackathon IV document (Claude Teacher FTE — Panaversity Agent Factory) and a breakdown from Opus 4.8. User confirmed: course topic = AI Agent Development, goal = discuss then write constitution + AGENTS.md + CLAUDE.md, has completed prerequisites (hackathons I–III).

User clarified that CLAUDE.md and AGENTS.md are for coding agents (Claude Code, Gemini CLI, etc.) that BUILD the project — not for the FTE tutor itself. Shared the textbook chapter on CLAUDE.md/AGENTS.md and the project constitution lesson to establish correct understanding.

Key constraint confirmed: Cloudflare R2 is a required dependency. Content will be written fresh. Phase 1 and Phase 2 are in the same repo (Phase 2 extends Phase 1 with premium-gated hybrid routes). Phase 3 (Next.js web app) is a separate frontend codebase sharing the same backend.

## Response snapshot

Created three files:

1. `.specify/memory/constitution.md` — Full project constitution with six sections: Architecture Principles (Zero-Backend-LLM default, hybrid intelligence rules, single backend/dual frontend, R2 content storage, repository layer), Technology Constraints (stack table with R2 as required), Code Quality Standards (type hints, Pydantic v2, 50-line limit, TDD, ORM), Security Requirements (no secrets in code, Pydantic at boundaries, freemium server-side), Phase-Specific Constraints (Phase 1 disqualifier list, Phase 2 premium gating), Workflow Rules (SDD sequence, PHR/ADR rules).

2. `AGENTS.md` — Universal context file with: project overview, tech stack table, full directory structure (backend/chatgpt-app/web-app/content/specs/history), key commands, coding conventions (Python + TypeScript), important notes (Phase 1 constraint, premium gating, R2 requirement, env vars list). References `.specify/memory/constitution.md`.

3. `CLAUDE.md` — Prepended project context block referencing @AGENTS.md and @.specify/memory/constitution.md, with the critical Phase 1 constraint highlighted. Existing SDD/PHR/ADR rules preserved.

## Outcome

- ✅ Impact: Project governance layer fully established. Any AI agent starting a new session now loads full stack context, architecture principles, and the Phase 1 disqualifier constraint automatically.
- 🧪 Tests: none (documentation phase)
- 📁 Files: .specify/memory/constitution.md, AGENTS.md, CLAUDE.md
- 🔁 Next prompts: /sp.specify for Phase 1 feature spec, then /sp.plan, /sp.tasks
- 🧠 Reflection: Constitution correctly encodes the Phase 1 disqualifier as the most critical constraint. AGENTS.md and CLAUDE.md separation follows the universal + specialized pattern from the textbook.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): none
- Next experiment: Run /sp.specify for Phase 1 backend to validate constitution catches any spec ambiguities
