"""RabbitMQ (aio-pika) mesaj kuyruğu katmanı — PUBLISHER tarafı.

Bilet satın alındığında ('POST /api/biletler') bir olay (event) bu kuyruğa
yazılır. Ayrı bir 'worker' servisi bu olayı tüketir ve yolcuya bildirim
(SMS/E-posta simülasyonu) gönderir. Böylece senkron olmayan (async)
mikroservis haberleşmesi gösterilmiş olur.
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


async def publish_ticket_event(payload: dict) -> bool:
    """Bilet olayını kuyruğa yayınlar. Bağlantı yoksa False döner."""
    if not mq.channel:
        return False
    message = aio_pika.Message(
        body=json.dumps(payload, default=str).encode(),
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        content_type="application/json",
    )
    await mq.channel.default_exchange.publish(message, routing_key=settings.ticket_queue)
    print(f"📤 RabbitMQ olayı yayınlandı: PNR={payload.get('pnr')} koltuk={payload.get('koltuk_no')}")
    return True


async def is_connected() -> bool:
    return bool(mq.connection and not mq.connection.is_closed)
