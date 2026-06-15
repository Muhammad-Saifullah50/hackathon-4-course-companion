from datetime import datetime

from pydantic import BaseModel


class ManifestEntry(BaseModel):
    slug: str
    title: str
    order: int


class Manifest(BaseModel):
    chapters: list[ManifestEntry]


class ChapterSummary(BaseModel):
    slug: str
    title: str
    order: int
    accessible: bool = True
    required_tier: str | None = None


class ChapterDetail(BaseModel):
    slug: str
    title: str
    order: int
    content: str
    next_slug: str | None = None
    prev_slug: str | None = None


class MediaUrlResponse(BaseModel):
    url: str
    expires_at: datetime
