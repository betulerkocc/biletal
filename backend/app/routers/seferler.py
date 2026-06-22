"""Sefer uç noktaları — Redis cache burada gösterilir."""
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Response

from ..cache import delete_pattern, get_json, set_json
from ..database import col
from ..models import SeferCreate
from ..utils import oid, serialize

router = APIRouter(prefix="/api/seferler", tags=["Seferler (Trips)"])


def _bos_koltuk(doc: dict) -> dict:
    doc["bos_koltuk"] = doc.get("toplam_koltuk", 0) - len(doc.get("dolu_koltuklar", []))
    return doc


@router.get("", summary="[2] Sefer ara/listele — REDIS CACHE'li")
async def list_seferler(
    response: Response,
    kalkis: Optional[str] = None,
    varis: Optional[str] = None,
    tarih: Optional[str] = None,
):
    """Seferleri arar. İlk istek MongoDB'den (MISS), tekrarlar Redis'ten (HIT).

    Yanıttaki `cache` ve `sure_ms` alanları ile `X-Cache` başlığı, Redis'in
    devrede olduğunu net şekilde gösterir.
    """
    cache_key = f"seferler:{kalkis or '*'}:{varis or '*'}:{tarih or '*'}"
    t0 = time.perf_counter()

    cached = await get_json(cache_key)
    if cached is not None:
        ms = round((time.perf_counter() - t0) * 1000, 2)
        response.headers["X-Cache"] = "HIT"
        response.headers["X-Response-Time-ms"] = str(ms)
        return {"kaynak": "redis-cache", "cache": "HIT", "sure_ms": ms,
                "adet": len(cached), "seferler": cached}

    query = {}
    if kalkis:
        query["kalkis"] = kalkis
    if varis:
        query["varis"] = varis
    if tarih:
        query["tarih"] = tarih

    docs = [_bos_koltuk(serialize(d)) async for d in col("seferler").find(query).sort("saat", 1)]
    await set_json(cache_key, docs)

    ms = round((time.perf_counter() - t0) * 1000, 2)
    response.headers["X-Cache"] = "MISS"
    response.headers["X-Response-Time-ms"] = str(ms)
    return {"kaynak": "mongodb", "cache": "MISS", "sure_ms": ms,
            "adet": len(docs), "seferler": docs}


@router.post("", status_code=201, summary="[3] Yeni sefer ekle (cache temizlenir)")
async def create_sefer(sefer: SeferCreate):
    doc = sefer.model_dump()
    doc["dolu_koltuklar"] = []
    res = await col("seferler").insert_one(doc)
    silinen = await delete_pattern("seferler:*")  # cache invalidation
    created = await col("seferler").find_one({"_id": res.inserted_id})
    print(f"🗑️  Cache temizlendi ({silinen} anahtar) — yeni sefer eklendi")
    return _bos_koltuk(serialize(created))


@router.get("/{sefer_id}", summary="[4] Sefer detayı + koltuk haritası")
async def get_sefer(sefer_id: str):
    doc = await col("seferler").find_one({"_id": oid(sefer_id)})
    if not doc:
        raise HTTPException(404, "Sefer bulunamadı")
    return _bos_koltuk(serialize(doc))
