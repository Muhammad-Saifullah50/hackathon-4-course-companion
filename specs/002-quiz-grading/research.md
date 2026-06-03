# Research: Rule-Based Quiz Grading

**Branch**: `002-quiz-grading` | **Date**: 2026-06-03

---

## Decision 1: QuizService — Singleton vs Stateless Functions

**Decision**: Singleton class (same pattern as `ContentService`), but with **no cross-request quiz cache**.

**Rationale**: The spec clarification states "cache per request — fetch once from R2 per request." Per-request caching is automatic since a single call to `_fetch_quiz_from_r2` is made per endpoint handler. A singleton is still beneficial to reuse the `boto3` S3 client (creating an S3 client per request has connection overhead). The class owns the client; the quiz data is fetched fresh each call.

**Alternatives considered**:
- Module-level stateless functions with a shared boto3 client: works but breaks the established `service + dependency injection` pattern in the codebase.
- Per-process quiz cache (TTL like `ContentService`): rejected — spec says "no cached data" for quizzes; the quiz content may change and there's no invalidation mechanism.

---

## Decision 2: R2 Retry Strategy

**Decision**: Inline retry inside the service method (`_fetch_quiz_from_r2`), with one retry attempt on any non-404 `ClientError`.

**Rationale**: Consistent with edge case spec: "The system retries once; if still unreachable, returns a service error." The retry is synchronous (blocking in `asyncio.to_thread`), so no async retry library is needed. Putting the retry inside the private method keeps the public interface clean.

**Alternatives considered**:
- Shared retry utility/decorator: overkill for a single service method; adds abstraction for no gain.
- Retry at the router level: violates service layer responsibility.

---

## Decision 3: Internal vs Public Pydantic Models

**Decision**: Two-model approach — `QuizFile` (internal, includes answers) and `QuizPublic` + `QuestionPublic` (external, no answers).

**Rationale**: The spec requires that `GET /quizzes/{chapter_slug}` returns questions with no `correct_answer` or `explanation`. Pydantic v2 has no built-in field exclusion on serialization (without `exclude` hacks). Two distinct models are explicit, type-safe, and easy to verify in code review. The service returns `QuizFile` internally and the router maps it to `QuizPublic`.

**Alternatives considered**:
- Single model with `model_dump(exclude={"correct_answer", "explanation"})`: works but loses type safety — the router return type would be `dict`, not a typed response model.
- `response_model_exclude` in FastAPI: deprecated and unreliable — fields are still in memory, just stripped at serialization.

---

## Decision 4: Schema Validation — correct_answer vs option labels

**Decision**: Validate that `correct_answer` matches one of the `options[].label` values at **load time** (in the `QuizFile` Pydantic model) using a `@model_validator(mode='after')`.

**Rationale**: The spec states: "Treated as a data authoring error; the question is ungradeable and the system raises a schema error on load." Catching this in the Pydantic model ensures it is caught on every fetch — no stale bad data can pass through to grading logic.

**Alternatives considered**:
- Validate in the grading service method: defers the error to submission time, not load time — bad data could be exposed in GET responses.
- No validation: rejected — spec explicitly requires a schema error on load.

---

## Decision 5: R2 Path for Quiz Files

**Decision**: `quizzes/{chapter_slug}.json`

**Rationale**: Consistent with the spec assumption: "The quiz JSON file for a chapter is stored at a predictable path in the content store, derivable from the chapter slug." Mirrors the chapter path pattern (`chapters/{slug}.md`).

**Alternatives considered**:
- `quiz/{chapter_slug}/questions.json`: more nested, no benefit.
- Storing quiz metadata in the manifest: adds coupling to Feature 1 (content delivery); quiz JSON is self-contained.

---

## Decision 6: QuizNotFoundError vs ChapterNotFoundError

**Decision**: New exception `QuizNotFoundError` in `quiz.py` service, separate from `ChapterNotFoundError`.

**Rationale**: The quiz feature is independent — a chapter can exist without a quiz. Reusing `ChapterNotFoundError` would conflate two separate concepts. The router maps it to HTTP 404 with a clear message.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| QuizService cache strategy | No cross-request cache; singleton for S3 client reuse |
| Retry strategy | One retry inside `_fetch_quiz_from_r2`, raises `ServiceUnavailableError` |
| Answer key exposure | Two separate Pydantic model trees (internal vs public) |
| Schema validation | `@model_validator(mode='after')` on `QuizFile` |
| R2 file path | `quizzes/{chapter_slug}.json` |
| Error types | `QuizNotFoundError`, `SchemaValidationError`, `ServiceUnavailableError` |
