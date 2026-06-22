"""RabbitMQ Tüketici (Consumer) — Bildirim Worker'ı.

Backend, bilet satışında 'ticket_events' kuyruğuna bir olay yayınlar.
Bu worker o olayları tüketir ve yolcuya bildirim (SMS + E-posta simülasyonu)
"gönderir", ardından bildirimi MongoDB'ye yazar ve bileti günceller.

Videoda `docker compose logs -f worker` ile her bilet alımında bu logların
canlı aktığı gösterilerek RabbitMQ'nun çalıştığı kanıtlanır.
"""
import asyncio
import json
import os
from datetime import datetime, timezone

import aio_pika
import motor.motor_asyncio
from bson import ObjectId

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://mongo:27017")
MONGO_DB = os.environ.get("MONGO_DB", "obilet")
RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
QUEUE = os.environ.get("TICKET_QUEUE", "ticket_events")

db = None


async def connect_mongo(retries: int = 30, delay: float = 2.0):
    global db
    for attempt in range(1, retries + 1):
        try:
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=3000)
            await client.admin.command("ping")
            db = client[MONGO_DB]
            print(f"✅ [worker] MongoDB bağlandı -> {MONGO_URL}", flush=True)
            return
        except Exception as exc:  # noqa: BLE001
            print(f"[{attempt}/{retries}] [worker] MongoDB bekleniyor... ({exc})", flush=True)
            await asyncio.sleep(delay)
    raise RuntimeError("worker: MongoDB bağlantısı kurulamadı")


async def connect_rabbit(retries: int = 30, delay: float = 2.0):
    for attempt in range(1, retries + 1):
        try:
            connection = await aio_pika.connect_robust(RABBITMQ_URL)
            print(f"✅ [worker] RabbitMQ bağlandı -> {RABBITMQ_URL}", flush=True)
            return connection
        except Exception as exc:  # noqa: BLE001
            print(f"[{attempt}/{retries}] [worker] RabbitMQ bekleniyor... ({exc})", flush=True)
            await asyncio.sleep(delay)
    raise RuntimeError("worker: RabbitMQ bağlantısı kurulamadı")


async def handle(message: aio_pika.abc.AbstractIncomingMessage):
    async with message.process():
        data = json.loads(message.body.decode())
        pnr = data.get("pnr", "?????")
        yolcu = data.get("yolcu_ad", "Yolcu")
        rota = f"{data.get('kalkis')} → {data.get('varis')}"
        koltuk = data.get("koltuk_no")

        print("─" * 60, flush=True)
        print(f"📥 [worker] Yeni bilet olayı alındı | PNR={pnr} | {yolcu}", flush=True)
        await asyncio.sleep(1)  # bildirim gönderimini simüle et

        email = data.get("yolcu_email") or "yolcu@obilet.com"
        tel = data.get("yolcu_telefon") or "05xx xxx xx xx"
        mesaj = (f"Sayın {yolcu}, {rota} seferi için {koltuk} no'lu koltuk biletiniz "
                 f"onaylandı. PNR: {pnr}")

        print(f"📧 [worker] E-posta gönderildi -> {email}", flush=True)
        print(f"📱 [worker] SMS gönderildi    -> {tel}", flush=True)
        print(f"   ✉️  {mesaj}", flush=True)

        # Bildirimi kaydet
        await db["bildirimler"].insert_one({
            "pnr": pnr,
            "yolcu_ad": yolcu,
            "kanal": ["EMAIL", "SMS"],
            "mesaj": mesaj,
            "alici_email": email,
            "alici_telefon": tel,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        # Bileti güncelle (bildirim gönderildi)
        bilet_id = data.get("id")
        if bilet_id:
            try:
                await db["biletler"].update_one(
                    {"_id": ObjectId(bilet_id)}, {"$set": {"bildirim_gonderildi": True}}
                )
            except Exception:  # noqa: BLE001
                pass
        print(f"✅ [worker] Bildirim tamamlandı ve kaydedildi | PNR={pnr}", flush=True)


async def main():
    print("🐇 [worker] Bildirim worker'ı başlıyor...", flush=True)
    await connect_mongo()
    connection = await connect_rabbit()
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=1)
    queue = await channel.declare_queue(QUEUE, durable=True)
    print(f"👂 [worker] '{QUEUE}' kuyruğu dinleniyor...", flush=True)
    await queue.consume(handle)
    await asyncio.Future()  # sonsuza kadar bekle


if __name__ == "__main__":
    asyncio.run(main())
