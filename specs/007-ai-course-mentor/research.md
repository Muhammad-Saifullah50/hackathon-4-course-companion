# Research: AI Course Mentor

**Feature**: 007-ai-course-mentor  
**Date**: 2026-06-16

## Documentation basis

- OpenAI Agents SDK overview: agents are LLMs with instructions/tools, agents-as-tools/handoffs support delegation, guardrails validate inputs/outputs, function tools wrap Python functions, and tracing supports debugging.
- OpenAI Agents SDK LiteLLM adapter: use LiteLLM as the model boundary for non-OpenAI providers such as OpenRouter.
- OpenAI Agents SDK guardrails: input guardrails run on initial user input, output guardrails run on final agent output, tool guardrails wrap function-tool calls, and tripwires can halt execution.
- OpenAI ChatKit advanced integration docs and ChatKit Python SDK: for new custom infrastructure, run a ChatKit server backed by the Agents SDK, expose it through FastAPI, persist thread/message state through a Store implementation, and render the frontend with `@openai/chatkit-react`.

## Decision: Implement as a premium hybrid backend feature

Use `/premium/mentor` FastAPI routes for all mentor operations. Require authenticated Pro access on every endpoint before allowing thread creation, message submission, thread listing, or rename operations.

**Rationale**: The constitution allows Phase 2 hybrid features only when isolated under premium routes, gated behind paid-tier access checks, user-initiated, and cost-tracked. The mentor requires LLM reasoning, so it must not be implemented in the deterministic Phase 1 route set.

**Alternatives considered**:

- Public `/mentor` route with client-side hiding: rejected because access must be enforced server-side.
- Existing `/search` route plus client-only synthesis: rejected because the feature requires persisted chat and mentor responses.
- ChatGPT app first: rejected by spec; this release is web app first.

## Decision: Use OpenAI Agents SDK with LiteLLM for OpenRouter/Nvidia Nemotron

Implement the mentor as an OpenAI Agents SDK agent in `backend/src/agents/`. Configure its model through the Agents SDK LiteLLM adapter, with OpenRouter credentials and the Nvidia Nemotron model slug supplied by environment variables. Do not create an `openrouter.py` wrapper or provider-specific HTTP client.

**Rationale**: The current Agents SDK positions agents, tools, handoffs/agents-as-tools, and guardrails as its core primitives, and its docs include LiteLLM as a third-party model adapter. This matches the requirement to build tool-using mentor agents while still routing the configured model through OpenRouter/Nvidia Nemotron.

**Alternatives considered**:

- Direct provider-specific SDK: rejected because the model boundary should remain the LiteLLM adapter configured by environment.
- LangChain: rejected because the project has standardized on OpenAI Agents SDK primitives for premium agent workflows.

## Decision: Build a full RAG pipeline with R2 source content and Neon pgvector retrieval

Keep Cloudflare R2 as the authoritative source for chapter content, but add an indexing pipeline that chunks course content, embeds each chunk, and stores the vectors plus source metadata in Neon PostgreSQL with pgvector. Expose retrieval to the mentor agent through a typed Agents SDK function tool that queries the vector table and returns top course chunks with chapter slug, lesson/chapter title, section heading, chunk text, and relevance score.

**Rationale**: The mentor is a retrieval augmented generation feature, not a keyword-search-plus-wrapper flow. R2 remains the content authority, while Neon pgvector provides durable semantic retrieval and lets the agent cite the exact chunks it used.

**Alternatives considered**:

- Store generated summaries as retrieval source: rejected because source authority must remain the actual R2 course content.
- Open-web retrieval: rejected by the course-grounding requirement.
- Keyword-only search: rejected because the requirement calls for chunking, vectorization, vector database storage, and retrieval from that database.

## Decision: Persist full thread history but limit response context to 20 messages

Store every mentor message until learner account deletion. Display full thread history to the learner, but pass at most the latest 20 messages from the current thread into response generation.

**Rationale**: This satisfies continuity without unbounded token growth. The clarified spec explicitly separates display retention from response context.

**Alternatives considered**:

- Send full history to the model: rejected because token/cost growth becomes unbounded.
- Store only recent messages: rejected because learners must be able to return to full prior thread history.
- Ignore prior messages: rejected because follow-up questions must use thread context.

## Decision: Enforce quota with one UTC-date usage row per learner

Create a `mentor_usage_records` table keyed by `(user_id, usage_date)`. Increment only after validating authenticated Pro access and text input, and count guardrail-blocked or limited-evidence turns as accepted mentor requests. Reset behavior is implicit because the usage date is UTC.

**Rationale**: A keyed daily row makes the five-message rule simple, testable, and efficient. It also supports clear reset messaging at 00:00 UTC.

**Alternatives considered**:

- Rolling 24-hour window: rejected by clarification.
- Count only answered messages: rejected by clarification and would weaken cost controls.
- Count non-text/non-Pro attempts: rejected because those are blocked before mentor processing.

## Decision: Use ChatKit React as a floating chat surface with no frontend API routes

Do not add a standalone `/mentor` page and do not add Next.js `/api/mentor` proxy routes. Add an authenticated chat bubble and pop-up chat window to the existing web app shell using `@openai/chatkit-react`. The ChatKit client fetches directly from the FastAPI backend ChatKit endpoint with the learner's existing auth token.

**Rationale**: ChatKit's current guidance for advanced integrations recommends running a custom ChatKit server with ChatKit Python and the Agents SDK when applications need their own authentication, storage, and orchestration. The existing FastAPI backend is already the authoritative access-control boundary, so adding Next.js route handlers would create an unnecessary proxy layer.

**Alternatives considered**:

- Standalone `/mentor` page: removed because the mentor should be available as a bubble/pop-up chat window.
- Next.js API route handlers: rejected because the frontend should call the FastAPI backend directly.
- Client-side-only chat state: rejected because ChatKit threads/messages must be persisted by the backend data store.

## Decision: Enforce course scope with Agents SDK guardrails

Attach input, output, and tool guardrails to the mentor agent and retrieval tool. Input guardrails validate that learner requests are text-only and course-oriented before expensive agent work. Tool guardrails validate retrieval-tool arguments and outputs. Output guardrails verify that final mentor messages are grounded in retrieved course chunks and include citations when course content is used.

**Rationale**: Agents SDK guardrails are first-class primitives for validating inputs, outputs, and function-tool calls, and tripwires can halt execution when a check fails. This keeps scope and safety enforcement in the agent workflow instead of inventing refusal-specific API statuses.

**Alternatives considered**:

- Custom refusal status routing: rejected because guardrails own this behavior.
- Free-form-only safety text: rejected because tests need deterministic guardrail behavior and citations.
- Client-side scope checks: rejected because guardrails and access checks must run on the backend.
