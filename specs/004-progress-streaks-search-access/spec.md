# Feature Specification: Progress, Streaks, Search & Access Control

**Feature Branch**: `004-progress-streaks-search-access`  
**Created**: 2026-06-05  
**Status**: Draft  
**Input**: User description: "Progress tracking (chapter completion per user), streak calculation (consecutive active days stored on user row), keyword search over cached chapter content, and access tier check endpoint."

---

## Clarifications

### Session 2026-06-05

- Q: What triggers a chapter "completion"? → A: Any PUT call with a chapter slug = completion; quiz score is optional and stored if provided, but not required.
- Q: Progress row uniqueness model? → A: One row per (user, chapter_slug) — upserted on re-completion, keeping the latest timestamp.
- Q: Should search results include per-result access gating? → A: No — search returns slug, title, excerpt, and rank only; access gating is handled by the separate `/access/check` endpoint.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Mark a Chapter as Complete (Priority: P1)

An authenticated student finishes reading a chapter and the system records that completion, updates their active streak, and returns their current progress state.

**Why this priority**: Every other feature (streaks, gamification, freemium gating) depends on completion data existing. Without it nothing else can be built or tested.

**Independent Test**: Submit a chapter completion for a user and verify the response shows the chapter marked complete and a streak ≥ 1.

**Acceptance Scenarios**:

1. **Given** a valid JWT and a chapter slug that exists, **When** the client sends a completion request, **Then** the response contains the chapter slug, `completed_at` timestamp, and the user's updated `current_streak`.
2. **Given** a chapter already marked complete today, **When** the same request is submitted again, **Then** the system returns 200 with idempotent data (no duplicate row, streak unchanged).
3. **Given** an invalid or expired JWT, **When** a completion request is sent, **Then** the system returns 401.

---

### User Story 2 — View My Progress (Priority: P1)

An authenticated student wants to see which chapters they have completed and their current streak so they can track learning momentum.

**Why this priority**: Core feature for a learning platform — without progress visibility users cannot gauge where they are in the course.

**Independent Test**: After marking two completions, call the progress endpoint and verify both chapters appear in the response with correct timestamps and streak.

**Acceptance Scenarios**:

1. **Given** a user with no completions, **When** they fetch their progress, **Then** the response contains an empty completions list and `current_streak: 0`.
2. **Given** a user with three completed chapters, **When** they fetch their progress, **Then** the response lists all three slugs with `completed_at` dates and the correct `current_streak`.
3. **Given** a user requesting another user's progress, **When** the request arrives (user_id in path does not match JWT sub), **Then** the system returns 403.

---

### User Story 3 — Streak Calculation (Priority: P2)

The system automatically awards and maintains a daily streak counter — consecutive calendar days on which the student completed at least one chapter.

**Why this priority**: Streaks drive re-engagement but are not blocking for the core learning flow; correctness matters more than immediacy.

**Independent Test**: Simulate completions on days D, D+1, D+3 and verify streak resets to 1 on the gap day.

**Acceptance Scenarios**:

1. **Given** completions on two consecutive calendar days, **When** progress is fetched, **Then** `current_streak` is 2.
2. **Given** a one-day gap between completions, **When** a new completion arrives after the gap, **Then** `current_streak` resets to 1.
3. **Given** multiple completions on the same calendar day, **When** progress is fetched, **Then** the streak counts that day only once (no double-increment).

---

### User Story 4 — Keyword Search (Priority: P2)

An authenticated student types a search query and receives a ranked list of chapters whose title or body content matches the keywords.

**Why this priority**: Improves navigation for a multi-chapter course but is not blocking for content consumption.

**Independent Test**: Index two chapters where only one contains the query term; call the search endpoint and verify only that chapter is returned.

**Acceptance Scenarios**:

1. **Given** a query matching text in one chapter title, **When** the search endpoint is called, **Then** the response includes that chapter's slug and title with a relevance rank.
2. **Given** a query matching no chapters, **When** the endpoint is called, **Then** the response returns an empty results list with HTTP 200.
3. **Given** a blank or whitespace-only query, **When** the endpoint is called, **Then** the system returns HTTP 400.
4. **Given** a valid JWT is absent, **When** a search request arrives, **Then** the system returns 401.

---

### User Story 5 — Access Tier Check (Priority: P3)

An authenticated client (web app or ChatGPT app) checks whether the current user can access a specific resource given their tier.

**Why this priority**: Freemium gating is important but the `access_tier` field already exists on the user row; this endpoint simply exposes it with an optional gating calculation.

**Independent Test**: Call the access check endpoint for a free-tier user requesting a premium resource; verify `allowed: false` is returned.

**Acceptance Scenarios**:

1. **Given** a free-tier user, **When** `/access/check` is called without a resource parameter, **Then** the response contains `tier: "free"`.
2. **Given** a free-tier user and `resource=premium`, **When** the endpoint is called, **Then** `allowed: false` is returned.
3. **Given** a premium-tier user and `resource=premium`, **When** the endpoint is called, **Then** `allowed: true` is returned.
4. **Given** no JWT, **When** the endpoint is called, **Then** the system returns 401.

---

### Edge Cases

- What happens when a chapter slug in a completion request does not exist in the R2 catalogue? → Return 404.
- What happens when `last_active_date` is null (brand-new user)? → First completion sets streak to 1.
- What if the server clock differs from the client timezone? → All dates computed in UTC; streak day boundaries are UTC midnight.
- How does search handle special characters or injection attempts? → Query treated as a plain string; no regex or eval from user input.
- What happens if the chapter cache is cold during search? → Return 503; cache warms at server startup.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST record a chapter completion for an authenticated user when the PUT endpoint is called with a chapter slug; a quiz score (0–100) is optional and stored if provided but is NOT required for the completion to be recorded.
- **FR-002**: There is exactly one row per (user, chapter_slug) in the progress store. Submitting a completion for a chapter the user has already completed MUST upsert that row (update `completed_at` and `quiz_score` if provided) rather than create a duplicate. The streak MUST NOT be incremented again if the user already completed a chapter today.
- **FR-003**: System MUST expose a read endpoint returning all completions for the authenticated user along with `current_streak` and `last_active_date`.
- **FR-004**: A user MUST only be able to read and write their own progress; JWT subject must match the `user_id` path parameter, otherwise 403.
- **FR-005**: System MUST increment `current_streak` when a completion is recorded on the UTC calendar day immediately following `last_active_date`.
- **FR-006**: System MUST reset `current_streak` to 1 when a completion is recorded after a gap of more than one UTC calendar day since `last_active_date`.
- **FR-007**: System MUST NOT increment the streak more than once per UTC calendar day regardless of how many completions occur that day.
- **FR-008**: System MUST provide a keyword search endpoint accepting a `q` query parameter and returning chapters whose title or body content contains the search terms.
- **FR-009**: Search results MUST be ranked so that title matches rank above body-only matches.
- **FR-010**: Search MUST reject blank or whitespace-only queries with HTTP 400.
- **FR-011**: System MUST provide an access check endpoint returning the authenticated user's `tier` and an `allowed` boolean; an optional `resource` query parameter (`premium`) determines the `allowed` value.
- **FR-012**: All endpoints MUST require a valid Stytch JWT; any request without a valid token MUST be rejected with 401.
- **FR-013**: System MUST NOT make any LLM API calls (Phase 1 constraint — immediate disqualifier if violated).

### Key Entities

- **ChapterProgress**: Records one user's completion of one chapter. One row per (user, chapter_slug) — upserted on re-completion. Attributes: user identifier, chapter slug, UTC completion timestamp (updated on re-completion), optional quiz score.
- **User (extended)**: Existing user entity gains `current_streak` (integer, default 0) and `last_active_date` (UTC date, nullable).
- **SearchResult**: A matched chapter. Attributes: chapter slug, title, short excerpt with match context, relevance rank. Access gating is NOT included in search results.
- **AccessStatus**: Result of an access check. Attributes: user tier string, optional resource requested, `allowed` boolean.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A student can mark a chapter complete and receive updated streak data in under 500 ms (95th percentile).
- **SC-002**: Progress fetch for a user with up to 50 completed chapters returns within 200 ms.
- **SC-003**: Keyword search over the full chapter catalogue returns results within 300 ms for queries of 1–5 words.
- **SC-004**: Streak logic is 100% correct across a test suite covering consecutive days, gaps, same-day duplicates, and brand-new users.
- **SC-005**: All four endpoint groups return 401 for every unauthenticated request.
- **SC-006**: Access check reflects the user's stored tier with zero false positives and zero false negatives.

---

## Assumptions

- All dates and timestamps are stored and compared in UTC; "calendar day" means UTC date at midnight boundary.
- The chapter content cache is pre-warmed at server startup; search does not trigger R2 fetches at query time.
- Quiz score in a completion record is optional; callers may omit it.
- The `resource` query param on `/access/check` accepts `"premium"`; any other value is treated as a free resource (returns `allowed: true` for all tiers).
- The `users` table will be extended with `current_streak` and `last_active_date` via a new database migration.
- A new `chapter_progress` table will be added via the same migration.
