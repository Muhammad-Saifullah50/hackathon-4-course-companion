from pydantic import BaseModel


class SearchResult(BaseModel):
    slug: str
    title: str
    excerpt: str
    rank: int


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
