---
id: 0001
title: ai-course-mentor-spec
stage: spec
date: 2026-06-15
surface: codex
model: gpt-5
feature: 007-ai-course-mentor
branch: 007-ai-course-mentor
user: saifullah
command: use the /sp.specify to write the spec this feature spec
labels: [spec, feature, ai-course-mentor]
links:
  spec: /home/saifullah/projects/hackathon-4-course-companion/specs/007-ai-course-mentor/spec.md
  ticket: none
  adr: /home/saifullah/projects/hackathon-4-course-companion/history/adr/ADR-0001-hybrid-llm-exception-for-title-agent.md
  pr: none
files:
  - /home/saifullah/projects/hackathon-4-course-companion/specs/007-ai-course-mentor/spec.md
  - /home/saifullah/projects/hackathon-4-course-companion/specs/007-ai-course-mentor/checklists/requirements.md
tests:
  - spec validation checklist completed
  - no runtime tests run
---

## Prompt

Use the `/sp.specify` workflow to write the feature spec for the AI Course Mentor. The mentor is web-app first, strictly course-grounded, Pro-only, supports manual thread renaming, persists threads and messages, accepts text only, enforces a 5-message daily limit, and rejects unrelated questions.

## Response snapshot

Created branch `007-ai-course-mentor`, wrote `specs/007-ai-course-mentor/spec.md`, generated `specs/007-ai-course-mentor/checklists/requirements.md`, and validated the draft against the checklist with all items passing. The spec scopes the web app release first and keeps the ChatGPT app version out of scope.

## Outcome

- ✅ Impact: The mentor feature now has a complete stakeholder-facing spec ready for planning.
- 🧪 Tests: Specification checklist passed; no runtime tests were needed.
- 📁 Files: Feature spec, requirements checklist, and prompt history record created.
- 🔁 Next prompts: Run `/sp.plan` for `007-ai-course-mentor`.
- 🧠 Reflection: The spec stays user-facing and leaves implementation details for planning.

## Evaluation notes (flywheel)

- Failure modes observed: None after the user resolved the model-policy exception and release-scope questions.
- Graders run and results (PASS/FAIL): Checklist validation PASS.
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Start the technical plan from the approved spec.
