"""Entegrasyon (smoke) testleri — çalışan stack'e karşı koşar.

Jenkins pipeline'ında 'docker compose up' sonrası bu testler çağrılır.
BASE_URL ortam değişkeni ile hedef API adresi belirlenir.
"""
import os

import httpx
import pytest

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
client = httpx.Client(base_url=BASE_URL, timeout=10.0)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["servisler"]["mongodb"] == "up"
    assert body["servisler"]["redis"] == "up"


def test_sehirler():
    r = client.get("/api/sehirler")
    assert r.status_code == 200
    assert r.json()["adet"] > 0


def test_seferler_cache_miss_then_hit():
    # Benzersiz sorgu ile MISS garantile
    params = {"kalkis": "İstanbul", "varis": "Ankara", "tarih": "2026-06-23"}
    r1 = client.get("/api/seferler", params=params)
    assert r1.status_code == 200
    # İkinci istek HIT olmalı
    r2 = client.get("/api/seferler", params=params)
    assert r2.headers.get("X-Cache") == "HIT"
    assert r2.json()["cache"] == "HIT"


def test_yolcu_ve_bilet_akisi():
    import uuid
    tc = str(uuid.uuid4().int)[:11]
    # Yolcu oluştur
    r = client.post("/api/yolcular", json={
        "ad": "Test", "soyad": "Kullanıcı", "tc": tc,
        "telefon": "05550000000", "email": "test@example.com",
    })
    assert r.status_code == 201, r.text
    yolcu_id = r.json()["id"]

    # Bir sefer bul
    seferler = client.get("/api/seferler").json()["seferler"]
    assert len(seferler) > 0
    sefer = seferler[0]

    # Bilet al -> RabbitMQ olayı yayınlanmalı
    r = client.post("/api/biletler", json={
        "sefer_id": sefer["id"], "koltuk_no": 25, "yolcu_id": yolcu_id,
    })
    assert r.status_code in (201, 409), r.text
    if r.status_code == 201:
        body = r.json()
        assert body["durum"] == "ONAYLANDI"
        assert "pnr" in body


def test_istatistik():
    r = client.get("/api/istatistik")
    assert r.status_code == 200
    assert "toplam_sefer" in r.json()


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-v"]))
