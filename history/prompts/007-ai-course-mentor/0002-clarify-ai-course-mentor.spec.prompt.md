---
id: "0002"
title: "Clarify AI Course Mentor"
stage: spec
date: 2026-06-16
surface: Codex
model: GPT-5
feature: 007-ai-course-mentor
branch: 007-ai-course-mentor
user: saifullah
command: /sp.clarify
labels: [spec, clarify, ai-course-mentor]
links:
  spec: specs/007-ai-course-mentor/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/007-ai-course-mentor/spec.md
  - history/prompts/007-ai-course-mentor/0002-clarify-ai-course-mentor.spec.prompt.md
tests:
  - "rg scan for unresolved placeholders and contradictory quota/retention wording"
---

## Prompt

run /sp.clarify

Clarification answers provided:

1. recommended
2. a
3. recommended
4. b
5. a

## Response snapshot

Ran the SpecKit clarification workflow for active feature `007-ai-course-mentor`. Asked five targeted questions and updated the AI Course Mentor spec with concrete decisions for quota counting, UTC reset timing, citation granularity, response context window, and thread retention.

## Outcome

- ✅ Impact: Reduced implementation ambiguity for data modeling, usage-limit enforcement, grounded citation tests, and retention behavior.
- 🧪 Tests: Manual spec validation via `rg`; no unresolved clarification placeholders or contradictory wording found.
- 📁 Files: Updated `specs/007-ai-course-mentor/spec.md`; created this PHR.
- 🔁 Next prompts: `/sp.plan`
- 🧠 Reflection: The highest-impact clarifications were operational rules that directly affect backend schema, quota tests, and response-generation constraints.

## Evaluation notes (flywheel)

- Failure modes observed: None.
- Graders run and results (PASS/FAIL): Manual markdown and placeholder scan PASS.
- Prompt variant (if applicable): N/A.
- Next experiment (smallest change to try): Run `/sp.plan` and verify the implementation plan preserves the clarified quota, context, and retention rules.
