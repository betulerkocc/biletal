"""Bilet uç noktaları — RabbitMQ olay yayını burada gösterilir."""
from typing import Optional

from fastapi import APIRouter, HTTPException

from ..cache import delete_pattern
from ..database import col
from ..models import BiletCreate
from ..mq import publish_ticket_event
from ..utils import gen_pnr, now_iso, oid, serialize

router = APIRouter(prefix="/api/biletler", tags=["Biletler (Tickets)"])


@router.post("", status_code=201, summary="[7] Bilet satın al — RABBITMQ olayı yayınlar")
async def book_ticket(req: BiletCreate):
    """Bilet satışı yapar, koltuğu doldurur, cache'i temizler ve RabbitMQ
    kuyruğuna bir olay yayınlar. Olayı 'worker' servisi tüketip yolcuya
    bildirim (SMS/E-posta simülasyonu) gönderir."""
    sefer = await col("seferler").find_one({"_id": oid(req.sefer_id)})
    if not sefer:
        raise HTTPException(404, "Sefer bulunamadı")

    dolu = sefer.get("dolu_koltuklar", [])
    if req.koltuk_no in dolu:
        raise HTTPException(409, f"{req.koltuk_no} numaralı koltuk dolu, başka koltuk seçin")
    if req.koltuk_no < 1 or req.koltuk_no > sefer["toplam_koltuk"]:
        raise HTTPException(400, f"Geçersiz koltuk numarası (1-{sefer['toplam_koltuk']})")

    # Yolcu çözümle
    if req.yolcu_id:
        yolcu = await col("yolcular").find_one({"_id": oid(req.yolcu_id)})
        if not yolcu:
            raise HTTPException(404, "Yolcu bulunamadı")
        yolcu_ad = f"{yolcu['ad']} {yolcu['soyad']}"
        yolcu_id = req.yolcu_id
        yolcu_email = yolcu.get("email", "")
        yolcu_tel = yolcu.get("telefon", "")
    elif req.ad and req.soyad:
        yolcu_ad = f"{req.ad} {req.soyad}"
        yolcu_id = None
        yolcu_email = ""
        yolcu_tel = ""
    else:
        raise HTTPException(400, "Yolcu bilgisi gerekli: yolcu_id ya da ad+soyad")

    bilet = {
        "pnr": gen_pnr(),
        "sefer_id": req.sefer_id,
        "yolcu_id": yolcu_id,
        "yolcu_ad": yolcu_ad,
        "yolcu_email": yolcu_email,
        "yolcu_telefon": yolcu_tel,
        "koltuk_no": req.koltuk_no,
        "kalkis": sefer["kalkis"],
        "varis": sefer["varis"],
        "tarih": sefer["tarih"],
        "saat": sefer["saat"],
        "firma": sefer.get("firma", ""),
        "fiyat": sefer["fiyat"],
        "durum": "ONAYLANDI",
        "bildirim_gonderildi": False,
        "created_at": now_iso(),
    }
    res = await col("biletler").insert_one(bilet)

    # Koltuğu doldur + sefer cache'ini temizle (koltuk durumu değişti)
    await col("seferler").update_one(
        {"_id": oid(req.sefer_id)}, {"$addToSet": {"dolu_koltuklar": req.koltuk_no}}
    )
    await delete_pattern("seferler:*")

    # RabbitMQ olayı yayınla
    event = serialize({**bilet, "_id": res.inserted_id})
    published = await publish_ticket_event(event)

    out = serialize({**bilet, "_id": res.inserted_id})
    out["rabbitmq_published"] = published
    out["mesaj"] = "Bilet oluşturuldu, bildirim kuyruğa alındı (RabbitMQ)"
    return out


@router.get("", summary="[8] Biletleri listele")
async def list_biletler(yolcu_id: Optional[str] = None):
    query = {}
    if yolcu_id:
        query["yolcu_id"] = yolcu_id
    docs = [serialize(d) async for d in col("biletler").find(query).sort("created_at", -1)]
    return {"adet": len(docs), "biletler": docs}


@router.delete("/{bilet_id}", summary="[9] Bilet iptal et (koltuk boşalır)")
async def cancel_ticket(bilet_id: str):
    bilet = await col("biletler").find_one({"_id": oid(bilet_id)})
    if not bilet:
        raise HTTPException(404, "Bilet bulunamadı")
    if bilet["durum"] == "IPTAL":
        raise HTTPException(409, "Bilet zaten iptal edilmiş")

    await col("biletler").update_one({"_id": oid(bilet_id)}, {"$set": {"durum": "IPTAL"}})
    await col("seferler").update_one(
        {"_id": oid(bilet["sefer_id"])}, {"$pull": {"dolu_koltuklar": bilet["koltuk_no"]}}
    )
    await delete_pattern("seferler:*")
    return {"mesaj": "Bilet iptal edildi", "pnr": bilet["pnr"], "iade_tutari": bilet["fiyat"]}
