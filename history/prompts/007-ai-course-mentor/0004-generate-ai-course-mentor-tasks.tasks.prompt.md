---
id: 0004
title: Generate AI Course Mentor Tasks
stage: tasks
date: 2026-06-16
surface: Codex CLI
model: GPT-5
feature: 007-ai-course-mentor
branch: 007-ai-course-mentor
user: saifullah
command: /sp.tasks
labels: [speckit, tasks, ai-course-mentor, web-app, backend]
links:
  spec: specs/007-ai-course-mentor/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - path: specs/007-ai-course-mentor/tasks.md
    action: created
tests:
  - command: .specify/scripts/bash/check-prerequisites.sh --json
    result: pass
  - command: placeholder scan for generated task file
    result: pass
---

## Prompt

run /sp.tasks

## Response snapshot

Generated the SpecKit task breakdown for `007-ai-course-mentor` from the feature specification, implementation plan, research notes, data model, OpenAPI contract, and quickstart. The output creates a concrete, numbered task list organized by setup, foundational work, four user stories, ChatKit web integration, and polish.

## Outcome

- ✅ Impact: Created `specs/007-ai-course-mentor/tasks.md` with 52 actionable tasks, exact file paths, user-story traceability, dependencies, parallelization notes, and MVP sequencing.
- 🧪 Tests: Ran prerequisite discovery and checked the generated task file for leftover template/sample placeholders.
- 📁 Files: Added `specs/007-ai-course-mentor/tasks.md` and this PHR.
- 🔁 Next prompts: Implement Phase 1 and Phase 2 tasks, then deliver US1 as the MVP.
- 🧠 Reflection: The task list keeps the backend mentor behavior stable before exposing the ChatKit web bubble, which fits the risk profile of a Pro-only LLM feature.

## Evaluation notes (flywheel)

- Failure modes observed: Initial repository search included a missing `README.md`, but the relevant templates and feature docs were still found.
- Graders run and results (PASS/FAIL): Placeholder scan PASS; prerequisite script PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): During implementation, validate whether the ChatKit endpoint shape needs a narrower backend task split after reading the installed SDK docs.
