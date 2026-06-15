from pydantic import BaseModel


class SearchResult(BaseModel):
    slug: str
    title: str
    excerpt: str
    rank: int
    accessible: bool = True
    required_tier: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
