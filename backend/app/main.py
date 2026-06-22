"""Obilet — Otobüs Bileti Otomasyon Sistemi · FastAPI Backend.

Mikroservis mimarisi:
  Frontend (React Native/Expo)  ->  Backend (FastAPI)  ->  MongoDB
                                          ├──> Redis (cache)
                                          └──> RabbitMQ (olay kuyruğu) -> Worker

Toplam 10 iş (business) REST uç noktası + /health + / .
Otomatik Swagger dokümantasyonu: /docs
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import cache, database, mq
from .config import settings
from .routers import biletler, istatistik, seferler, sehirler, yolcular
from .seed import seed_data

DESCRIPTION = """
**Obilet** tarzı, mikroservis tabanlı otobüs bileti otomasyon sistemi.

* 🗄️ **MongoDB** — kalıcı veri (şehir, sefer, yolcu, bilet, bildirim)
* ⚡ **Redis** — sefer arama sonuçlarının cache'lenmesi (`/api/seferler`)
* 🐇 **RabbitMQ** — bilet alımında async bildirim olayı (`/api/biletler`)
* 🐳 **Docker Compose** + **Jenkins CI/CD**

Toplam **10 REST uç noktası** aşağıda gruplanmıştır.
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Backend başlatılıyor...")
    await database.connect()
    await cache.connect()
    try:
        await mq.connect()
    except Exception as exc:  # noqa: BLE001
        print(f"[UYARI] RabbitMQ bağlantısı kurulamadı (API yine de çalışır): {exc}")
    await seed_data()
    print("✅ Backend hazır — Swagger: /docs")
    yield
    print("👋 Backend kapanıyor...")
    await database.close()
    await cache.close()
    await mq.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=DESCRIPTION,
    lifespan=lifespan,
)

# Mobil/Web istemcilerin erişebilmesi için CORS açık
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Cache", "X-Response-Time-ms"],
)

# 10 iş uç noktası
app.include_router(sehirler.router)     # [1]
app.include_router(seferler.router)     # [2][3][4]
app.include_router(yolcular.router)     # [5][6]
app.include_router(biletler.router)     # [7][8][9]
app.include_router(istatistik.router)   # [10]


@app.get("/", tags=["Sistem"], summary="Kök / sağlık özeti")
async def root():
    return {
        "uygulama": settings.app_name,
        "versiyon": settings.app_version,
        "dokumantasyon": "/docs",
        "saglik": "/health",
    }


@app.get("/health", tags=["Sistem"], summary="Servis sağlık kontrolü (Mongo/Redis/RabbitMQ)")
async def health():
    """CI/CD pipeline'ının 'Health Check' adımı bu uç noktayı çağırır."""
    mongo_ok = False
    try:
        await database.mongo.client.admin.command("ping")
        mongo_ok = True
    except Exception:  # noqa: BLE001
        mongo_ok = False

    redis_ok = await cache.ping()
    rabbit_ok = await mq.is_connected()

    durum = "saglikli" if (mongo_ok and redis_ok and rabbit_ok) else "kismi"
    return {
        "durum": durum,
        "servisler": {
            "mongodb": "up" if mongo_ok else "down",
            "redis": "up" if redis_ok else "down",
            "rabbitmq": "up" if rabbit_ok else "down",
        },
    }
