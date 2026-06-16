---
id: "0003"
title: "Plan AI Course Mentor"
stage: plan
date: 2026-06-16
surface: Codex
model: GPT-5
feature: 007-ai-course-mentor
branch: 007-ai-course-mentor
user: saifullah
command: /sp.plan
labels: [plan, ai-course-mentor, premium-hybrid]
links:
  spec: specs/007-ai-course-mentor/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-ai-course-mentor/plan.md
  - specs/007-ai-course-mentor/research.md
  - specs/007-ai-course-mentor/data-model.md
  - specs/007-ai-course-mentor/contracts/openapi.yaml
  - specs/007-ai-course-mentor/quickstart.md
  - AGENTS.md
  - history/prompts/007-ai-course-mentor/0003-plan-ai-course-mentor.plan.prompt.md
tests:
  - "rg placeholder and contradiction scan across generated planning artifacts"
---

## Prompt

run /sp.plamn

Interpreted as `/sp.plan` because `/sp.plamn` is not an available command and `/sp.plan` is the matching SpecKit workflow after `/sp.clarify`.

## Response snapshot

Executed the implementation planning workflow for `007-ai-course-mentor`. Generated the implementation plan, research decisions, data model, OpenAPI contract, quickstart, and updated Codex agent context. Corrected the plan to enforce exactly Pro access, matching the clarified spec.

## Outcome

- ✅ Impact: Established a constitution-aligned design for the Pro-only AI Course Mentor, including premium route isolation, quota tracking, persisted threads/messages, course grounding, and Next.js web integration boundaries.
- 🧪 Tests: Manual validation scan passed for unresolved placeholders and Pro-access contradictions.
- 📁 Files: Added plan, research, data model, OpenAPI contract, quickstart, and this PHR; updated `AGENTS.md` via the SpecKit agent-context script.
- 🔁 Next prompts: `/sp.tasks`
- 🧠 Reflection: The main planning risk was accidentally broadening "Pro-only" access; this was corrected before completion.

## Evaluation notes (flywheel)

- Failure modes observed: A shell validation command interpreted markdown backticks as command substitution; rerun with safe quoting. No file changes resulted from the failed validation command.
- Graders run and results (PASS/FAIL): Placeholder and contradiction scan PASS.
- Prompt variant (if applicable): N/A.
- Next experiment (smallest change to try): Run `/sp.tasks` and ensure tasks preserve exact Pro-only access, UTC quota behavior, and premium route isolation.
