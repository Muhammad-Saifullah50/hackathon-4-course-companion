from datetime import date, datetime

from pydantic import BaseModel, Field


class CompletionRequest(BaseModel):
    quiz_score: int | None = Field(None, ge=0, le=100)


class CompletionResponse(BaseModel):
    user_id: str
    chapter_slug: str
    completed_at: datetime
    quiz_score: int | None
    current_streak: int


class ProgressEntry(BaseModel):
    chapter_slug: str
    completed_at: datetime
    quiz_score: int | None


class ProgressResponse(BaseModel):
    user_id: str
    completions: list[ProgressEntry]
    current_streak: int
    last_active_date: date | None
