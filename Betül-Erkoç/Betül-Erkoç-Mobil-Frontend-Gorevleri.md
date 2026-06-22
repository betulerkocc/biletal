# Betül Erkoç'un Mobil Frontend Görevleri
**Mobile Front-end Demo Videosu:** [Gereksinim Demoları (Sunum) Videosu](https://www.youtube.com/watch?v=ukluw-g09GM)

> Mobil uygulama React Native / Expo ile geliştirilmiştir.
> Çalıştırma: `cd frontend && npx expo start` (Android `a`, iOS `i`, Web `w`, cihaz: Expo Go).

## 1. Sefer Ara Ekranı (`SeferAraScreen`)
- **İlgili API'ler:** `GET /api/sehirler`, `GET /api/seferler`, `GET /api/seferler/{id}`, `POST /api/biletler`
- **Görev:** Sefer arama, koltuk haritasından koltuk seçimi ve bilet alma ekranı.
- **UI Bileşenleri:**
  - Kalkış/Varış/Tarih için yatay kaydırmalı seçim çipleri
  - "Seferleri Getir" butonu
  - **Redis HIT/MISS ve süre (ms)** bilgisini gösteren kutu
  - Sefer kartları (firma, saat, güzergâh, fiyat, boş koltuk)
  - Bilet alma modalı + koltuk haritası (`SeatMap` bileşeni)
- **Kullanıcı Deneyimi:**
  - Yükleniyor göstergesi, boş sonuç durumu
  - Dolu koltuk seçilemez; "Koltuk dolu" hatası kullanıcıya gösterilir
  - Başarılı bilette PNR ve onay mesajı
- **Teknik Detaylar:** Durum yönetimi, `SafeAreaView`, kaydırılabilir içerik, merkezi `src/api.ts`.

## 2. Yolcular Ekranı (`YolcularScreen`)
- **İlgili API'ler:** `POST /api/yolcular`, `GET /api/yolcular`
- **Görev:** Yolcu kayıt formu ve listesi.
- **UI Bileşenleri:** Ad, Soyad, TC, Telefon, E-posta, Cinsiyet alanları; "Kaydet" butonu; yolcu listesi.
- **Form Validasyonu:** Zorunlu alanlar, TC 11 hane, mükerrer TC'de `409` uyarısı.
- **Kullanıcı Deneyimi:** Başarılı kayıtta liste güncellenir; klavye yönetimi (kapatma, sonraki alan).

## 3. Biletlerim Ekranı (`BiletlerimScreen`)
- **İlgili API'ler:** `GET /api/biletler`, `DELETE /api/biletler/{id}`
- **Görev:** Biletlerin listelenmesi ve iptal akışı.
- **UI Bileşenleri:** Bilet kartları (PNR, güzergâh, koltuk, durum); **"🐇 Bildirim gönderildi"** rozeti; "İptal Et" butonu.
- **Kullanıcı Deneyimi:** İptal onayı; iptalde durum "IPTAL"e döner; boş durumda bilgilendirme.

## 4. İstatistik Ekranı (`IstatistikScreen`)
- **İlgili API:** `GET /api/istatistik`
- **Görev:** Özet panosu (dashboard).
- **UI Bileşenleri:** Özet kartları (sefer, yolcu, aktif/iptal bilet, gelir, **gönderilen bildirim**), popüler güzergâhlar.
- **Kullanıcı Deneyimi:** Açılışta veri yükleme; sade, okunabilir kart düzeni.

## 5. Ayarlar Ekranı (`AyarlarScreen`)
- **Görev:** API adresi ayarı ve servis bağlantıları.
- **UI Bileşenleri:** API base URL alanı + "Kaydet" (AsyncStorage); RabbitMQ/Swagger bağlantıları; sürüm bilgisi.
- **Kullanıcı Deneyimi:** Gerçek cihazda `http://<bilgisayar-IP>:8000` girilerek backend'e bağlanır.

---

### Ortak Bileşenler
- **`ApiLogBar`:** Ekranın altında, mobilden REST API'ye giden her isteği canlı gösterir
  (metot, yol, HTTP durumu, süre, Redis HIT/MISS) — "isteğin gittiği ve işlemin
  gerçekleştiği" kanıtı.
- **`SeatMap`:** Koltuk haritası bileşeni (dolu/boş koltuk gösterimi ve seçimi).
