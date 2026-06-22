# Betül Erkoç'un Mobil Backend Görevleri
**Mobil Front-end ile Back-end Bağlanmış Test Videosu:** [Gereksinim Demoları (Sunum) Videosu](https://www.youtube.com/watch?v=ukluw-g09GM)

> Tüm API çağrıları tek merkezi istemci `frontend/src/api.ts` üzerinden yapılır.
> Base URL platforma göre otomatik seçilir (Android `10.0.2.2:8000`, diğer `localhost:8000`)
> ve **Ayarlar**'dan değiştirilebilir (AsyncStorage). Kimlik doğrulama gerekmez.

## 1. Şehir Listeleme Servisi
- **API Endpoint:** `GET /api/sehirler`
- **Görev:** Şehir listesini çekip kalkış/varış seçim alanlarını doldurmak.
- **İşlevler:** İstek gönderme, yanıttaki `sehirler` dizisini parse edip UI'a aktarma, hata durumunda kullanıcıyı bilgilendirme.

## 2. Sefer Arama Servisi (Redis)
- **API Endpoint:** `GET /api/seferler`
- **Görev:** Seçilen `kalkis`, `varis`, `tarih` ile seferleri getirmek.
- **İşlevler:**
  - Query parametrelerini `encodeURIComponent` ile kodlama (Türkçe karakter desteği)
  - Yanıttaki `cache` (HIT/MISS), `sure_ms` ve `X-Cache` başlığını okuyup arayüzde gösterme
  - `seferler` listesini ekrana aktarma

## 3. Sefer Ekleme Servisi
- **API Endpoint:** `POST /api/seferler`
- **Görev:** Yeni sefer ekleme isteği göndermek (yönetim/demo amaçlı).
- **İşlevler:** `SeferCreate` gövdesini hazırlama, `201` yanıtını işleme, sonrasında listeyi yenileme.

## 4. Sefer Detayı Servisi
- **API Endpoint:** `GET /api/seferler/{sefer_id}`
- **Görev:** Seçilen seferin detayını ve koltuk haritasını çekmek.
- **İşlevler:** `dolu_koltuklar` / `bos_koltuk` verisini `SeatMap` bileşenine aktarma, `404` durumunda uyarı.

## 5. Yolcu Kaydetme Servisi
- **API Endpoint:** `POST /api/yolcular`
- **Görev:** Yolcu kayıt formundan gelen verileri API'ye göndermek.
- **İşlevler:**
  - Form doğrulaması (zorunlu alanlar, TC 11 hane)
  - `YolcuCreate` gövdesini gönderme
  - `409 Conflict` (mükerrer TC) hatasını yakalayıp kullanıcıya gösterme

## 6. Yolcu Listeleme Servisi
- **API Endpoint:** `GET /api/yolcular`
- **Görev:** Kayıtlı yolcuları çekip listelemek (bilet alırken seçim için de kullanılır).

## 7. Bilet Satın Alma Servisi (RabbitMQ)
- **API Endpoint:** `POST /api/biletler`
- **Görev:** Seçilen sefer ve koltuk için bilet oluşturma isteği göndermek.
- **İşlevler:**
  - `BiletCreate` gövdesi (`sefer_id`, `koltuk_no`, `ad`/`soyad` ya da `yolcu_id`)
  - `201` yanıtındaki `pnr` ve `rabbitmq_published` alanlarını işleme
  - Hata yönetimi: `409` (koltuk dolu), `404` (sefer/yolcu yok), `400` (eksik yolcu bilgisi)

## 8. Bilet Listeleme Servisi
- **API Endpoint:** `GET /api/biletler`
- **Görev:** Biletleri çekip "Biletlerim" ekranında göstermek.
- **İşlevler:** `bildirim_gonderildi` alanına göre "🐇 Bildirim gönderildi" rozetini gösterme.

## 9. Bilet İptal Servisi
- **API Endpoint:** `DELETE /api/biletler/{bilet_id}`
- **Görev:** Bilet iptal isteği göndermek.
- **İşlevler:** Onay sonrası DELETE çağrısı, `iade_tutari`'nı gösterme, listeyi yenileme; `409` (zaten iptal) yönetimi.

## 10. İstatistik Servisi
- **API Endpoint:** `GET /api/istatistik`
- **Görev:** Dashboard verilerini çekip kartlara aktarmak.
- **İşlevler:** `gonderilen_bildirim` ve `populer_rotalar` gibi alanları işleyip gösterme.

---

### Ortak Teknik Detaylar
- **HTTP İstemci:** Yerleşik `fetch`, `src/api.ts` içinde sarmalanmış (tek nokta).
- **Hata Yönetimi:** Sunucudan dönen `detail` mesajının kullanıcıya yansıtılması; ağ hatalarında bilgilendirme.
- **Loglama:** Her istek/yanıt `onLog` ile **API Log çubuğuna** iletilir (canlı kanıt).
- **Cache Farkındalığı:** Veri değiştiren işlemler sonrası ilgili listeler yeniden çekilir (taze veri).
