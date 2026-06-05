from fastapi import HTTPException

from src.models.search import SearchResponse, SearchResult
from src.services.content import ContentService, ServiceUnavailableError


class SearchService:
    async def search(
        self,
        query: str,
        limit: int,
        content_service: ContentService,
    ) -> SearchResponse:
        if not query.strip():
            raise HTTPException(status_code=400, detail="Query must not be blank")

        if content_service._manifest_cache is None:
            raise ServiceUnavailableError("Chapter cache not warmed — search unavailable")

        manifest = content_service._manifest_cache
        chapter_cache = content_service._chapter_cache
        q_lower = query.lower()

        results: list[SearchResult] = []
        for entry in manifest.chapters:
            title_lower = entry.title.lower()
            rank = 0
            excerpt = ""

            if q_lower in title_lower:
                rank = 2
                idx = title_lower.find(q_lower)
                excerpt = entry.title[max(0, idx - 50): idx + 200]
            elif entry.slug in chapter_cache:
                body = chapter_cache[entry.slug][0]
                body_lower = body.lower()
                if q_lower in body_lower:
                    rank = 1
                    idx = body_lower.find(q_lower)
                    excerpt = body[max(0, idx - 50): idx + 200]

            if rank > 0:
                results.append(
                    SearchResult(
                        slug=entry.slug,
                        title=entry.title,
                        excerpt=excerpt.strip(),
                        rank=rank,
                    )
                )

        results.sort(key=lambda r: r.rank, reverse=True)
        results = results[:limit]
        return SearchResponse(results=results, total=len(results))
