# Betül Erkoç'un REST API Metotları

**API Test Videosu:** [Link buraya eklenecek](https://example.com)

> Tüm uç noktalar Swagger üzerinden test edilebilir: http://localhost:8000/docs
> Kimlik doğrulama (JWT/Bearer) gerekmez.

## 1. Şehirleri Listeleme
- **Endpoint:** `GET /api/sehirler`
- **Response:** `200 OK`
  ```json
  { "adet": 12, "sehirler": [ { "id": "...", "ad": "Ankara" }, { "id": "...", "ad": "İstanbul" } ] }
  ```

## 2. Sefer Arama (Redis Cache)
- **Endpoint:** `GET /api/seferler`
- **Query Parameters:** `kalkis` (string, opsiyonel), `varis` (string, opsiyonel), `tarih` (string, opsiyonel)
- **Response Headers:** `X-Cache: HIT` veya `MISS`
- **Response:** `200 OK`
  ```json
  {
    "kaynak": "mongodb", "cache": "MISS", "sure_ms": 5.4, "adet": 8,
    "seferler": [
      { "id": "...", "kalkis": "İstanbul", "varis": "Ankara", "tarih": "2026-06-24",
        "saat": "08:00", "firma": "Biletal Turizm", "fiyat": 450.0,
        "toplam_koltuk": 40, "dolu_koltuklar": [3,12], "bos_koltuk": 38 }
    ]
  }
  ```

## 3. Sefer Ekleme
- **Endpoint:** `POST /api/seferler`
- **Request Body:**
  ```json
  { "kalkis": "İstanbul", "varis": "İzmir", "tarih": "2026-06-25",
    "saat": "09:00", "firma": "Biletal Turizm", "otobus_tipi": "2+1",
    "fiyat": 520.0, "toplam_koltuk": 40, "sure": "6s 15dk" }
  ```
- **Response:** `201 Created` — oluşturulan sefer döner. (İlgili arama cache'i temizlenir.)

## 4. Sefer Detayı Görüntüleme
- **Endpoint:** `GET /api/seferler/{sefer_id}`
- **Path Parameters:** `sefer_id` (string, required)
- **Response:** `200 OK` — sefer detayı + `dolu_koltuklar` / `bos_koltuk` (koltuk haritası)
- **Hata:** `404 Not Found` — "Sefer bulunamadı"

## 5. Yolcu Kaydetme (RabbitMQ — hoş geldin bildirimi)
- **Endpoint:** `POST /api/yolcular`
- **Request Body:**
  ```json
  { "ad": "Ahmet", "soyad": "Yılmaz", "tc": "12345678901",
    "telefon": "05551112233", "email": "ahmet@example.com", "cinsiyet": "Erkek" }
  ```
- **Response:** `201 Created` — oluşturulan yolcu + `"rabbitmq_published": true` döner. Worker yolcuya "hoş geldin" bildirimi gönderir.
- **Hata:** `409 Conflict` — "Bu TC ile kayıtlı yolcu var"

## 6. Yolcuları Listeleme
- **Endpoint:** `GET /api/yolcular`
- **Response:** `200 OK`
  ```json
  { "adet": 3, "yolcular": [ { "id": "...", "ad": "Ahmet", "soyad": "Yılmaz", "tc": "..." } ] }
  ```

## 7. Bilet Satın Alma (RabbitMQ)
- **Endpoint:** `POST /api/biletler`
- **Request Body:**
  ```json
  { "sefer_id": "...", "koltuk_no": 12, "ad": "Ahmet", "soyad": "Yılmaz" }
  ```
  > Alternatif olarak kayıtlı yolcu için `yolcu_id` gönderilebilir.
- **Response:** `201 Created`
  ```json
  { "id": "...", "pnr": "3P1L8V", "koltuk_no": 12, "durum": "ONAYLANDI",
    "bildirim_gonderildi": false, "rabbitmq_published": true,
    "mesaj": "Bilet oluşturuldu, bildirim kuyruğa alındı (RabbitMQ)" }
  ```
  > `bildirim_gonderildi` oluşturma anında `false`'tur; worker olayı tüketince `true` olur.
- **Hatalar:** `404` (sefer/yolcu bulunamadı), `409` (koltuk dolu), `400` (yolcu bilgisi eksik)

## 8. Biletleri Listeleme
- **Endpoint:** `GET /api/biletler`
- **Query Parameters:** `yolcu_id` (string, opsiyonel)
- **Response:** `200 OK`
  ```json
  { "adet": 2, "biletler": [ { "id": "...", "pnr": "3P1L8V", "yolcu_ad": "Ahmet Yılmaz",
    "koltuk_no": 12, "kalkis": "İstanbul", "varis": "Ankara",
    "durum": "ONAYLANDI", "bildirim_gonderildi": true } ] }
  ```
  > `bildirim_gonderildi`, RabbitMQ worker bildirimi işledikten sonra `true` görünür.

## 9. Bilet İptal Etme (RabbitMQ — iptal bildirimi)
- **Endpoint:** `DELETE /api/biletler/{bilet_id}`
- **Path Parameters:** `bilet_id` (string, required)
- **Response:** `200 OK`
  ```json
  { "mesaj": "Bilet iptal edildi", "pnr": "3P1L8V", "iade_tutari": 450.0, "rabbitmq_published": true }
  ```
- **Hatalar:** `404` (bilet bulunamadı), `409` (zaten iptal edilmiş). İptalde koltuk yeniden boşalır; worker yolcuya "iptal ve iade" bildirimi gönderir.

## 10. İstatistikleri Görüntüleme
- **Endpoint:** `GET /api/istatistik`
- **Response:** `200 OK`
  ```json
  { "toplam_sefer": 24, "toplam_yolcu": 3, "aktif_bilet": 5, "iptal_bilet": 1,
    "gonderilen_bildirim": 5, "toplam_gelir": 2250.0,
    "populer_rotalar": [ { "rota": "İstanbul → Ankara", "adet": 3 } ] }
  ```
