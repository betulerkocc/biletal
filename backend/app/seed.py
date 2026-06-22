"""Başlangıç (seed) verisi — şehirler ve örnek seferler.

Veritabanı boşsa otomatik doldurulur. Veriler deterministiktir
(rastgele yok) ki demo her seferinde aynı görünsün.
"""
from .database import col

SEHIRLER = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana",
    "Konya", "Trabzon", "Gaziantep", "Eskişehir", "Samsun", "Kayseri",
]

# (kalkis, varis, saat, fiyat, sure, firma, otobus_tipi)
ROTALAR = [
    {"kalkis": "İstanbul", "varis": "Ankara",   "saat": "08:00", "fiyat": 450.0, "sure": "5s 30dk", "firma": "Obilet Turizm", "otobus_tipi": "2+1", "toplam_koltuk": 40},
    {"kalkis": "İstanbul", "varis": "Ankara",   "saat": "14:30", "fiyat": 420.0, "sure": "5s 45dk", "firma": "Metro Turizm",  "otobus_tipi": "2+1", "toplam_koltuk": 40},
    {"kalkis": "İstanbul", "varis": "İzmir",    "saat": "09:15", "fiyat": 520.0, "sure": "6s 15dk", "firma": "Pamukkale",     "otobus_tipi": "2+1", "toplam_koltuk": 40},
    {"kalkis": "Ankara",   "varis": "İstanbul", "saat": "10:00", "fiyat": 440.0, "sure": "5s 30dk", "firma": "Kamil Koç",     "otobus_tipi": "2+2", "toplam_koltuk": 46},
    {"kalkis": "Ankara",   "varis": "İzmir",    "saat": "07:30", "fiyat": 480.0, "sure": "7s 00dk", "firma": "Obilet Turizm", "otobus_tipi": "2+1", "toplam_koltuk": 40},
    {"kalkis": "İzmir",    "varis": "Antalya",  "saat": "11:45", "fiyat": 380.0, "sure": "6s 30dk", "firma": "Nilüfer",       "otobus_tipi": "2+1", "toplam_koltuk": 38},
    {"kalkis": "Bursa",    "varis": "Ankara",   "saat": "13:00", "fiyat": 350.0, "sure": "4s 45dk", "firma": "Metro Turizm",  "otobus_tipi": "2+2", "toplam_koltuk": 46},
    {"kalkis": "Antalya",  "varis": "İstanbul", "saat": "20:30", "fiyat": 600.0, "sure": "11s 00dk","firma": "Kamil Koç",     "otobus_tipi": "2+1", "toplam_koltuk": 40},
]

TARIHLER = ["2026-06-23", "2026-06-24", "2026-06-25"]


async def seed_data() -> None:
    if await col("sehirler").count_documents({}) == 0:
        await col("sehirler").insert_many([{"ad": s} for s in SEHIRLER])
        print(f"🌱 {len(SEHIRLER)} şehir eklendi")

    if await col("seferler").count_documents({}) == 0:
        docs = []
        for tarih in TARIHLER:
            for r in ROTALAR:
                doc = dict(r)
                doc["tarih"] = tarih
                doc["dolu_koltuklar"] = []
                docs.append(doc)
        await col("seferler").insert_many(docs)
        print(f"🌱 {len(docs)} sefer eklendi ({len(ROTALAR)} rota × {len(TARIHLER)} tarih)")
