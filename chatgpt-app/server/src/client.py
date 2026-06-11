import httpx

from .core.config import settings


class BackendClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(base_url=settings.backend_url, timeout=30.0)

    async def get(
        self, path: str, headers: dict[str, str] | None = None
    ) -> dict:
        response = await self._client.get(path, headers=headers or {})
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def post(
        self,
        path: str,
        body: dict,
        headers: dict[str, str] | None = None,
    ) -> dict:
        response = await self._client.post(path, json=body, headers=headers or {})
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def put(
        self,
        path: str,
        body: dict,
        headers: dict[str, str] | None = None,
    ) -> dict:
        response = await self._client.put(path, json=body, headers=headers or {})
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def aclose(self) -> None:
        await self._client.aclose()


backend = BackendClient()
