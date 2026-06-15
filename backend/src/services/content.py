import asyncio
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Any

import boto3
from botocore.exceptions import ClientError

from src.core.config import settings
from src.models.content import ChapterDetail, ChapterSummary, Manifest, ManifestEntry, MediaUrlResponse

logger = logging.getLogger(__name__)

_MANIFEST_KEY = "manifest.json"


class ServiceUnavailableError(Exception):
    pass


class ChapterNotFoundError(Exception):
    pass


class MediaNotFoundError(Exception):
    pass


class ContentService:
    def __init__(self) -> None:
        self._s3: Any = None  # lazily created on first use
        self._manifest_cache: Manifest | None = None
        self._manifest_loaded_at: float = 0.0
        self._chapter_cache: dict[str, tuple[str, float]] = {}

    @property
    def _r2(self) -> Any:
        if self._s3 is None:
            self._s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.r2_access_key_id,
                aws_secret_access_key=settings.r2_secret_access_key,
                region_name="auto",
            )
        return self._s3

    # ------------------------------------------------------------------ cache

    def _manifest_is_fresh(self) -> bool:
        return (
            self._manifest_cache is not None
            and (time.monotonic() - self._manifest_loaded_at) < settings.cache_ttl_seconds
        )

    def _chapter_is_fresh(self, slug: str) -> bool:
        entry = self._chapter_cache.get(slug)
        if entry is None:
            return False
        _, loaded_at = entry
        return (time.monotonic() - loaded_at) < settings.cache_ttl_seconds

    # --------------------------------------------------------------- R2 helpers

    def _fetch_manifest_from_local(self) -> Manifest:
        path = settings.resolved_local_content_path / _MANIFEST_KEY
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            return Manifest.model_validate(raw)
        except Exception as exc:
            logger.error("Failed to load local manifest %s: %s", path, exc)
            raise ServiceUnavailableError("Manifest unavailable") from exc

    def _fetch_manifest_from_r2(self) -> Manifest:
        try:
            obj = self._r2.get_object(Bucket=settings.r2_bucket_name, Key=_MANIFEST_KEY)
            raw = json.loads(obj["Body"].read())
            return Manifest.model_validate(raw)
        except (ClientError, json.JSONDecodeError, Exception) as exc:
            logger.error("Failed to load manifest from R2: %s", exc)
            raise ServiceUnavailableError("Manifest unavailable") from exc

    def _fetch_chapter_from_local(self, slug: str) -> str:
        path = settings.resolved_local_content_path / "chapters" / f"{slug}.md"
        try:
            return path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise ChapterNotFoundError(
                f"Chapter file not found locally: {path}"
            ) from exc
        except OSError as exc:
            logger.error("Failed to load local chapter %s: %s", slug, exc)
            raise ServiceUnavailableError(f"Could not fetch chapter: {slug}") from exc

    def _fetch_chapter_from_r2(self, slug: str) -> str:
        key = f"chapters/{slug}.md"
        try:
            obj = self._r2.get_object(Bucket=settings.r2_bucket_name, Key=key)
            return obj["Body"].read().decode("utf-8")
        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            if error_code in ("NoSuchKey", "404"):
                raise ChapterNotFoundError(f"Chapter file not found in R2: {key}") from exc
            logger.error("R2 error fetching chapter %s: %s", slug, exc)
            raise ServiceUnavailableError(f"Could not fetch chapter: {slug}") from exc

    # ----------------------------------------------------------- public interface

    async def load_manifest(self) -> Manifest:
        if self._manifest_is_fresh():
            return self._manifest_cache  # type: ignore[return-value]

        manifest = (
            self._fetch_manifest_from_local()
            if settings.use_local_content
            else await asyncio.to_thread(self._fetch_manifest_from_r2)
        )

        seen: dict[str, ManifestEntry] = {}
        for entry in manifest.chapters:
            if entry.slug in seen:
                logger.warning("Duplicate slug '%s' in manifest — first occurrence wins", entry.slug)
            else:
                seen[entry.slug] = entry

        manifest = Manifest(chapters=list(seen.values()))
        self._manifest_cache = manifest
        self._manifest_loaded_at = time.monotonic()
        return manifest

    async def get_chapter_body(self, slug: str) -> str:
        if self._chapter_is_fresh(slug):
            return self._chapter_cache[slug][0]

        manifest = await self.load_manifest()
        slugs = {e.slug for e in manifest.chapters}
        if slug not in slugs:
            raise ChapterNotFoundError(f"Unknown chapter slug: {slug}")

        body = (
            self._fetch_chapter_from_local(slug)
            if settings.use_local_content
            else await asyncio.to_thread(self._fetch_chapter_from_r2, slug)
        )
        self._chapter_cache[slug] = (body, time.monotonic())
        return body

    async def get_chapter_summaries(self) -> list[ChapterSummary]:
        manifest = await self.load_manifest()
        return [
            ChapterSummary(slug=e.slug, title=e.title, order=e.order)
            for e in manifest.chapters
        ]

    async def get_chapter_detail(self, slug: str) -> ChapterDetail:
        manifest = await self.load_manifest()
        chapters = manifest.chapters
        entry = next((e for e in chapters if e.slug == slug), None)
        if entry is None:
            raise ChapterNotFoundError(f"Unknown chapter slug: {slug}")

        idx = chapters.index(entry)
        prev_slug = chapters[idx - 1].slug if idx > 0 else None
        next_slug = chapters[idx + 1].slug if idx < len(chapters) - 1 else None

        content = await self.get_chapter_body(slug)
        return ChapterDetail(
            slug=entry.slug,
            title=entry.title,
            order=entry.order,
            content=content,
            next_slug=next_slug,
            prev_slug=prev_slug,
        )

    async def generate_signed_url(self, slug: str, filename: str) -> MediaUrlResponse:
        manifest = await self.load_manifest()
        slugs = {e.slug for e in manifest.chapters}
        if slug not in slugs:
            raise ChapterNotFoundError(f"Unknown chapter slug: {slug}")

        key = f"chapters/{slug}/media/{filename}"

        def _presign() -> str:
            try:
                return self._r2.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": settings.r2_bucket_name, "Key": key},
                    ExpiresIn=settings.signed_url_expiry_seconds,
                )
            except ClientError as exc:
                error_code = exc.response["Error"]["Code"]
                if error_code in ("NoSuchKey", "404"):
                    raise MediaNotFoundError(f"Media file not found: {key}") from exc
                raise ServiceUnavailableError("Could not generate signed URL") from exc

        url = await asyncio.to_thread(_presign)
        expires_at = datetime.now(tz=timezone.utc) + timedelta(seconds=settings.signed_url_expiry_seconds)
        return MediaUrlResponse(url=url, expires_at=expires_at)

    async def warm_cache(self) -> None:
        try:
            await self.load_manifest()
            logger.info("Manifest cache warmed on startup")
        except ServiceUnavailableError:
            logger.warning("Could not warm manifest cache on startup — R2 may be unavailable")
