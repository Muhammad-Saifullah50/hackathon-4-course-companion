# Feature Specification: AI Course Mentor

**Feature Branch**: `007-ai-course-mentor`  
**Created**: 2026-06-15  
**Status**: Draft  
**Input**: User description: "Build the AI Course Mentor first for the web app, then later for the ChatGPT app. The mentor must be strictly course-grounded, Pro-only, support manual thread renaming, persist threads and messages, accept text messages only, enforce a 5-message-per-day limit, and reject unrelated questions."

## Clarifications

### Session 2026-06-16

- Q: Which submitted messages count against the 5-message-per-day mentor limit? → A: Count every valid Pro learner text message submitted to the mentor, including messages that are later blocked by guardrails or answered with limited evidence; exclude non-text and non-Pro attempts.
- Q: When does the daily mentor message limit reset? → A: Reset at 00:00 UTC for all learners.
- Q: What citation detail is required for mentor course references? → A: Cite the lesson/chapter title plus section heading when available.
- Q: How much thread history may the mentor use as response context? → A: Use the most recent 20 messages as response context, while retaining full history for display.
- Q: How long are mentor threads retained? → A: Retain mentor threads until learner account deletion; no thread deletion in this release.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Grounded Course Help (Priority: P1)

A Pro learner opens the mentor chat bubble in the web app and asks a question about the course. The mentor answers only with course-grounded help, cites the relevant lesson when possible, and clearly says when the course does not contain enough evidence.

**Why this priority**: This is the core value of the feature. Without grounded answers, the mentor is just a generic chat box.

**Independent Test**: Ask a course question that has clear support in the curriculum and verify the reply stays on-topic, cites the relevant course material, and gives a useful next step.

**Acceptance Scenarios**:

1. **Given** a Pro learner asks a supported course question, **When** the mentor responds, **Then** the answer uses course evidence and includes the relevant lesson reference.
2. **Given** a Pro learner asks an unrelated question, **When** the mentor workflow runs, **Then** an Agents SDK guardrail stops the turn and returns a clear course-scope message.
3. **Given** a Pro learner asks a course question with weak or missing evidence, **When** the mentor responds, **Then** it states that the course does not provide enough support and points the learner to the closest relevant lesson.

---

### User Story 2 - Continue a Thread (Priority: P2)

A Pro learner returns to a prior mentor thread and continues the conversation without losing context. The previous messages remain visible, the learner can rename the thread manually, and the thread title persists after the rename.

**Why this priority**: Continuity makes the mentor useful for actual study sessions instead of one-off answers.

**Independent Test**: Start a thread, send a few messages, return later, and verify the prior conversation is still there and the thread can be renamed.

**Acceptance Scenarios**:

1. **Given** an existing mentor thread, **When** the learner reopens it, **Then** the previous messages are visible in order.
2. **Given** a learner asks a follow-up question in the same thread, **When** the mentor responds, **Then** it uses the earlier conversation as context.
3. **Given** a learner renames a thread manually, **When** the learner returns later, **Then** the new thread name is preserved.

---

### User Story 3 - Stay Within Usage Limits (Priority: P3)

A Pro learner uses the mentor throughout the day. The product allows up to five learner messages per day, then blocks additional requests until the limit resets.

**Why this priority**: The limit protects the premium experience from runaway usage while still giving enough room for meaningful study.

**Independent Test**: Send five learner messages in one day and confirm the sixth request is blocked with a clear limit message.

**Acceptance Scenarios**:

1. **Given** a Pro learner has sent fewer than five mentor messages that day, **When** they send another message, **Then** the message is accepted normally.
2. **Given** a Pro learner has already sent five mentor messages that day, **When** they send another message, **Then** the product blocks the request and tells them when they can continue.
3. **Given** a learner reaches the daily limit, **When** they open a new thread, **Then** the limit still applies for the day.

---

### User Story 4 - Access Control and Input Rules (Priority: P4)

Only Pro learners can use the mentor, and the mentor accepts text messages only. Free users and non-Pro tiers are blocked before a conversation starts.

**Why this priority**: The feature is a premium capability and should not create hidden costs or unsupported interactions.

**Independent Test**: Try to open the mentor from a non-Pro account and from a text-only conversation, and verify access and input rules are enforced.

**Acceptance Scenarios**:

1. **Given** a non-Pro user tries to open the mentor, **When** the product checks access, **Then** it blocks the conversation before any mentor session begins.
2. **Given** a Pro learner tries to send a file, image, or other non-text input, **When** the product receives the request, **Then** it rejects the input and asks for text only.
3. **Given** a learner has access to the mentor, **When** they submit a text question, **Then** the mentor accepts it normally.

### Edge Cases

- What happens when the learner asks a question outside the course scope and the guardrail trips?
- What happens when the mentor cannot find enough supporting course evidence?
- What happens when the learner hits the daily message limit mid-conversation?
- What happens when the learner opens a thread that has no prior messages?
- What happens when a non-Pro user attempts to continue a shared link to a mentor thread?
- What happens when the learner tries to send a non-text input?

## Scope

### Included

- Pro-only mentor access in the web app
- Course-grounded answers with lesson references when applicable
- Agents SDK guardrail handling for unrelated questions
- Follow-up questions that preserve thread context
- Manual thread renaming by the learner
- Persistent conversation history across sessions
- Daily usage limits for learner messages
- Text-only input
- Clear guidance when the course does not contain enough support for an answer
- A concrete next learning action when the mentor can recommend one

### Excluded

- ChatGPT app support in this release
- Human instructor review
- Automatic changes to progress, quiz scores, or access tier
- General-purpose conversation outside the course scope
- File, image, audio, or video input
- Assessment-result integration in this release

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow Pro learners to start a mentor conversation in the web app.
- **FR-002**: The system MUST block non-Pro users from starting a mentor conversation.
- **FR-003**: The system MUST keep each mentor thread’s full message history available for later viewing by the same learner until learner account deletion.
- **FR-004**: The system MUST allow a learner to manually rename a mentor thread.
- **FR-005**: The system MUST preserve a thread’s renamed title across later visits.
- **FR-006**: The system MUST answer only course-related questions and MUST use Agents SDK guardrails to block unrelated requests.
- **FR-007**: The system MUST use course evidence as the basis for answers and MUST identify when evidence is insufficient.
- **FR-008**: The system MUST cite the lesson or chapter title plus section heading when available for each course-specific answer.
- **FR-009**: The system MUST limit each learner to five valid Pro learner text messages submitted to the mentor per day, including guardrail-blocked and limited-evidence turns, and MUST exclude non-text and non-Pro attempts from the count.
- **FR-010**: The system MUST clearly tell the learner when the daily message limit has been reached and that usage resumes at 00:00 UTC.
- **FR-011**: The system MUST accept text messages only.
- **FR-012**: The system MUST reject non-text inputs with a clear explanation.
- **FR-013**: The system MUST keep mentor conversations isolated so one learner cannot view another learner’s threads or messages.
- **FR-014**: The system MUST avoid changing course progress, quiz scores, or access tier as a side effect of a mentor conversation.
- **FR-015**: The system MUST provide a concrete next learning action when the conversation naturally supports one.
- **FR-016**: The system MUST use no more than the most recent 20 messages from the current thread as conversation context when generating a mentor response.

### Key Entities *(include if feature involves data)*

- **Mentor Thread**: A learner-owned conversation with a stable title and a visible message history retained until learner account deletion.
- **Mentor Message**: A single learner or mentor turn within a thread.
- **Course Reference**: A cited course lesson or chapter title, plus section heading when available, used to support an answer.
- **Learner Usage Record**: The daily message count used to enforce the usage limit.
- **Learner Context**: The learner’s most recent 20 messages from the current thread and relevant course progress used to keep responses coherent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A Pro learner can open the mentor and receive a grounded first answer in under 30 seconds in the typical case.
- **SC-002**: At least 90% of supported course questions receive answers that include a relevant course reference or a clear statement that the course evidence is insufficient.
- **SC-003**: A learner can return to a previous mentor thread and continue the conversation without losing prior context.
- **SC-004**: A learner can rename a thread and see the new name persist on the next visit.
- **SC-005**: 100% of unrelated questions are stopped by guardrails with a clear scope explanation.
- **SC-006**: The daily message limit is enforced consistently after the fifth learner message in a day.

## Assumptions

- The mentor is delivered in the web app first and the ChatGPT app version is future work.
- Only Pro users can access the mentor in this release.
- The daily message limit resets at 00:00 UTC for all learners.
- Course content is the only authority for answers; the mentor does not use open-web knowledge.
- Thread deletion by the learner, export, and assessment-result integration are not part of this release.
