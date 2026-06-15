from pydantic import BaseModel


class SearchResult(BaseModel):
    chapter_slug: str
    chapter_title: str
    excerpt: str
    accessible: bool = True
    required_tier: str | None = None


class SearchResultsPanel(BaseModel):
    query: str
    total_matches: int
    results: list[SearchResult]
