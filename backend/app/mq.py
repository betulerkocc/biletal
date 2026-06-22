"""RabbitMQ (aio-pika) mesaj kuyruğu katmanı — PUBLISHER tarafı.

Üç iş olayında ('tip') bu kuyruğa olay (event) yazılır:
  - bilet_alma   → POST   /api/biletler       (satın alma bildirimi)
  - bilet_iptal  → DELETE /api/biletler/{id}   (iptal bildirimi)
  - yolcu_kaydi  → POST   /api/yolcular        (hoş geldin bildirimi)
Ayrı bir 'worker' servisi olayları tüketip yolcuya bildirim (SMS/E-posta
simülasyonu) gönderir. Böylece senkron olmayan (async) mikroservis
haberleşmesi gösterilmiş olur.
"""
import asyncio
import json

import aio_pika

from .config import settings


class _MQ:
    connection: aio_pika.RobustConnection | None = None
    channel: aio_pika.abc.AbstractChannel | None = None


mq = _MQ()


async def connect(retries: int = 15, delay: float = 2.0) -> None:
    last_err = None
    for attempt in range(1, retries + 1):
        try:
            mq.connection = await aio_pika.connect_robust(settings.rabbitmq_url)
            mq.channel = await mq.connection.channel()
            await mq.channel.declare_queue(settings.ticket_queue, durable=True)
            print(f"✅ RabbitMQ bağlandı -> {settings.rabbitmq_url} (kuyruk: {settings.ticket_queue})")
            return
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"[{attempt}/{retries}] RabbitMQ bekleniyor... ({exc})")
            await asyncio.sleep(delay)
    raise RuntimeError(f"RabbitMQ bağlantısı kurulamadı: {last_err}")


async def close() -> None:
    if mq.connection:
        await mq.connection.close()


async def publish_event(payload: dict) -> bool:
    """Bir olayı (event) kuyruğa yayınlar. Bağlantı yoksa False döner.

    payload['tip'] olay türünü belirtir: 'bilet_alma' | 'bilet_iptal' | 'yolcu_kaydi'.
    Worker servisi bu türe göre farklı bildirim üretir.
    """
    if not mq.channel:
        return False
    message = aio_pika.Message(
        body=json.dumps(payload, default=str).encode(),
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        content_type="application/json",
    )
    await mq.channel.default_exchange.publish(message, routing_key=settings.ticket_queue)
    print(f"📤 RabbitMQ olayı yayınlandı: tip={payload.get('tip')} | "
          f"{payload.get('pnr') or payload.get('yolcu_ad')}")
    return True


# Geriye dönük uyumluluk (eski ad)
publish_ticket_event = publish_event


async def is_connected() -> bool:
    return bool(
        mq.connection and not mq.connection.is_closed
        and mq.channel and not mq.channel.is_closed
    )
