# Mobil Frontend Görev Dağılımı

Bu dokümanda, mobil uygulamanın kullanıcı arayüzü (UI) ve kullanıcı deneyimi (UX)
görevleri listelenmektedir. Biletal mobil uygulaması **React Native / Expo** ile
geliştirilmiştir; aynı kod tabanı iOS, Android ve web hedeflerinde çalışır.

---

## Grup Üyelerinin Mobil Frontend Görevleri

1. [Betül Erkoç'un Mobil Frontend Görevleri](Betül-Erkoç/Betül-Erkoç-Mobil-Frontend-Gorevleri.md)

---

## Genel Mobil Frontend Prensipleri

### 1. Teknoloji ve Çalıştırma
- **Framework:** React Native + Expo (SDK 56), TypeScript
- **Çalıştırma:** `cd frontend && npx expo start`
  - Android emülatör: `a` · iOS simülatör: `i` · Web: `w` · Gerçek cihaz: Expo Go (QR)
- **Navigasyon:** Alt sekme (bottom tab) tabanlı, durum (state) ile yönetilir.

### 2. Tasarım Sistemi
- **Renk Paleti:** Merkezi `src/theme.ts` (primary, metin, kenarlık renkleri).
- **Tipografi:** Okunabilir font boyutları; başlık/gövde hiyerarşisi.
- **Spacing:** Tutarlı padding/margin değerleri.
- **Iconography:** Sekme ve buton ikonları (emoji + metin etiketleri).

### 3. Ekranlar (5 Sekme)
| Sekme | Ekran | Sorumlu Gereksinimler |
|---|---|---|
| 🔍 Sefer Ara | `SeferAraScreen` | Şehir Listeleme, Sefer Arama, Sefer Detayı, Bilet Alma |
| 👤 Yolcular | `YolcularScreen` | Yolcu Kaydetme, Yolcuları Listeleme |
| 🎫 Biletlerim | `BiletlerimScreen` | Biletleri Listeleme, Bilet İptal |
| 📊 İstatistik | `IstatistikScreen` | İstatistikleri Görüntüleme |
| ⚙️ Ayarlar | `AyarlarScreen` | API adresi, servis bağlantıları |

### 4. Responsive ve Platform Uyumu
- Farklı ekran boyutlarına uyum (telefon/tablet/web).
- Safe area (çentik/durum çubuğu) desteği — `SafeAreaView`.
- Klavye açıldığında içerik kaybolmaması için kaydırılabilir formlar.

### 5. Kullanıcı Deneyimi (UX)
- **Loading States:** İstek sırasında yükleniyor göstergeleri.
- **Error Handling:** Kullanıcı dostu hata mesajları.
- **Empty States:** "Henüz bilet yok" gibi bilgilendirici boş durumlar.
- **Feedback:** Bilet alma/iptal gibi aksiyonlarda anlık geri bildirim.

### 6. Mobil → REST API Görünürlüğü
- Uygulamanın altındaki **API Log çubuğu**, mobilden REST API'ye giden her
  isteği canlı gösterir (metot, yol, HTTP durumu, süre, Redis HIT/MISS).
  Böylece "isteğin gittiği ve işlemin gerçekleştiği" net biçimde görünür.

### 7. Form Yönetimi
- Gerçek zamanlı doğrulama (ör. TC 11 hane, zorunlu alanlar).
- Hatalı alan altında uyarı; tüm alanlar geçerli olmadan gönder butonu pasif.
