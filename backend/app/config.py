"""Uygulama ayarları — tüm bağlantı bilgileri ortam değişkenlerinden okunur.

Docker Compose içinde servis adları (mongo, redis, rabbitmq) kullanılır;
yerelde çalışırken .env veya ortam değişkenleri ile override edilebilir.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Obilet — Otobüs Bileti Otomasyon API"
    app_version: str = "1.0.0"

    # MongoDB
    mongo_url: str = "mongodb://mongo:27017"
    mongo_db: str = "obilet"

    # Redis (cache)
    redis_url: str = "redis://redis:6379/0"
    cache_ttl: int = 60  # saniye

    # RabbitMQ
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    ticket_queue: str = "ticket_events"


settings = Settings()
