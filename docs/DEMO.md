# 🎬 Video Çekim Senaryosu (Gereksinim → Kanıt)

> Hoca notu: **Önce gereksinim adını söyle, sonra kanıtı göster.** Videoda
> **kendi sesin** duyulmalı. Her teknoloji için ayrı video (kişi sayısı × 3).

Çekime başlamadan önce sistemi temiz başlat:

```bash
docker compose up -d --build      # tüm servisler ayağa
bash scripts/reset.sh             # demo verisini sıfırla (temiz seed)
```

---

## 🎥 VİDEO 1 — RabbitMQ (Mesaj Kuyruğu)

**Söyle:** “Gereksinim: RabbitMQ ile asenkron mesaj kuyruğu. **Üç iş olayı** kuyruğa
yazılıyor — Yolcu Kaydetme (hoş geldin), Bilet Satın Alma (satın alma) ve Bilet
İptal (iptal) — ayrı bir worker servisi tüketip yolcuya bildirim gönderiyor.”

**Göster (kuyruk birikme tekniği — en net kanıt):**
1. Worker loglarını izlemek için terminal aç ve önce **worker'ı durdur**:
   ```bash
   docker compose stop worker
   ```
2. Tarayıcıda **http://localhost:15672** (guest/guest) → *Queues* → `ticket_events`
   → **Consumers = 0** olduğunu göster.
3. Uygulamadan sırayla: **yolcu kaydet**, **bilet al**, **o bileti iptal et** (3 işlem).
4. ~8 sn bekle → RabbitMQ'da **Messages Ready = 3** (mesajlar kuyrukta bekliyor) —
   istersen *Get messages* ile bir mesajın JSON içeriğini (`tip`, PNR…) göster.
5. Worker'ı başlat ve logları izle:
   ```bash
   docker compose start worker && docker compose logs -f worker
   ```
   Üç farklı akışı göster:
   `📥 YENİ YOLCU KAYDI → ✅`, `📥 BİLET ALMA → ✅`, `📥 BİLET İPTAL → ✅`.
6. Uygulamada **Biletlerim**'de bilete “🐇 Bildirim gönderildi” rozetini ve
   **İstatistik**'te `gönderilen_bildirim = 3` olduğunu göster.

> Basit alternatif: worker açıkken işlemleri yap, logların gerçek zamanlı aktığını göster.
> Tek komutla da kanıtlanır: `bash scripts/smoke_test.sh` → “Worker bildirimi işledi”.

---

## 🎥 VİDEO 2 — Redis (Cache)

**Söyle:** “Gereksinim: Redis ile önbellekleme. Sefer arama sonuçları Redis'te
cache'leniyor; ilk istek MongoDB'den (MISS), tekrarlar Redis'ten (HIT) geliyor.”

**Göster (uygulamadan):**
1. **Sefer Ara** ekranında kalkış/varış/tarih seç → **Seferleri Getir**.
2. Üstte beliren kutuda **`🗄️ MongoDB → MISS · süre: ~5 ms`** yazısını göster.
3. Aynı aramayı **tekrar** yap → **`⚡ Redis CACHE → HIT · süre: ~0.5 ms`** —
   süre farkını vurgula. Alttaki API Log çubuğunda da `⚡HIT` görünür.

**Göster (terminalden, isteğe bağlı güçlü kanıt):**
```bash
docker exec obilet-redis redis-cli FLUSHALL                                   # cache'i temizle
curl -s -D- "http://localhost:8000/api/seferler" -o /dev/null | grep X-Cache  # 1. çağrı → MISS
curl -s -D- "http://localhost:8000/api/seferler" -o /dev/null | grep X-Cache  # 2. çağrı → HIT
docker exec obilet-redis redis-cli KEYS 'seferler:*'                          # oluşan cache anahtarları
```

---

## 🎥 VİDEO 3 — Docker + CI/CD (Jenkins)

**Söyle:** “Gereksinim: Docker ile konteynerizasyon ve Jenkins ile CI/CD.
Frontend ve backend dahil tüm servisler Docker'da; Jenkins pipeline'ı derleyip
deploy ediyor, sağlık ve testleri çalıştırıyor.”

**Göster — Docker:**
```bash
docker compose ps          # 6 servis: mongo redis rabbitmq backend worker frontend
```
Tarayıcıda http://localhost:8082 (frontend Docker'da) ve http://localhost:8000/docs
(backend Docker'da) açık olduğunu göster.

**Göster — Jenkins:**
1. Jenkins'i başlat (ilk sefer): `cd jenkins && docker compose -f docker-compose.jenkins.yml up -d --build`
2. **http://localhost:8091** (admin/admin) → **obilet-ci** → **Build Now**.
3. **Stage View**'da aşamaların yeşillendiğini izle:
   `Checkout → Build & Deploy (Docker) → Health Check → Smoke Test`.
4. **Console Output**'ta `docker compose up`, `/health` ve geçen testleri göster.
5. (Opsiyonel) GitHub webhook tetiklemesi → `jenkins/SETUP.md` adım 3.

---

## 🎥 Frontend Kanıt Videosu (her üye kendi sayfası için)

**Söyle:** “Gereksinim: [Sayfa adı] mobil arayüzü.” Emülatör/cihazda ilgili sekmeyi
(Sefer Ara / Yolcular / Biletlerim / İstatistik / Ayarlar) gez, tasarımı göster.

## 🎥 Backend Kanıt Videosu (her üye kendi REST API'si için)

**Söyle:** “Gereksinim: [Uç nokta] REST API.” İşlemi uygulamadan yap ve
**alttaki API Log çubuğunda** isteğin REST API'ye gidip `200/201` döndüğünü;
istersen **Swagger /docs**'ta aynı uç noktayı **Try it out** ile çalıştırıp
yanıtı göster. (Hoca: “isteğin gittiği ve işlemin gerçekleştiği net görünmeli.”)

---

## ✅ Gereksinim → Kanıt Özet Tablosu

| Gereksinim | Nerede kanıtlanır |
|---|---|
| Microservices (3+ katman) | `docker compose ps` — 6 servis |
| MongoDB + Volume | `docker volume ls \| grep obilet_mongo_data`, veriler kalıcı |
| FastAPI 10 REST uç noktası | `http://localhost:8000/docs` |
| Swagger dokümantasyon | `/docs` |
| React Native/Expo frontend | `http://localhost:8082` / emülatör |
| Mobil → REST API görünürlüğü | uygulamadaki **API Log** çubuğu |
| Docker Compose tek komut | `docker compose up -d --build` |
| network_mode host (frontend) | `docker-compose.yml` → frontend servisi |
| **Redis** | Sefer Ara HIT/MISS · VİDEO 2 |
| **RabbitMQ** | bilet al → worker log + :15672 · VİDEO 1 |
| **Jenkins CI/CD** | `obilet-ci` pipeline · VİDEO 3 |
