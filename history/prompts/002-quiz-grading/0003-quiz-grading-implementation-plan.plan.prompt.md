---
id: "0003"
title: quiz-grading-implementation-plan
stage: plan
date: 2026-06-03
surface: claude-code
model: claude-sonnet-4-6
feature: 002-quiz-grading
branch: 002-quiz-grading
user: Muhammad
command: /sp.plan
labels: [plan, quiz-grading, fastapi, r2, stateless]
links:
  spec: specs/002-quiz-grading/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - specs/002-quiz-grading/plan.md
  - specs/002-quiz-grading/research.md
  - specs/002-quiz-grading/data-model.md
  - specs/002-quiz-grading/quickstart.md
  - specs/002-quiz-grading/contracts/openapi.yaml
tests:
  - backend/tests/test_quizzes.py (planned — not yet created)
---

## Prompt

/sp.plan — invoked on branch 002-quiz-grading to produce the implementation plan for the Rule-Based Quiz Grading feature.

Feature: Serve MCQ quiz questions per chapter from Cloudflare R2 and grade single-answer submissions against a static answer key. Two endpoints: GET /quizzes/{chapter_slug} (questions only, no answers exposed) and POST /quizzes/{chapter_slug}/submit (graded result with correct answer and explanation). Grading is stateless (no DB write). Zero LLM calls.

## Response snapshot

Generated the following artifacts:

**Phase 0 — research.md**: Resolved all architectural decisions:
- QuizService singleton (no cross-request cache) to reuse boto3 S3 client
- One retry inside `_fetch_with_retry` private method on `QuizService`
- Two Pydantic model trees: `QuizFile`/`Question` (internal, with answers) and `QuizPublic`/`QuestionPublic` (external, no answers)
- `@model_validator(mode='after')` validates `correct_answer` matches an option label at load time
- R2 path: `quizzes/{chapter_slug}.json`
- `QuizNotFoundError` for missing quizzes, `ServiceUnavailableError` for R2 failures

**Phase 1 — data-model.md**: Defined all entities: `AnswerOption`, `Question`, `QuizFile` (internal), `QuestionPublic`, `QuizPublic`, `AnswerSubmission`, `GradedResult`. Specified validation rules and R2 schema with example JSON.

**Phase 1 — contracts/openapi.yaml**: Full OpenAPI 3.1 spec for `GET /quizzes/{chapter_slug}` and `POST /quizzes/{chapter_slug}/submit` with all error responses (400, 404, 503).

**Phase 1 — quickstart.md**: Dev setup, R2 quiz file upload, curl examples, local fallback pattern, error table, Phase 1 compliance check command.

**plan.md**: Filled with technical context, constitution check (all PASS — no violations), project structure, design decisions table, and implementation sketch.

**Constitution check**: All Phase 1 gates PASS. No LLM imports, no DB writes, answer key never in GET response, content from R2.

## Outcome

- ✅ Impact: Full implementation plan ready; /sp.tasks can generate tasks.md next
- 🧪 Tests: No tests created yet — planned in backend/tests/test_quizzes.py
- 📁 Files: plan.md, research.md, data-model.md, quickstart.md, contracts/openapi.yaml created; CLAUDE.md updated by agent context script
- 🔁 Next prompts: /sp.tasks to generate tasks.md
- 🧠 Reflection: Research agent confirmed all decisions independently. Two-model Pydantic approach is the right call for type safety; singleton + no-cache-fields is the minimal implementation that satisfies the per-request fetch requirement.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
