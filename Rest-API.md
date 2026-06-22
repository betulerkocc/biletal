# REST API Görev Dağılımı

**REST API Adresi (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

Bu dokümanda, proje ekibindeki üyenin geliştirmekten sorumlu olduğu REST API
metotları listelenmektedir. Tek kişilik proje olduğu için **10 uç noktanın
tamamı Betül Erkoç'a** aittir.

---

## Grup Üyelerinin REST API Metotları

1. [Betül Erkoç'un REST API Metotları](Betül-Erkoç/Betül-Erkoç-Rest-API-Gorevleri.md)

---

## Uç Nokta Özeti

| # | Metot | Yol | Açıklama | Özel |
|---|---|---|---|---|
| 1 | GET | `/api/sehirler` | Şehirleri listele | — |
| 2 | GET | `/api/seferler` | Sefer ara/listele | ⚡ Redis cache |
| 3 | POST | `/api/seferler` | Yeni sefer ekle | cache temizleme |
| 4 | GET | `/api/seferler/{sefer_id}` | Sefer detayı + koltuk haritası | — |
| 5 | POST | `/api/yolcular` | Yolcu kaydı oluştur | — |
| 6 | GET | `/api/yolcular` | Yolcuları listele | — |
| 7 | POST | `/api/biletler` | Bilet satın al | 🐇 RabbitMQ olayı |
| 8 | GET | `/api/biletler` | Biletleri listele | — |
| 9 | DELETE | `/api/biletler/{bilet_id}` | Bilet iptal et | — |
| 10 | GET | `/api/istatistik` | Dashboard istatistikleri | — |

---

## Genel REST API Prensipleri

### 1. Teknoloji
- **Framework:** FastAPI (Python, async/await)
- **Veritabanı:** MongoDB 7 (Motor — async sürücü)
- **Cache:** Redis 7 (`redis.asyncio`)
- **Mesaj Kuyruğu:** RabbitMQ 3 (`aio-pika`)
- **Dokümantasyon:** Otomatik Swagger UI (`/docs`) ve ReDoc (`/redoc`)

### 2. İstek / Yanıt Standartları
- Tüm istek ve yanıtlar `application/json` formatındadır.
- Başarılı oluşturma işlemleri `201 Created`, diğer başarılar `200 OK` döner.
- Hata durumları FastAPI standardına göre `{ "detail": "..." }` döner.

### 3. HTTP Durum Kodları
- `200 OK` — başarılı okuma/işlem
- `201 Created` — kayıt oluşturuldu (sefer, yolcu, bilet)
- `400 Bad Request` — geçersiz ID formatı (hatalı sefer/bilet ID'si)
- `404 Not Found` — sefer/yolcu/bilet bulunamadı
- `409 Conflict` — koltuk dolu / TC zaten kayıtlı / bilet zaten iptal
- `422 Unprocessable Entity` — doğrulama hatası (Pydantic)

### 4. Kimlik Doğrulama
- Bu prototipte kimlik doğrulama (JWT/Bearer) **kullanılmaz**; uç noktalar herkese açıktır.

### 5. Performans ve Mesajlaşma
- `GET /api/seferler` sonuçları Redis'te önbelleğe alınır (`X-Cache: HIT/MISS`).
- Veri değiştiren işlemler (sefer ekleme, bilet alma/iptal) ilgili cache'i temizler.
- `POST /api/biletler` bir bildirim olayını RabbitMQ kuyruğuna yayınlar.
