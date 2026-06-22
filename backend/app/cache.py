"""Redis cache katmanı.

Sefer arama sonuçları burada cache'lenir. İlk istek MongoDB'den gelir
(MISS), sonraki istekler Redis'ten gelir (HIT) — videoda HIT/MISS ve
yanıt süresi farkı net görünür. Sefer/bilet değişiminde cache temizlenir.
"""
import asyncio
import json

import redis.asyncio as aioredis

from .config import settings


class _Cache:
    client: aioredis.Redis | None = None


cache = _Cache()


async def connect(retries: int = 15, delay: float = 2.0) -> None:
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            cache.client = aioredis.from_url(settings.redis_url, decode_responses=True)
            await cache.client.ping()
            print(f"✅ Redis bağlandı -> {settings.redis_url}")
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"[{attempt}/{retries}] Redis bekleniyor... ({exc})")
            await asyncio.sleep(delay)
    raise RuntimeError(f"Redis bağlantısı kurulamadı: {last_err}")


async def close() -> None:
    if cache.client:
        await cache.client.aclose()


async def get_json(key: str):
    if not cache.client:
        return None
    raw = await cache.client.get(key)
    return json.loads(raw) if raw else None


async def set_json(key: str, value, ttl: int | None = None) -> None:
    if not cache.client:
        return
    await cache.client.set(key, json.dumps(value, default=str), ex=ttl or settings.cache_ttl)


async def delete_pattern(pattern: str) -> int:
    """Belirli bir desene uyan tüm cache anahtarlarını siler (invalidation)."""
    if not cache.client:
        return 0
    keys = [k async for k in cache.client.scan_iter(match=pattern)]
    if keys:
        return await cache.client.delete(*keys)
    return 0


async def ping() -> bool:
    try:
        return bool(cache.client and await cache.client.ping())
    except Exception:  # noqa: BLE001
        return False
