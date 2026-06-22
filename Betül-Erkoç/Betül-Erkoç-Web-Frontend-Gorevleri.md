# Betül Erkoç'un Web Frontend Görevleri
**Front-end Test Videosu:** [Link buraya eklenecek](https://example.com)

> Web arayüzü, React Native / Expo uygulamasının `react-native-web` ile alınmış
> statik web export'udur. Adres: http://localhost:8082

## 1. Sefer Ara Sayfası (`SeferAraScreen`)
- **İlgili API'ler:** `GET /api/sehirler`, `GET /api/seferler`, `GET /api/seferler/{id}`, `POST /api/biletler`
- **Görev:** Sefer arama, listeleme, koltuk seçimi ve bilet alma akışının web arayüzü.
- **UI Bileşenleri:**
  - Kalkış / Varış / Tarih için yatay kaydırmalı seçim "chip"leri ("Hepsi" + şehir/tarih)
  - "Seferleri Getir" butonu (primary)
  - **Redis durum kutusu:** `🗄️ MongoDB → MISS · süre: ~5 ms` / `⚡ Redis CACHE → HIT · süre: ~0.5 ms`
  - Sefer kartları (firma, saat, güzergâh, fiyat, boş koltuk sayısı, "Bilet Al" butonu)
  - Bilet alma modalı: koltuk haritası (`SeatMap`), dolu koltuklar pasif/kırmızı, boş koltuk seçilebilir
  - Yolcu bilgisi (ad/soyad) ve "Satın Al" butonu
- **Kullanıcı Deneyimi:**
  - Yükleniyor göstergesi; boş sonuç için bilgilendirici mesaj
  - Dolu koltuk seçilemez; hata durumunda ("Koltuk dolu") uyarı
  - Başarılı bilet sonrası onay mesajı ve PNR gösterimi
- **Teknik Detaylar:** Merkezi `src/api.ts` istemcisi, durum yönetimi (arama/sonuç/seçim/yükleme), `X-Cache` ve `sure_ms` okuma.

## 2. Yolcular Sayfası (`YolcularScreen`)
- **İlgili API'ler:** `POST /api/yolcular`, `GET /api/yolcular`
- **Görev:** Yolcu kayıt formu ve kayıtlı yolcu listesi.
- **UI Bileşenleri:**
  - Form alanları: Ad, Soyad, TC (11 hane), Telefon, E-posta, Cinsiyet
  - "Yolcu Kaydet" butonu
  - Kayıtlı yolcuların listesi (ad-soyad, TC, telefon)
- **Form Validasyonu:**
  - Zorunlu alanlar; TC tam 11 hane
  - Tüm alanlar geçerli olmadan buton pasif
  - Mükerrer TC durumunda `409` hatası kullanıcıya gösterilir ("Bu TC ile kayıtlı yolcu var")
- **Kullanıcı Deneyimi:** Başarılı kayıt sonrası listenin güncellenmesi, hata mesajları alan/üst kısımda.

## 3. Biletlerim Sayfası (`BiletlerimScreen`)
- **İlgili API'ler:** `GET /api/biletler`, `DELETE /api/biletler/{id}`
- **Görev:** Satın alınmış biletlerin listesi ve iptal işlemi.
- **UI Bileşenleri:**
  - Bilet kartları: PNR, güzergâh, tarih/saat, koltuk no, fiyat, durum (ONAYLANDI/IPTAL)
  - **"🐇 Bildirim gönderildi"** rozeti (worker bildirimi tamamlandığında)
  - "İptal Et" butonu (danger)
- **Kullanıcı Deneyimi:**
  - İptal için onay; başarılı iptalde durum "IPTAL"e döner, iade tutarı gösterilir
  - Zaten iptal edilmiş bilette buton pasif/uyarı
  - Boş durum: "Henüz bilet yok" mesajı

## 4. İstatistik Sayfası (`IstatistikScreen`)
- **İlgili API:** `GET /api/istatistik`
- **Görev:** Sistem özet panosunun (dashboard) gösterimi.
- **UI Bileşenleri:**
  - Özet kartları: Toplam Sefer, Toplam Yolcu, Aktif Bilet, İptal Bilet, Toplam Gelir
  - **Gönderilen Bildirim** kartı (RabbitMQ worker kanıtı)
  - Popüler güzergâhlar listesi (rota → adet)
- **Kullanıcı Deneyimi:** Açılışta veri yükleme, yenile imkânı.

## 5. Ayarlar Sayfası (`AyarlarScreen`)
- **Görev:** API adresi yapılandırması ve servis bağlantıları.
- **UI Bileşenleri:**
  - API base URL giriş alanı + "Kaydet" (AsyncStorage'da saklanır)
  - RabbitMQ Yönetim (:15672) ve Swagger (:8000/docs) bağlantıları
  - Uygulama/sürüm bilgisi
- **Kullanıcı Deneyimi:** Adres değişince yeni isteklerin yeni adrese gitmesi.
