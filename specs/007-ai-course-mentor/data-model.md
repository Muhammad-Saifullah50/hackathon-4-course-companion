# Data Model: AI Course Mentor

**Feature**: 007-ai-course-mentor  
**Date**: 2026-06-16

## Entities

### 1. User (existing)

**Table**: `users`

Used as the owner for mentor threads, mentor messages, and usage records. Pro access is derived from `users.access_tier`.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `VARCHAR(64)` | PK | Stytch user ID |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Existing |
| `access_tier` | `VARCHAR(32)` | NOT NULL | Must be exactly `pro` for mentor access in this release |

### 2. MentorThread

**Table**: `mentor_threads`

Learner-owned conversation container retained until learner account deletion.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | Stable thread ID |
| `user_id` | `VARCHAR(64)` | NOT NULL, FK -> users.id ON DELETE CASCADE, INDEX | Owner |
| `title` | `VARCHAR(120)` | NOT NULL | Manual learner-provided title; default generated deterministically, e.g. `New mentor thread` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now() | UTC |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now(), onupdate=now() | Updated on rename or message append |

**Validation rules**:

- Title must be trimmed.
- Title length must be 1-120 characters after trimming.
- Only the owning learner can list, read, rename, or append messages to a thread.
- Learner-initiated thread deletion is not part of this release.

### 3. MentorMessage

**Table**: `mentor_messages`

A single learner or mentor turn within a thread.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | Stable message ID |
| `thread_id` | `UUID` | NOT NULL, FK -> mentor_threads.id ON DELETE CASCADE, INDEX | Parent thread |
| `user_id` | `VARCHAR(64)` | NOT NULL, FK -> users.id ON DELETE CASCADE, INDEX | Denormalized owner for isolation checks |
| `role` | `VARCHAR(16)` | NOT NULL | `learner` or `mentor` |
| `content` | `TEXT` | NOT NULL | Text-only message body |
| `status` | `VARCHAR(32)` | NULLABLE | Mentor messages: `completed`, `guardrail_blocked`, or `error` |
| `guardrail_code` | `VARCHAR(64)` | NULLABLE | Set when an Agents SDK guardrail blocks or flags a turn |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now(), INDEX | UTC ordering |

**Validation rules**:

- Learner message content must be text and non-blank.
- Learner message content maximum: 4,000 characters.
- Mentor message content must be non-blank when persisted.
- Messages are returned ordered by `created_at`, then `id`.
- Full message history remains available for display until learner account deletion.
- Response generation may use no more than the latest 20 messages from the current thread.

### 4. CourseContentChunk

**Table**: `course_content_chunks`

Derived retrieval artifacts generated from authoritative R2 course content. Rows are rebuilt by the content indexing job when the R2 manifest or source content changes.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `UUID` | PK | Stable chunk ID |
| `chapter_slug` | `VARCHAR(128)` | NOT NULL, INDEX | R2 manifest slug |
| `lesson_title` | `VARCHAR(255)` | NOT NULL | Lesson/chapter title |
| `section_heading` | `VARCHAR(255)` | NULLABLE | Heading nearest to the chunk |
| `chunk_index` | `INTEGER` | NOT NULL | Order within the source chapter |
| `content_hash` | `VARCHAR(64)` | NOT NULL, INDEX | Hash of chunk text and source metadata |
| `chunk_text` | `TEXT` | NOT NULL | Source text used for retrieval and citations |
| `embedding` | `VECTOR(<configured_dimension>)` | NOT NULL, INDEX | Neon pgvector embedding |
| `source_updated_at` | `TIMESTAMPTZ` | NULLABLE | R2 source timestamp when available |
| `indexed_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now() | UTC |

**Unique constraint**: `(chapter_slug, chunk_index, content_hash)`

**Validation rules**:

- Chunk text must be derived from R2 course content, never generated summaries.
- Chunk size and overlap are settings-managed and must be deterministic for repeat indexing.
- Embedding dimension must match the configured embedding model and pgvector column.
- Stale chunks for removed or changed source content are deleted or superseded during indexing.

### 5. MentorCitation

**Table**: `mentor_citations`

Source references attached to a mentor message.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | PK, AUTOINCREMENT | Surrogate key |
| `message_id` | `UUID` | NOT NULL, FK -> mentor_messages.id ON DELETE CASCADE, INDEX | Mentor message |
| `chunk_id` | `UUID` | NULLABLE, FK -> course_content_chunks.id ON DELETE SET NULL, INDEX | Retrieved vector chunk when available |
| `chapter_slug` | `VARCHAR(128)` | NOT NULL | R2 manifest slug |
| `lesson_title` | `VARCHAR(255)` | NOT NULL | Lesson/chapter title |
| `section_heading` | `VARCHAR(255)` | NULLABLE | Included when available |
| `excerpt` | `TEXT` | NULLABLE | Short evidence excerpt shown or used for audit |
| `relevance_score` | `FLOAT` | NULLABLE | Similarity score returned by vector retrieval |

**Validation rules**:

- Course-specific answers must include at least one citation when supporting evidence exists.
- Citations must include lesson/chapter title and section heading when available.
- `excerpt` must be concise and derived from course content, not generated as source material.

### 6. MentorUsageRecord

**Table**: `mentor_usage_records`

Daily UTC counter for accepted learner text messages.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `INTEGER` | PK, AUTOINCREMENT | Surrogate key |
| `user_id` | `VARCHAR(64)` | NOT NULL, FK -> users.id ON DELETE CASCADE, INDEX | Learner |
| `usage_date` | `DATE` | NOT NULL | UTC calendar date |
| `message_count` | `SMALLINT` | NOT NULL, DEFAULT 0 | Maximum 5 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, server_default=now(), onupdate=now() | UTC |

**Unique constraint**: `(user_id, usage_date)`

**Validation rules**:

- Count only valid Pro learner text messages submitted to the mentor.
- Count guardrail-blocked and limited-evidence turns after valid Pro text submission.
- Do not count non-text attempts.
- Do not count non-Pro attempts.
- Reject the sixth valid learner text message for a UTC date with `429` and `reset_at` set to the next `00:00 UTC`.

### 7. MentorAgentRun (value object)

Not persisted directly. Returned by the Agents SDK orchestration layer before persistence.

| Field | Type | Notes |
|---|---|---|
| `final_text` | `str` | Assistant text streamed through ChatKit and persisted as mentor message content |
| `status` | `Literal["completed", "guardrail_blocked", "error"]` | Guardrail-aware run status |
| `guardrail_code` | `str | None` | Deterministic code for blocked/flagged turns |
| `retrieved_chunks` | `list[CourseContentChunk]` | Chunks returned by the retrieval function tool |
| `citations` | `list[MentorCitationPublic]` | Citations derived from retrieved chunks |
| `trace_id` | `str | None` | Optional Agents SDK trace reference for diagnostics |

### 8. MentorResponseResult (value object)

Not persisted directly. Returned by `MentorService` after message processing.

| Field | Type | Notes |
|---|---|---|
| `thread` | `MentorThreadSummary` | Updated thread metadata |
| `learner_message` | `MentorMessagePublic` | Persisted learner turn |
| `mentor_message` | `MentorMessagePublic` | Persisted mentor turn |
| `usage` | `MentorUsageStatus` | Count, limit, remaining, reset time |

## Relationships

- `User` 1 -> many `MentorThread`
- `User` 1 -> many `MentorMessage`
- `User` 1 -> many `MentorUsageRecord`
- `MentorThread` 1 -> many `MentorMessage`
- `MentorMessage` 1 -> many `MentorCitation`
- `CourseContentChunk` 1 -> many `MentorCitation`

## State Transitions

### Thread lifecycle

```text
Thread does not exist
  -> create thread with default or submitted title
  -> append learner and mentor messages
  -> optionally rename thread
  -> retained until owning user account deletion
```

### Message processing

```text
Incoming request
  -> authenticate user
  -> require Pro access
  -> validate text input
  -> enforce UTC daily quota
  -> create thread if needed
  -> persist learner message
  -> run mentor agent with latest 20 messages
  -> retrieve course chunks from Neon pgvector through agent function tool
  -> apply Agents SDK input/output/tool guardrails
  -> persist mentor message and citations
  -> increment usage count
  -> return messages, citations, and usage status
```

### Course indexing

```text
R2 chapter content changes
  -> load source chapter and metadata
  -> split into deterministic overlapping chunks
  -> embed each chunk
  -> upsert chunk text, metadata, hash, and vector into Neon pgvector
  -> delete or supersede stale chunks
```

### Mentor agent run

```text
supported course question -> completed with retrieved citations
out-of-scope or unsafe input -> guardrail_blocked with guardrail_code
weak retrieval -> completed with explanation that course evidence is limited and closest citations when available
provider/tool failure after learner message accepted -> error with retry-safe learner-visible message
```

## Migration

Create a new Alembic migration after existing billing/progress migrations:

```python
op.create_table("mentor_threads", ...)
op.create_index("ix_mentor_threads_user_id", "mentor_threads", ["user_id"])
op.create_index("ix_mentor_threads_updated_at", "mentor_threads", ["updated_at"])

op.create_table("mentor_messages", ...)
op.create_index("ix_mentor_messages_thread_id", "mentor_messages", ["thread_id"])
op.create_index("ix_mentor_messages_user_id", "mentor_messages", ["user_id"])
op.create_index("ix_mentor_messages_created_at", "mentor_messages", ["created_at"])

op.execute("CREATE EXTENSION IF NOT EXISTS vector")
op.create_table("course_content_chunks", ...)
op.create_index("ix_course_content_chunks_chapter_slug", "course_content_chunks", ["chapter_slug"])
op.create_index("ix_course_content_chunks_content_hash", "course_content_chunks", ["content_hash"])
# Create pgvector ANN index using the configured vector operator class.

op.create_table("mentor_citations", ...)
op.create_index("ix_mentor_citations_message_id", "mentor_citations", ["message_id"])
op.create_index("ix_mentor_citations_chunk_id", "mentor_citations", ["chunk_id"])

op.create_table(
    "mentor_usage_records",
    ...,
    sa.UniqueConstraint("user_id", "usage_date", name="uq_mentor_usage_user_date"),
)
op.create_index("ix_mentor_usage_records_user_id", "mentor_usage_records", ["user_id"])
```

## API Models

### Request models

- `CreateMentorThreadRequest`: `title: str | None`
- `RenameMentorThreadRequest`: `title: str`
- `SendMentorMessageRequest`: `thread_id: UUID | None`, `content: str`

### Response models

- `MentorThreadSummary`: `id`, `title`, `created_at`, `updated_at`, `message_count`
- `MentorCitationPublic`: `chunk_id`, `chapter_slug`, `lesson_title`, `section_heading`, `excerpt`, `relevance_score`
- `MentorMessagePublic`: `id`, `thread_id`, `role`, `content`, `status`, `guardrail_code`, `citations`, `created_at`
- `MentorUsageStatus`: `limit`, `used`, `remaining`, `reset_at`
- `MentorThreadDetail`: `thread`, `messages`, `usage`
- `SendMentorMessageResponse`: `thread`, `learner_message`, `mentor_message`, `usage`
