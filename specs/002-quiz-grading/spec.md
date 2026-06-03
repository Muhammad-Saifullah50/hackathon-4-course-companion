# Feature Specification: Rule-Based Quiz Grading

**Feature Branch**: `002-quiz-grading`
**Created**: 2026-06-03
**Status**: Draft
**Input**: User description: "Rule-Based Quiz Grading — serve MCQ quiz questions per chapter from R2 and grade submissions against a static answer key. One quiz per chapter (keyed by chapter_slug). Quiz JSON on R2 contains both questions and answer key. Two endpoints: GET /quizzes/{chapter_slug} returns questions only (no answers exposed), POST /quizzes/{chapter_slug}/submit accepts answers and returns score + per-question verdict with correct_answer and pre-written explanation. Grading is stateless (no DB write). MCQ only, single correct answer per question. No LLM calls."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Retrieve Quiz Questions for a Chapter (Priority: P1)

A learner finishes reading a chapter and wants to test their understanding. They request the quiz for that chapter and receive a list of multiple-choice questions — without any answers or explanations included — ready to present in the UI or ChatGPT conversation.

**Why this priority**: This is the entry point for the entire quiz flow. Without question delivery, grading cannot happen. Delivers immediate standalone value as a content-serving endpoint.

**Independent Test**: Can be fully tested by requesting the quiz for a valid chapter slug and confirming that questions are returned with no answer keys or explanations exposed.

**Acceptance Scenarios**:

1. **Given** a valid chapter slug, **When** a quiz is requested, **Then** the system returns the list of questions with answer options, each identified by a unique question ID, and no correct answer or explanation is included in the response.
2. **Given** a chapter slug that has no quiz, **When** a quiz is requested, **Then** the system returns a clear "quiz not found" error.
3. **Given** an invalid or malformed chapter slug, **When** a quiz is requested, **Then** the system returns a validation error.

---

### User Story 2 - Submit a Single Answer and Get Immediate Feedback (Priority: P1)

A learner selects an answer for a question and submits it. They immediately see whether they were correct, what the correct answer was, and a pre-written explanation — then move on to the next question. One answer is submitted at a time.

**Why this priority**: Core value of the feature — instant, per-question feedback with no AI cost. Equally critical as question delivery.

**Independent Test**: Can be fully tested by submitting one answer for one question and verifying the verdict, correct answer, and explanation are returned immediately and correctly.

**Acceptance Scenarios**:

1. **Given** a valid chapter slug and a correct answer for a question, **When** that answer is submitted, **Then** the system immediately returns the question marked correct, the correct answer, and the pre-written explanation.
2. **Given** a valid chapter slug and an incorrect answer for a question, **When** that answer is submitted, **Then** the system immediately returns the question marked incorrect, the correct answer revealed, and the pre-written explanation.
3. **Given** a submission with a question ID that does not exist in the quiz, **When** the answer is submitted, **Then** the system returns a validation error.
4. **Given** a chapter slug with no quiz, **When** an answer is submitted, **Then** the system returns a "quiz not found" error.

---

### User Story 3 - Quiz Data Authored and Stored in Content Bank (Priority: P2)

A course content author needs to define quizzes for each chapter. They author a structured JSON file that includes questions, answer options, the correct answer, and a pre-written explanation for each question — then publish it to the content store.

**Why this priority**: Without authored quiz data, neither question delivery nor grading works. This story ensures the content schema is well-defined so authoring and consumption are consistent.

**Independent Test**: Can be fully tested by authoring a quiz JSON file conforming to the schema, publishing it, and verifying it can be fetched and graded correctly end-to-end.

**Acceptance Scenarios**:

1. **Given** a quiz JSON file conforming to the defined schema, **When** it is published to the content store under the correct chapter slug path, **Then** questions can be served and answers graded correctly.
2. **Given** a quiz JSON with a missing required field (e.g., no explanation on a question), **When** the system attempts to load it, **Then** loading fails with a clear schema validation error.

---

### Edge Cases

- What happens when the content store is unavailable? The system retries once; if still unreachable, returns a service error. No partial or cached data is served.
- What happens when the quiz JSON is malformed or fails schema validation? The system returns an internal error; the raw file is never exposed.
- What happens when a learner submits an answer for a question ID not in the quiz? The submission is rejected with a validation error.
- What happens when the correct answer value in the quiz file does not match any of the defined answer options? Treated as a data authoring error; the question is ungradeable and the system raises a schema error on load.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve the list of MCQ questions for a given chapter, including question text and answer options, without exposing the correct answer or explanation.
- **FR-002**: System MUST reject requests for quizzes belonging to chapter slugs that do not exist in the content store with a "not found" error.
- **FR-003**: System MUST accept a single-answer submission (chapter slug + one question ID + one selected answer) and return a graded result for that question.
- **FR-004**: System MUST grade the submitted answer by comparing it to the static answer key stored in the quiz file.
- **FR-005**: System MUST return whether the answer was correct, the correct answer, and the pre-written explanation in the graded result.
- **FR-006**: System MUST reject submissions where the question ID does not exist in the quiz.
- **FR-010**: System MUST NOT persist any submission data to the database — grading is stateless.
- **FR-011**: System MUST NOT make any LLM API calls during question serving or grading.
- **FR-012**: Quiz content MUST be fetched from the remote content store (Cloudflare R2) at request time and cached in memory for the life of that request; no quiz data is hardcoded in application code.
- **FR-013**: The quiz file schema MUST include per-question: unique ID, question text, list of answer options (each a label + text pair), correct answer (label identifier), and explanation text.

### Key Entities

- **Quiz**: One per chapter, identified by `chapter_slug`. Contains a list of questions and is the authoritative source for both question content and the answer key.
- **Question**: A single MCQ item within a quiz. Attributes: unique ID, question text, answer options (list of labeled choices), correct answer (option identifier), explanation (pre-written text revealed after grading).
- **Submission**: A single answer from the learner. Contains the chapter slug, one question ID, and the selected answer. Never persisted.
- **Graded Result**: The output of grading a submission. Contains `{ question_id, is_correct, correct_answer, explanation }` for the submitted question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Learners receive quiz questions within 2 seconds of requesting a chapter quiz under normal load.
- **SC-002**: Graded results are returned within 2 seconds of submitting answers under normal load.
- **SC-003**: Grading accuracy is 100% — every correct answer is marked correct and every incorrect answer is marked incorrect, with zero grading errors against the answer key.
- **SC-004**: No answer key or explanation data is present in the question-serving response — verified by inspecting 100% of question delivery responses.
- **SC-005**: All five chapter quizzes can be authored, published, and served without code changes — content updates require no redeployment.
- **SC-006**: Invalid submissions (unknown question ID, missing quiz) are rejected 100% of the time with an informative error.

## Clarifications

### Session 2026-06-03

- Q: Should quiz JSON be cached in memory for the duration of a request, or fetched fresh on every call? → A: Cache per request — fetch once from R2 per request, reuse within that request.
- Q: When R2 is unreachable, should the backend retry before returning an error? → A: One retry, then return a service error to the learner.
- Q: Should quiz answer options carry label + text only, or also an optional media field? → A: Label + text only — `{ "label": "A", "text": "..." }`.

## Assumptions

- Each chapter has exactly one quiz; there is no concept of multiple quiz attempts per chapter at this stage.
- The quiz JSON file for a chapter is stored at a predictable path in the content store, derivable from the chapter slug (e.g., `quizzes/{chapter_slug}.json`).
- Each answer option is a label + text pair (e.g., `{ "label": "A", "text": "..." }`); the correct answer field stores the matching label. No media fields.
- One answer is submitted per request; the learner moves through questions one at a time.
- There is no time limit enforced on quiz submissions.
- User identity is not required for this feature; submissions are anonymous at this stage (progress persistence is a separate feature).
