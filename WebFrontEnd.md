# Web Frontend Görev Dağılımı

**Web Frontend Adresi:** [http://localhost:8082](http://localhost:8082)

Bu dokümanda, web uygulamasının kullanıcı arayüzü (UI) ve kullanıcı deneyimi (UX)
görevleri listelenmektedir. Biletal'in web arayüzü, **React Native / Expo**
uygulamasının `react-native-web` ile alınmış **statik web export'udur** —
yani mobil ile aynı kod tabanı tarayıcıda çalışır.

---

## Grup Üyelerinin Web Frontend Görevleri

1. [Betül Erkoç'un Web Frontend Görevleri](Betül-Erkoç/Betül-Erkoç-Web-Frontend-Gorevleri.md)

---

## Genel Web Frontend Prensipleri

### 1. Teknoloji ve Çalıştırma
- **Framework:** React Native + Expo (web hedefi: `react-native-web`)
- **Dil:** TypeScript
- **Build:** `expo export -p web` ile statik `dist/` üretilir.
- **Sunum:** Statik dosyalar Docker konteynerinde 8082 portunda servis edilir
  (`network_mode: host`).

### 2. Responsive Tasarım
- Tek tasarım sistemi hem masaüstü tarayıcıda hem mobilde çalışır.
- Esnek yerleşim (Flexbox tabanlı React Native stil sistemi).
- Sefer/şehir seçimleri yatay kaydırmalı "chip" bileşenleriyle yapılır.

### 3. Tasarım Sistemi
- **Renk Paleti:** `src/theme.ts` içinde merkezi renkler (primary kırmızı `#E11D2A`).
- **Tipografi:** Tutarlı başlık/gövde boyutları.
- **Bileşenler:** `src/ui.tsx` (Card, Button vb.) ve `src/components/` altında
  yeniden kullanılabilir bileşenler (SeatMap, ApiLogBar).

### 4. Sayfa / Sekme Yapısı
Uygulama 5 ana sekmeden oluşur:
- **Sefer Ara** — şehir/tarih seçimi, sefer listesi, koltuk seçimi, bilet alma
- **Yolcular** — yolcu kayıt formu ve listesi
- **Biletlerim** — bilet listesi ve iptal
- **İstatistik** — dashboard kartları
- **Ayarlar** — API adresi ve servis bağlantıları

### 5. API Entegrasyonu
- Tüm HTTP çağrıları `src/api.ts` üzerinden yapılır (tek merkezi istemci).
- Her istek/yanıt, ekranın altındaki **API Log çubuğunda** canlı görüntülenir
  (metot, yol, HTTP durumu, süre, Redis HIT/MISS).

### 6. Kullanıcı Deneyimi (UX)
- **Loading States:** Veri yüklenirken yükleniyor göstergeleri.
- **Error Handling:** Kullanıcı dostu hata mesajları (ör. "Koltuk dolu").
- **Empty States:** Boş liste durumları için bilgilendirici mesajlar.
- **Feedback:** İşlem sonrası anlık geri bildirim (başarı/hata).

### 7. Erişilebilirlik ve Performans
- Yeterli dokunma hedefi boyutları, okunabilir kontrast.
- Yalnızca aktif sekmenin verisi yüklenir (gereksiz istek yok).
