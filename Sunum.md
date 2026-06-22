# Video Sunum

> Çekim öncesi sistemi temiz başlatın:
> ```bash
> docker compose up -d --build      # tüm servisler ayağa
> bash scripts/reset.sh             # demo verisini sıfırla
> ```
> Ayrıntılı, adım adım çekim senaryosu: [docs/DEMO.md](docs/DEMO.md)

## CI-CD ve Docker Kanıt Videosu

> **Video Linki:** [CI-CD ve Docker videosu linki buraya eklenecek](https://example.com)

**Gösterilecekler:**
- `docker compose ps` → 6 servis (mongo, redis, rabbitmq, backend, worker, frontend)
- Tarayıcıda http://localhost:8082 (frontend Docker'da) ve http://localhost:8000/docs
- Jenkins (http://localhost:8091, admin/admin) → **obilet-ci** → **Build Now**
- **Stage View**: `Checkout → Build & Deploy (Docker) → Health Check → Smoke Test` (hepsi yeşil)
- **Console Output**: `docker compose up`, `/health` çıktısı, geçen testler

## RabbitMQ/Kafka Kanıt Videosu

> **Video Linki:** [RabbitMQ videosu linki buraya eklenecek](https://example.com)

**Gösterilecekler:** RabbitMQ'yu **üç gereksinim** kullanır → Yolcu Kaydetme (hoş geldin),
Bilet Satın Alma (satın alma), Bilet İptal Etme (iptal).
- İki terminal: birinde `docker compose logs -f worker`, RabbitMQ UI: http://localhost:15672 (guest/guest) → Queues → `ticket_events`
- **Kuyruk birikme tekniği (önerilir):** `docker compose stop worker` → uygulamadan **yolcu kaydet + bilet al + bilet iptal et** → RabbitMQ UI'da **mesajlar bekler (Ready=3)** → `docker compose start worker` → worker üç olayı da işler.
- Worker terminalinde üç farklı akış: `📥 YENİ YOLCU KAYDI → ✅`, `📥 BİLET ALMA → ✅`, `📥 BİLET İPTAL → ✅`
- Biletlerim'de bilete **"🐇 Bildirim gönderildi"** rozetinin gelmesi

## Redis/Memcached Kanıt Videosu

> **Video Linki:** [Redis videosu linki buraya eklenecek](https://example.com)

**Gösterilecekler:**
- Sefer Ara'da arama yap → **`🗄️ MongoDB → MISS · süre: ~5 ms`**
- Aynı aramayı tekrar yap → **`⚡ Redis CACHE → HIT · süre: ~0.5 ms`** (süre farkı vurgulanır)
- (Opsiyonel terminal kanıtı):
  ```bash
  docker exec obilet-redis redis-cli FLUSHALL
  curl -s -D- "http://localhost:8000/api/seferler" -o /dev/null | grep X-Cache   # MISS
  curl -s -D- "http://localhost:8000/api/seferler" -o /dev/null | grep X-Cache   # HIT
  ```

## Sunum Videosu (Cep Telefonunda Gösterilmeli, Tüm ekip bir arada)

> **Video Linki:** [Sunum videosu linki buraya eklenecek](https://example.com)

---

## Sunum Videosunda Neler Olmalı

### 1. Grup Lideri - Açılış Konuşması (1-2 dakika)

**Konuşma İçeriği:**
- Grup adının tanıtılması (Biletal)
- Projenin genel tanıtımı ve amacı (mikroservis tabanlı otobüs bileti otomasyonu)
- Sunumun yapısının kısaca açıklanması

**Örnek Konuşma:**
> "Merhaba, ben Betül Erkoç. Biletal projesini geliştirdim. Bu proje, bir otobüs
> firmasının bilet satış, sefer yönetimi ve yolcu kayıt süreçlerini dijitalleştiren
> mikroservis tabanlı bir Otobüs Bileti Otomasyon Sistemidir. Şimdi sorumlu olduğum
> gereksinimleri çalışır durumda göstereceğim."

---

### 2. Ekip Üyesi - Kişisel Tanıtım ve Gereksinim Sunumu

#### Betül Erkoç
**Kişisel Tanıtım:**
- İsim: Betül Erkoç
- Rol: Grup Lideri — Tam Yığın (REST API, Mobil, Web, Mobil Backend)

**Gereksinimler ve Demolar:**

1. **Şehirleri Listeleme**
   - API Metodu: `GET /api/sehirler`
   - Demo: Sefer Ara ekranında kalkış/varış şehirlerinin yüklenmesi

2. **Sefer Arama**
   - API Metodu: `GET /api/seferler`
   - Demo: Şehir/tarih seçip "Seferleri Getir" → liste + **Redis HIT/MISS**

3. **Sefer Ekleme**
   - API Metodu: `POST /api/seferler`
   - Demo: Swagger `/docs` üzerinden yeni sefer ekleme (cache temizlenir)

4. **Sefer Detayı Görüntüleme**
   - API Metodu: `GET /api/seferler/{sefer_id}`
   - Demo: Bir seferin koltuk haritasının (dolu/boş) gösterilmesi

5. **Yolcu Kaydetme**
   - API Metodu: `POST /api/yolcular`
   - Demo: Yolcular ekranından yeni yolcu kaydı (ad, soyad, TC, telefon)

6. **Yolcuları Listeleme**
   - API Metodu: `GET /api/yolcular`
   - Demo: Kayıtlı yolcuların listelenmesi

7. **Bilet Satın Alma**
   - API Metodu: `POST /api/biletler`
   - Demo: Koltuk seçip bilet alma → **RabbitMQ olayı** → worker bildirimi

8. **Biletleri Listeleme**
   - API Metodu: `GET /api/biletler`
   - Demo: Biletlerim ekranında biletlerin (PNR, koltuk, durum) listelenmesi

9. **Bilet İptal Etme**
   - API Metodu: `DELETE /api/biletler/{bilet_id}`
   - Demo: Bir bileti iptal etme → koltuğun yeniden boşalması

10. **İstatistikleri Görüntüleme**
    - API Metodu: `GET /api/istatistik`
    - Demo: İstatistik ekranında özet kartlar (toplam sefer/yolcu/bilet, gelir, bildirim)

---

### 3. Grup Lideri - Kapanış Konuşması (1 dakika)

**Örnek Konuşma:**
> "Bugün Biletal projemizi sundum. 10 gereksinimin tamamı çalışır durumda;
> ayrıca Redis önbellekleme, RabbitMQ mesaj kuyruğu ve Jenkins ile CI/CD süreçleri
> canlı olarak gösterildi. Teşekkürler!"

---

## Sunum Hazırlık Kontrol Listesi

### Genel Hazırlık
- [ ] Açılış konuşması hazırlandı
- [ ] Tüm gereksinimler çalışır durumda (`bash scripts/smoke_test.sh` geçiyor)
- [ ] Demo senaryoları ve test verileri hazır (`bash scripts/reset.sh`)

### Teknik Hazırlık
- [ ] Tüm servisler ayakta (`docker compose ps`)
- [ ] Jenkins ayakta (http://localhost:8091)
- [ ] Mikrofon ve ekran kaydı test edildi (kendi sesiniz duyulmalı)

### İçerik Hazırlık
- [ ] CI-CD/Docker videosu çekildi
- [ ] RabbitMQ videosu çekildi
- [ ] Redis videosu çekildi
- [ ] Sunum videosu (cep telefonunda, mobil arayüz) çekildi

---

## Zaman Yönetimi

- **Açılış:** 1-2 dakika
- **Gereksinim Sunumu:** Her gereksinim ~1-1.5 dakika (toplam ~10-15 dakika)
- **Kapanış:** 1 dakika
