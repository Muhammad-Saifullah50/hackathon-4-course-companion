# Feature Specification: Content Delivery

**Feature Branch**: `1-content-delivery`  
**Created**: 2026-06-03  
**Status**: Draft  
**Input**: User description: "Content Delivery feature for Course Companion FTE — serves 5 Markdown course chapters (2 Claude Agent SDK, 2 MCP, 1 Agent Skills) from Cloudflare R2 via FastAPI. Uses manifest.json in R2 to define chapter order/slugs. Endpoints: list chapters, get by slug, next/prev navigation, media signed URLs. Content written by researching official docs (Claude Agent SDK, MCP, Agent Skills). Slug-based IDs. No DB for content metadata. R2 via boto3 with pydantic-settings config. Router at backend/src/routers/content.py, service at backend/src/services/content.py."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Course Chapters (Priority: P1)

A learner (via ChatGPT app) asks for the course outline. The tutor fetches the list of all available chapters, returning their titles and slugs in order so the learner knows what to study.

**Why this priority**: Everything else depends on being able to list chapters. Without this, ChatGPT cannot orient the learner or navigate the course.

**Independent Test**: Can be fully tested by calling the list-chapters endpoint and verifying all 5 chapters are returned in the correct order with titles and slugs.

**Acceptance Scenarios**:

1. **Given** the course has 5 chapters in the manifest, **When** a client requests the chapter list, **Then** all 5 chapters are returned in order with slug, title, and order number.
2. **Given** the R2 manifest is temporarily unavailable, **When** a client requests the chapter list, **Then** the system returns a service-unavailable error with a clear message.

---

### User Story 2 - Read a Specific Chapter (Priority: P1)

A learner requests a specific chapter by its slug (e.g., "claude-agent-sdk-introduction"). The system returns the full Markdown content plus navigation hints (next and previous chapter slugs).

**Why this priority**: Core content delivery — this is the primary value of the feature.

**Independent Test**: Can be fully tested by fetching a single chapter by slug and verifying content is returned with correct next/prev slugs.

**Acceptance Scenarios**:

1. **Given** a valid chapter slug, **When** a client requests that chapter, **Then** full Markdown content is returned along with the next and previous chapter slugs (null if at boundary).
2. **Given** an invalid or non-existent slug, **When** a client requests that chapter, **Then** the system returns a not-found error.
3. **Given** the first chapter is requested, **When** the client reads the navigation metadata, **Then** the previous slug is null and the next slug is the second chapter.
4. **Given** the last chapter is requested, **When** the client reads the navigation metadata, **Then** the next slug is null and the previous slug is the fourth chapter.

---

### User Story 3 - Navigate Between Chapters (Priority: P2)

A learner finishes a chapter and asks to move to the next one. The system provides a direct navigation endpoint to get the next or previous chapter slug without re-fetching the full chapter content.

**Why this priority**: Enhances the tutoring flow but the core use case (get chapter by slug) still works without it.

**Independent Test**: Can be fully tested by calling next/prev endpoints on a known slug and verifying the returned slug.

**Acceptance Scenarios**:

1. **Given** a chapter slug in the middle of the course, **When** a client requests the next chapter slug, **Then** the slug of the following chapter is returned.
2. **Given** the last chapter slug, **When** a client requests the next chapter, **Then** the system returns a not-found or boundary error.
3. **Given** the first chapter slug, **When** a client requests the previous chapter, **Then** the system returns a not-found or boundary error.

---

### User Story 4 - Access Chapter Media (Priority: P3)

A chapter references an embedded image or diagram. The system provides a short-lived access URL for that media asset so it can be displayed securely without exposing storage credentials.

**Why this priority**: Media enhances content quality but chapters are still readable without it.

**Independent Test**: Can be fully tested by requesting a signed URL for a known media filename and verifying it is a valid, time-limited URL.

**Acceptance Scenarios**:

1. **Given** a valid chapter slug and media filename, **When** a client requests the media URL, **Then** a short-lived signed URL is returned.
2. **Given** a media filename that does not exist in storage, **When** a client requests its URL, **Then** the system returns a not-found error.

---

### Edge Cases

- What happens when the manifest exists but lists a slug whose `.md` file is missing in R2?
- What happens when the manifest JSON is malformed?
- How does the system handle a chapter with no media assets when a media URL is requested?
- What if two chapters have the same slug in the manifest?

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST serve a manifest-driven ordered list of all course chapters, including slug, title, and order number for each.
- **FR-002**: System MUST return the full Markdown content of a chapter when requested by its slug.
- **FR-003**: System MUST include next and previous chapter slugs in every chapter response, with null values at course boundaries.
- **FR-004**: System MUST provide dedicated next and previous navigation endpoints that return only the adjacent chapter slug.
- **FR-005**: System MUST generate short-lived signed access URLs for media assets stored alongside chapter content.
- **FR-006**: System MUST return a not-found response when a requested slug is not present in the manifest.
- **FR-007**: System MUST return a service-unavailable response when the content storage layer is unreachable.
- **FR-008**: System MUST serve 5 chapters authored from official documentation: 2 covering the Claude Agent SDK, 2 covering the Model Context Protocol, and 1 covering Agent Skills.
- **FR-009**: Each chapter MUST follow a consistent structure: Introduction, Core Concepts, Code Examples, and Key Takeaways.
- **FR-010**: Chapter ordering and navigation MUST be driven solely by the manifest — no database involvement for content metadata.

### Key Entities

- **Manifest**: Ordered list of chapter entries; each entry has a slug, human-readable title, and numeric order. Single source of truth for chapter sequence.
- **Chapter**: A authored course unit stored as Markdown. Identified by slug. Contains structured educational content (intro, concepts, code, takeaways). Delivered with navigation context.
- **Media Asset**: A binary file (image, diagram) associated with a chapter, stored alongside it. Accessed via a time-limited URL to protect storage credentials.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 chapters are accessible by slug within 2 seconds under normal conditions.
- **SC-002**: The chapter list endpoint returns all 5 chapters in the correct order on every request.
- **SC-003**: Navigation responses correctly identify the next and previous chapters with zero errors across all 5 chapters including boundaries.
- **SC-004**: Signed media URLs are delivered in under 1 second and expire after a configurable window (default: 1 hour).
- **SC-005**: Invalid slug requests return a not-found response 100% of the time — no chapter content is leaked for unknown slugs.
- **SC-006**: All 5 chapters cover their designated topics with grounded content sourced from official documentation.

---

## Assumptions

- The R2 bucket and credentials are configured before deployment; local development may use a local file fallback.
- Chapter content is authored once and updated infrequently — no caching invalidation strategy is required for Phase 1.
- Signed URL expiry of 1 hour is acceptable for media assets; this is configurable via environment variable.
- The manifest is the authoritative source for chapter ordering; chapter files do not contain ordering metadata.
- All 5 chapters will be authored as part of this feature before the backend is deployed.
- Media assets are optional per chapter; chapters without media are fully valid.
