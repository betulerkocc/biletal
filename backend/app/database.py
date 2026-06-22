"""MongoDB (Motor) bağlantı katmanı.

Veritabanı, FastAPI lifespan başlangıcında bağlanır ve servis hazır
olana kadar yeniden dener (Docker'da konteyner sırası garantisi için).
"""
import asyncio

import motor.motor_asyncio

from .config import settings


class _Mongo:
    client: motor.motor_asyncio.AsyncIOMotorClient | None = None
    db = None


mongo = _Mongo()


async def connect(retries: int = 15, delay: float = 2.0) -> None:
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            mongo.client = motor.motor_asyncio.AsyncIOMotorClient(
                settings.mongo_url, serverSelectionTimeoutMS=3000
            )
            mongo.db = mongo.client[settings.mongo_db]
            await mongo.client.admin.command("ping")
            print(f"✅ MongoDB bağlandı -> {settings.mongo_url}/{settings.mongo_db}")
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"[{attempt}/{retries}] MongoDB bekleniyor... ({exc})")
            await asyncio.sleep(delay)
    raise RuntimeError(f"MongoDB bağlantısı kurulamadı: {last_err}")


async def close() -> None:
    if mongo.client:
        mongo.client.close()


def col(name: str):
    """Koleksiyon erişimi: col('seferler') gibi kullanılır."""
    return mongo.db[name]
