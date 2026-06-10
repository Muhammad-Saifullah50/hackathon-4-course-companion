from pydantic import BaseModel


class ChapterProgressItem(BaseModel):
    slug: str
    title: str
    completed: bool
    quiz_score: int | None = None


class ProgressPanel(BaseModel):
    user_id: str
    current_streak: int
    completion_percentage: float
    total_chapters: int
    completed_chapters: int
    chapter_list: list[ChapterProgressItem]
