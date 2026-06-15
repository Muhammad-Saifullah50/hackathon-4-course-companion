from pydantic import BaseModel


class ChapterSummary(BaseModel):
    slug: str
    title: str
    order: int
    accessible: bool = True
    required_tier: str | None = None


class ChapterListPanel(BaseModel):
    chapters: list[ChapterSummary]


class ChapterPanel(BaseModel):
    slug: str
    title: str
    order: int
    content: str
    next_slug: str | None
    prev_slug: str | None
