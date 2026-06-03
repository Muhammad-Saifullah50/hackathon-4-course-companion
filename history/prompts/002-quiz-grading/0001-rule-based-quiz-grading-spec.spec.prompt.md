---
id: "0001"
title: rule-based-quiz-grading-spec
stage: spec
date: 2026-06-03
surface: claude-code
model: claude-sonnet-4-6
feature: 002-quiz-grading
branch: 002-quiz-grading
user: Muhammad
command: /sp.specify
labels: [quiz, grading, mcq, r2, stateless]
links:
  spec: specs/002-quiz-grading/spec.md
  ticket: ~
  adr: ~
  pr: ~
files:
  - specs/002-quiz-grading/spec.md
  - specs/002-quiz-grading/checklists/requirements.md
tests:
  - ~
---

## Prompt

Discussed and specified the Rule-Based Quiz Grading feature. User clarified: MCQs only, one quiz per chapter, questions and answers in the same JSON file, per-question correct answer revelation + pre-written explanation. All content is free tier; grading is stateless (no DB write); no LLM calls.

## Response snapshot

Created spec at `specs/002-quiz-grading/spec.md` with:
- 3 user stories (P1: fetch questions, P1: submit and grade, P2: author quiz content)
- 13 functional requirements covering question serving, grading, validation, statelessness, and zero-LLM constraint
- 4 key entities: Quiz, Question, Submission, Graded Result
- 6 measurable success criteria
- Assumptions section covering partial submissions, anonymous grading, answer option labeling

Checklist at `specs/002-quiz-grading/checklists/requirements.md` — all items pass.

## Outcome

- ✅ Impact: Spec written and validated; ready for /sp.plan
- 🧪 Tests: No tests yet (spec stage)
- 📁 Files: specs/002-quiz-grading/spec.md, specs/002-quiz-grading/checklists/requirements.md
- 🔁 Next prompts: /sp.plan, /sp.tasks
- 🧠 Reflection: Discovery interview surfaced key constraints early (stateless, no LLM, answers in same file). Clean spec with no clarification markers needed.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): checklist all pass
- Prompt variant (if applicable): ~
- Next experiment (smallest change to try): ~
