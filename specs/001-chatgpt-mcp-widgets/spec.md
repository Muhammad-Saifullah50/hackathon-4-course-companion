# Feature Specification: ChatGPT App — MCP Server + React Widgets

**Feature Branch**: `001-chatgpt-mcp-widgets`
**Created**: 2026-06-05
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Browse and Read Course Chapters (Priority: P1)

A learner opens ChatGPT, connects the Course Companion app, and asks about an AI Agent Development topic. ChatGPT retrieves the relevant chapter and displays its content in an interactive panel inside the chat. The learner can navigate to the next or previous chapter, and jump to the quiz for that chapter — all without leaving ChatGPT.

**Why this priority**: Content delivery is the core value proposition. Every other feature depends on chapters being accessible. Unauthenticated users can use this without signing in.

**Independent Test**: Connect the app in ChatGPT, ask "show me chapter 1", verify a chapter panel appears with title, content, and navigation buttons.

**Acceptance Scenarios**:

1. **Given** the app is connected, **When** a user asks ChatGPT to list available chapters, **Then** a visual panel shows all chapters with titles and completion status.
2. **Given** the app is connected, **When** a user requests a specific chapter by name or number, **Then** the chapter content is displayed in a readable panel with next/previous navigation.
3. **Given** a user is viewing a chapter panel, **When** they click "Next Chapter", **Then** the adjacent chapter loads in the same panel without requiring a new chat message.
4. **Given** a user requests a chapter that does not exist, **When** ChatGPT calls the chapter tool, **Then** a clear "chapter not found" message is shown and ChatGPT explains gracefully.

---

### User Story 2 — Take a Quiz with Immediate Feedback (Priority: P2)

An authenticated learner asks ChatGPT to quiz them on a chapter they just read. ChatGPT opens an interactive quiz panel showing one question at a time. The learner selects answers directly in the panel. Each answer triggers instant feedback (correct/incorrect) without a round-trip through the chat. At the end, the learner sees their total score.

**Why this priority**: Quizzes are the primary learning reinforcement mechanism. Requires authentication to associate scores with user progress.

**Independent Test**: Sign in, ask "quiz me on chapter 2", verify quiz panel appears, answer all questions, verify score screen is shown.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they ask for a quiz on a chapter, **Then** a quiz panel opens showing the first question with multiple-choice options.
2. **Given** a quiz is in progress, **When** the user selects an answer in the panel, **Then** the panel immediately shows correct/incorrect feedback without a new ChatGPT message.
3. **Given** the user has answered all questions, **Then** a summary screen shows total score and a prompt to view progress.
4. **Given** an unauthenticated user requests a quiz, **Then** ChatGPT prompts them to sign in before the quiz panel opens.

---

### User Story 3 — View Learning Progress and Streaks (Priority: P3)

An authenticated learner asks ChatGPT how they're doing. ChatGPT displays a progress dashboard panel showing their current learning streak (consecutive days of activity), overall course completion percentage, and per-chapter completion status.

**Why this priority**: Progress visibility motivates continued learning. Requires authentication to retrieve user-specific data.

**Independent Test**: Sign in, complete one chapter, ask "what's my progress?", verify dashboard panel shows streak and completion data.

**Acceptance Scenarios**:

1. **Given** an authenticated user with completed chapters, **When** they ask about their progress, **Then** a dashboard panel shows streak count, completion percentage, and a per-chapter list.
2. **Given** a user who has not completed any chapters, **Then** the panel shows zero progress with an encouraging prompt to start.
3. **Given** a user with a multi-day streak, **Then** the streak count is prominently displayed.

---

### User Story 4 — Search Course Content by Keyword (Priority: P4)

A learner asks ChatGPT to find content about a specific concept (e.g., "find chapters about MCP tools"). ChatGPT returns a search-results panel listing matching chapters with excerpts showing where the keyword appears. The learner can click any result to open that chapter directly.

**Why this priority**: Search helps learners quickly locate specific content across the full course. Available without authentication.

**Independent Test**: Ask "search for tool use", verify a results panel appears with chapter titles and matching excerpts.

**Acceptance Scenarios**:

1. **Given** a keyword query, **When** ChatGPT calls the search tool, **Then** a results panel shows matching chapters with title and a short excerpt highlighting the match.
2. **Given** a keyword with no matches, **Then** the panel shows "no results found" and suggests browsing chapters.
3. **Given** a result in the panel, **When** the user clicks "Read Chapter", **Then** the chapter-reader panel opens for that chapter.

---

### User Story 5 — Check Content Access Tier (Priority: P5)

An authenticated learner encounters a premium chapter. ChatGPT checks their access tier and displays a panel showing their current tier (Free or Premium), how many chapters are unlocked, and an upgrade prompt if they are on the free tier.

**Why this priority**: Access gating is a business requirement. Provides a clear, non-disruptive way to inform users of content limits.

**Independent Test**: Sign in as a free-tier user, request a premium chapter, verify access-status panel appears with tier info and upgrade prompt.

**Acceptance Scenarios**:

1. **Given** a free-tier authenticated user requests a premium chapter, **When** ChatGPT checks access, **Then** an access-status panel shows their tier, unlocked chapter count, and an upgrade call-to-action.
2. **Given** a premium-tier user, **When** access is checked, **Then** the panel confirms full access with no upgrade prompt.
3. **Given** an unauthenticated user, **When** access is checked, **Then** ChatGPT prompts them to sign in first.

---

### Edge Cases

- What happens when the backend is unreachable? ChatGPT receives an error message and informs the user the service is temporarily unavailable.
- What happens when an authenticated user's session expires mid-conversation? ChatGPT automatically triggers re-authentication before retrying the tool call.
- What happens when a chapter has no associated quiz? The chapter panel loads normally; the "Take Quiz" button is absent or shows "No quiz available".
- What happens when a user's access token lacks required scopes? The tool returns an authorization error; ChatGPT prompts the user to re-link the app.
- What happens when search returns a very large result set? Results are capped at a reasonable limit; the panel indicates total matches with a note to refine the query.
- What happens when a user tries to use the app without connecting it first? ChatGPT's standard app-linking flow handles this before any tool is called.

---

## Requirements *(mandatory)*

### Functional Requirements

**Content Access (unauthenticated)**

- **FR-001**: Users MUST be able to list all course chapters without signing in.
- **FR-002**: Users MUST be able to read any free-tier chapter without signing in.
- **FR-003**: Users MUST be able to search course content by keyword without signing in.
- **FR-004**: All chapter content and search results MUST be displayed in a visual panel inside the ChatGPT conversation.

**Quiz (authenticated)**

- **FR-005**: Authenticated users MUST be able to retrieve quiz questions for any chapter they have access to.
- **FR-006**: Quiz answer submission MUST be handled within the visual panel without triggering a new ChatGPT narration per answer.
- **FR-007**: Quiz scores MUST be recorded against the authenticated user's account.

**Progress (authenticated)**

- **FR-008**: Authenticated users MUST be able to view their learning streak, overall completion percentage, and per-chapter completion status in a visual panel.

**Access Control (authenticated)**

- **FR-009**: Authenticated users MUST be able to check their access tier and see how many chapters they can access.
- **FR-010**: Access control MUST be enforced server-side on every protected tool call — the ChatGPT app MUST NOT be the sole gatekeeper.

**Authentication**

- **FR-011**: Users MUST be able to authenticate via ChatGPT's standard account-linking flow the first time they use a protected tool.
- **FR-012**: After successful authentication, all protected tools MUST be callable without repeating the sign-in step within the same session.
- **FR-013**: Public tools (chapter browsing, search) MUST remain accessible to unauthenticated users at all times.

**Visual Panels (all tools)**

- **FR-014**: Every tool MUST return a visual panel rendered inside ChatGPT's conversation — no tool returns plain text only.
- **FR-015**: Visual panels MUST support in-panel navigation actions (e.g., open another chapter, start quiz) that invoke further tool calls without requiring the user to type a new message.

**Deployment**

- **FR-016**: The ChatGPT app MUST be deployable independently from the backend and web frontend.
- **FR-017**: The backend API base URL MUST be configurable via environment variable — no hardcoded URLs anywhere in the app.

---

### Key Entities

- **Chapter**: A course unit with a slug identifier, title, content, and navigation metadata (next/previous slugs).
- **Quiz**: A set of multiple-choice questions tied to a chapter; questions can be fetched publicly but submission requires authentication.
- **User Progress**: Per-user record of completed chapters, quiz scores, and learning streak (consecutive active days).
- **Access Tier**: A user attribute (Free or Premium) that governs how many chapters the user can access.
- **Tool**: A named capability the ChatGPT app exposes; each tool maps to one backend API call and one visual panel.
- **Visual Panel**: An interactive UI component rendered inside the ChatGPT conversation, capable of triggering further tool calls without a new user message.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can browse and read a free chapter inside ChatGPT within 30 seconds of connecting the app — no sign-in required.
- **SC-002**: An authenticated user can complete a full quiz (all questions + score screen) without leaving the ChatGPT conversation.
- **SC-003**: All 7 tools are callable and return a visual panel when tested in ChatGPT Developer Mode.
- **SC-004**: A keyword search returns visible results in under 3 seconds as perceived by the user.
- **SC-005**: An unauthenticated user attempting a protected action is prompted to sign in — no protected data is returned without a valid authenticated session.
- **SC-006**: A new ChatGPT user can connect the app and complete the account-linking flow in under 2 minutes.
- **SC-007**: All visual panels render correctly at ChatGPT's panel width with no horizontal scrolling or layout overflow.

---

## Assumptions

- The FastAPI backend is deployed and all 5 backend features (content, quizzes, progress, search, access) are stable.
- Stytch Connected Apps is enabled in the Stytch project dashboard before the ChatGPT app is deployed.
- The ChatGPT app is tested via ChatGPT Developer Mode before any production submission.
- Tutor skill files and persona behavior are **out of scope** — the app instructions contain only a brief description and a summary of available tools (Feature 7 handles the full skill content).
- Widget UI is bundled as part of the ChatGPT app deployment — no separate CDN hosting is required.
- Free-tier access limits are defined and enforced by the backend; this app does not implement access rules independently.

---

## Out of Scope

- Tutor skill files and detailed persona behavior (Feature 7)
- Next.js web frontend dashboard (Phase 3)
- Premium hybrid LLM features (Phase 2)
- Push notifications or proactive ChatGPT messages
- Multi-language support
