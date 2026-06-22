"""İstatistik / dashboard uç noktası."""
from fastapi import APIRouter

from ..database import col

router = APIRouter(prefix="/api/istatistik", tags=["İstatistik (Dashboard)"])


@router.get("", summary="[10] Dashboard istatistikleri")
async def istatistik():
    """Genel sistem özetini döner. `gonderilen_bildirim` alanı, RabbitMQ
    worker'ının ürettiği bildirim sayısıdır — yani kuyruğun çalıştığının
    uygulama içinden de görülebilir kanıtıdır."""
    toplam_sefer = await col("seferler").count_documents({})
    toplam_yolcu = await col("yolcular").count_documents({})
    aktif_bilet = await col("biletler").count_documents({"durum": "ONAYLANDI"})
    iptal_bilet = await col("biletler").count_documents({"durum": "IPTAL"})
    bildirim = await col("bildirimler").count_documents({})

    agg = [d async for d in col("biletler").aggregate([
        {"$match": {"durum": "ONAYLANDI"}},
        {"$group": {"_id": None, "toplam": {"$sum": "$fiyat"}}},
    ])]
    gelir = agg[0]["toplam"] if agg else 0

    pop = [d async for d in col("biletler").aggregate([
        {"$match": {"durum": "ONAYLANDI"}},
        {"$group": {"_id": {"k": "$kalkis", "v": "$varis"}, "adet": {"$sum": 1}}},
        {"$sort": {"adet": -1}},
        {"$limit": 5},
    ])]
    populer = [{"rota": f"{p['_id']['k']} → {p['_id']['v']}", "adet": p["adet"]} for p in pop]

    return {
        "toplam_sefer": toplam_sefer,
        "toplam_yolcu": toplam_yolcu,
        "aktif_bilet": aktif_bilet,
        "iptal_bilet": iptal_bilet,
        "gonderilen_bildirim": bildirim,
        "toplam_gelir": round(gelir, 2),
        "populer_rotalar": populer,
    }
