# Premium Hybrid Intelligence Features

**Phase**: 2  
**Status**: Proposed  
**Selected features**: B. LLM-Graded Assessments and D. AI Course Mentor  
**Constraint**: These are the only two hybrid features. All LLM routes must use the `/premium/` prefix and the `require_premium` dependency.

---

## Purpose

Phase 2 adds two independently deliverable premium features:

1. **LLM-Graded Assessments** evaluates free-form learner reasoning and returns structured, actionable feedback.
2. **AI Course Mentor** provides grounded, personalized tutoring through a tool-using conversational agent.

Each feature must be buildable, testable, deployable, and disableable without the other. Their optional integration is limited to the mentor reading completed assessment results to target misconceptions.

---

## Shared Architecture Rules

- Keep all Phase 1 routes deterministic and unchanged.
- Place hybrid routes under `backend/src/routers/premium/`.
- Enforce authentication and `require_premium` server-side on every hybrid endpoint.
- Keep LLM clients, prompts, tracing, and provider configuration inside Phase 2 modules.
- Use the constitution-approved Nvidia Nemotron model through OpenRouter unless the constitution is amended.
- The OpenAI Agents SDK may provide agent orchestration; it does not require changing the approved inference provider if a compatible provider adapter is used.
- ChatKit is the web chat interface for the mentor and must connect through an authenticated server endpoint.
- Never expose provider API keys or ChatKit server credentials to the browser.
- Record token usage, latency, model identifier, and failures without logging private learner content.
- Apply request limits, input-size limits, timeouts, and graceful provider-error responses.

### Shared Dependencies

- Stytch authentication and the existing `users.access_tier` field
- `require_premium` FastAPI dependency
- Existing content, quiz, progress, and search services
- Phase 2 LLM provider configuration

Shared dependencies do not make the two features depend on each other.

---

# Feature B: LLM-Graded Assessments

## Definition

A premium learner submits a free-form written answer to a course assessment. The system evaluates the answer against an authored rubric and returns a structured score, criterion-level feedback, strengths, misconceptions, and a suggested next step.

## User Value

Rule-based grading can compare fixed choices but cannot reliably evaluate explanations, trade-offs, reasoning, or applied understanding. This feature gives learners detailed feedback on how they think, not only whether they selected the expected answer.

## Scope

### Included

- Free-form text answers to authored assessment questions
- Rubric-based grading with explicit criteria and point ranges
- Structured LLM output validated by Pydantic
- Overall score and criterion-level scores
- Strengths, misconceptions, improvement guidance, and next learning action
- Course-grounded feedback using the question, rubric, reference answer, and relevant chapter excerpts
- Persistence of submissions and grading results for the authenticated learner
- Idempotency protection against accidental duplicate grading
- Premium gating, rate limiting, observability, and provider-failure handling

### Excluded

- Replacing existing deterministic MCQ grading
- Grading arbitrary files, source repositories, audio, or video
- Automatically changing course progress or access tier
- Training or fine-tuning a model
- Human instructor review workflows
- Mentor chat functionality

## Proposed Flow

```text
Premium learner submits answer
        |
        v
POST /premium/assessments/{assessment_id}/submissions
        |
        +--> authenticate + require_premium
        +--> load authored question and rubric
        +--> load bounded supporting course excerpts
        +--> run rubric-based grading
        +--> validate structured result
        +--> persist submission and result
        v
Typed grading response
```

## Proposed Contract

### Request

```json
{
  "answer": "The learner's written response",
  "idempotency_key": "client-generated-unique-value"
}
```

### Response

```json
{
  "submission_id": "uuid",
  "assessment_id": "mcp-tools-vs-resources",
  "score": 82,
  "max_score": 100,
  "criteria": [
    {
      "criterion": "Conceptual accuracy",
      "score": 32,
      "max_score": 40,
      "feedback": "Accurate distinction, but the resource example is incomplete."
    }
  ],
  "strengths": ["Clearly explains tool invocation."],
  "misconceptions": ["Treats all resources as executable operations."],
  "improvement_guidance": "Contrast passive context with callable behavior.",
  "recommended_chapter_slug": "mcp-fundamentals",
  "graded_at": "2026-06-14T00:00:00Z"
}
```

## Data Ownership

The assessment feature owns:

- Assessment prompts and rubrics
- Written submissions
- Structured grading results
- Grading model and prompt version metadata

The mentor may read finalized grading results through a stable service interface but must not write or alter them.

## Acceptance Criteria

1. A premium user can submit a valid free-form answer and receive schema-valid rubric feedback.
2. A free user receives `403 Forbidden` before any LLM call is made.
3. Every criterion score remains within its authored range, and the total is calculated deterministically from criterion scores.
4. The response identifies at least one strength or improvement area without inventing unsupported course requirements.
5. Repeating a request with the same idempotency key does not create or charge for a second grading run.
6. Invalid model output is retried only within a fixed limit and otherwise returns a safe service error.
7. Existing MCQ endpoints continue to operate with zero LLM calls.

## Independent Delivery Test

Create one authored assessment and rubric, submit representative strong, partial, and irrelevant answers, and verify gating, structured output, score bounds, persistence, idempotency, and failure handling. The AI Course Mentor does not need to exist.

---

# Feature D: Grounded AI Course Mentor

## Definition

A premium conversational mentor uses course retrieval, learner progress, quiz history, and assessment results to answer questions, explain concepts, identify weak areas, and recommend a concrete next learning action.

This is a request-driven, multi-turn agent. It is not an autonomous background process or an indefinitely running job.

## User Value

The mentor combines course knowledge with learner-specific evidence. It can answer questions such as:

- "Why do I keep struggling with MCP resources?"
- "What should I study next?"
- "Compare this idea with a chapter I completed earlier."
- "Quiz me on my weakest concept without revealing the answer."
- "Explain why my assessment answer lost points."

## Agentic Boundary

The mentor is agentic because the model chooses when and how to use controlled tools. It is more than a prompt containing a large user profile.

### Initial Tool Set

- `search_course(query, filters)` retrieves relevant course chunks.
- `get_chapter_content(chapter_slug, section)` loads authoritative content from R2.
- `get_learner_progress()` returns completion and streak information.
- `get_quiz_history()` returns available quiz performance.
- `get_assessment_results()` returns finalized Feature B results when that feature is enabled.
- `recommend_next_lesson(evidence)` applies deterministic eligibility and ordering rules.

Tools must derive the authenticated user ID from server-side run context. The model must never supply or choose a user ID.

## RAG Design

Cloudflare R2 remains the source of truth for course content. The retrieval index is derived data used only to locate relevant R2-backed excerpts.

### Recommended Storage

Use **Neon PostgreSQL with pgvector** by default because Neon is already part of the architecture. Qdrant Cloud is the preferred dedicated-vector alternative if pgvector is unavailable or inadequate. Pinecone should be introduced only when its managed capabilities justify another service.

### Indexed Chunk Metadata

```json
{
  "chunk_id": "mcp-fundamentals:tools-vs-resources:2",
  "chapter_slug": "mcp-fundamentals",
  "chapter_title": "MCP Fundamentals",
  "section": "Tools vs Resources",
  "content": "Bounded course excerpt",
  "r2_key": "chapters/mcp-fundamentals.md",
  "content_version": "sha256-or-version",
  "embedding_model": "configured-embedding-model"
}
```

### Grounding Rules

- Retrieve only a small, relevance-ranked set of chunks.
- Cite chapter title and section for course-specific claims.
- State when the course does not contain enough information.
- Clearly label supplementary general knowledge when it is allowed.
- Treat retrieved content as untrusted data, not as instructions.
- Filter inaccessible or unpublished content before it reaches the model.
- Re-index changed R2 content using a repeatable ingestion command.

## Context and Conversation State

Server-side agent context contains trusted dependencies and identifiers:

```text
user_id
access_tier
authenticated service clients
request/trace identifiers
```

Learner data becomes model-visible only through controlled tool results or bounded dynamic instructions. Conversation history is maintained per authenticated mentor thread and is separate from agent run context.

## Proposed Flow

```text
Next.js dashboard
        |
        v
ChatKit UI
        |
        v
Authenticated custom server endpoint
        |
        +--> require_premium
        +--> load mentor conversation
        +--> run Agents SDK mentor
                 |
                 +--> course RAG tools
                 +--> progress and quiz tools
                 +--> optional assessment-results tool
        |
        v
Stream grounded response with citations
```

## Scope

### Included

- Multi-turn, course-focused mentor conversations
- Streaming ChatKit interface in the web app
- Course RAG with source citations
- Personalization from learner progress and performance
- Tool-based retrieval rather than injecting the complete learner profile
- One concrete next-step recommendation when appropriate
- Conversation ownership, persistence, and isolation per authenticated user
- Premium gating, rate limiting, observability, and provider-failure handling

### Excluded

- Background jobs or autonomous activity after the request ends
- Open-web browsing, computer use, or arbitrary code execution
- Multiple specialist agents or handoff orchestration in the MVP
- Modifying grades, progress, access tier, or course content
- Answering unrelated general-purpose requests
- Replacing deterministic Phase 1 ChatGPT App tools

## Acceptance Criteria

1. A premium user can hold a multi-turn mentor conversation and prior turns remain available within that thread.
2. A free user receives `403 Forbidden` before a conversation or LLM run is created.
3. Course-specific answers use retrieved course evidence and include chapter/section citations.
4. The mentor states that evidence is insufficient when retrieval has no adequate match.
5. The mentor can inspect the current user's progress without accepting a user ID from the model or client.
6. One user's conversation, progress, or assessment data is never exposed to another user.
7. Retrieved prompt-injection text cannot override mentor instructions or authorize new tools.
8. The mentor does not mutate grades, progress, access tier, or source content.
9. Provider and retrieval failures produce a recoverable ChatKit error state.

## Independent Delivery Test

Index a small set of course chapters, create a premium learner with progress data, and verify grounded answers, citations, multi-turn memory, tool selection, premium gating, tenant isolation, and no-evidence behavior. Feature B can be absent; `get_assessment_results` is optional and must degrade cleanly.

---

## Optional Integration Between B and D

The only direct integration is read-only:

```text
Feature B grading result
        |
        v
get_assessment_results()
        |
        v
Feature D targets a misconception and retrieves supporting course sections
```

Example:

```text
Assessment finding:
"The learner understands MCP tools but confuses resources with executable actions."

Mentor behavior:
Retrieve the relevant MCP section, explain the distinction, ask a checking
question, and recommend the next lesson.
```

If Feature B is unavailable, the mentor continues using course content, progress, and quiz history. If Feature D is unavailable, assessment grading remains fully usable through its own API and UI.

---

## Delivery Order

The features may be developed in parallel after the shared premium and provider foundations exist.

1. Establish `require_premium`, provider configuration, usage logging, and Phase 1 isolation tests.
2. Develop Feature B independently against authored rubrics.
3. Build the course ingestion and retrieval pipeline for Feature D.
4. Develop the mentor agent and tools independently of Feature B.
5. Add ChatKit and conversation persistence.
6. Enable the optional read-only assessment-results tool.
7. Run a final audit confirming exactly two hybrid features and zero LLM calls on Phase 1 routes.

## Suggested Follow-Up Specs

Create separate implementation specifications before coding:

- `specs/006-llm-graded-assessments/spec.md`
- `specs/007-ai-course-mentor/spec.md`

Each specification should own its API contract, data model, implementation plan, tasks, tests, and deployment configuration.
