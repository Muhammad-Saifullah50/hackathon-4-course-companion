---
id: 0001
title: hybrid-llm-exception-title-agent
stage: constitution
date: 2026-06-15
surface: codex
model: gpt-5
feature: none
branch: main
user: saifullah
command: amend the constitution
labels: [constitution, adr, hybrid-llm, chatkit]
links:
  spec: none
  ticket: none
  adr: /home/saifullah/projects/hackathon-4-course-companion/history/adr/ADR-0001-hybrid-llm-exception-for-title-agent.md
  pr: none
files:
  - /home/saifullah/projects/hackathon-4-course-companion/.specify/memory/constitution.md
  - /home/saifullah/projects/hackathon-4-course-companion/history/adr/ADR-0001-hybrid-llm-exception-for-title-agent.md
tests:
  - not run
---

## Prompt

amend the constitution

## Response snapshot

Updated the constitution to allow a feature-specific exception for auxiliary utility agents, such as chat thread title generation, while keeping Nvidia Nemotron as the default model for primary Phase 2 reasoning. Added ADR-0001 to record the architectural decision and its tradeoffs.

## Outcome

- ✅ Impact: Constitution now matches the intended mentor/title-agent split.
- 🧪 Tests: Not run; documentation-only change.
- 📁 Files: Constitution amended; ADR added; PHR recorded.
- 🔁 Next prompts: Draft the AI Course Mentor spec with the title-agent exception baked in.
- 🧠 Reflection: The exception is narrow enough to preserve the model policy while keeping implementation practical.

## Evaluation notes (flywheel)

- Failure modes observed: None; the user clarified the exception boundary before spec work.
- Graders run and results (PASS/FAIL): Not run.
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Use the approved exception in the mentor spec, but keep reasoning and chat responses on Nvidia.
