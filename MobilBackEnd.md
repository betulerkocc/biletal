# Mobil Backend (REST API Bağlantısı) Görev Dağılımı

**REST API Adresi (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

Bu dokümanda, mobil uygulamanın REST API ile iletişimini sağlayan backend
entegrasyon görevleri listelenmektedir. Tüm API çağrıları, tek merkezi istemci
olan `frontend/src/api.ts` üzerinden yönetilir.

---

## Grup Üyelerinin Mobil Backend Görevleri

1. [Betül Erkoç'un Mobil Backend Görevleri](Betül-Erkoç/Betül-Erkoç-Mobil-Backend-Gorevleri.md)

---

## Genel Mobil Backend Prensipleri

### 1. HTTP Client Yapılandırması
- **Base URL (platforma göre varsayılan):**
  - Android emülatör: `http://10.0.2.2:8000`
  - iOS simülatör / Web: `http://localhost:8000`
  - Gerçek cihaz: **Ayarlar** sekmesinden `http://<bilgisayar-IP>:8000`
- **Kalıcılık:** Seçilen base URL, `AsyncStorage` ile cihazda saklanır.
- **Headers:** `Content-Type: application/json`
- **İstemci:** Yerleşik `fetch` API'si (`src/api.ts` içinde sarmalanmış).

### 2. Kimlik Doğrulama
- Bu prototipte token/JWT **kullanılmaz**; istekler kimlik doğrulama başlığı içermez.

### 3. Error Handling
- HTTP durum koduna göre kullanıcıya anlamlı mesaj gösterme
  (404 "bulunamadı", 409 "koltuk dolu / TC kayıtlı", 422 "geçersiz veri").
- Ağ hatalarında (timeout, bağlantı yok) kullanıcıyı bilgilendirme.
- Sunucudan dönen `detail` mesajının kullanıcıya yansıtılması.

### 4. İstek/Yanıt Modelleri
- İstek gövdeleri Pydantic şemalarına uygun hazırlanır
  (`SeferCreate`, `YolcuCreate`, `BiletCreate`).
- Query parametreleri (`kalkis`, `varis`, `tarih`) `encodeURIComponent` ile
  güvenli biçimde kodlanır (Türkçe karakter desteği).

### 5. Caching ve Performans (Sunucu Tarafı)
- `GET /api/seferler` yanıtındaki `cache` (HIT/MISS), `sure_ms` ve `X-Cache`
  başlığı okunarak Redis önbelleğinin etkisi arayüzde gösterilir.
- Veri değiştiren işlemler sonrası liste yeniden çekilir (taze veri).

### 6. Logging ve Debugging
- Her istek/yanıt, `onLog` geri çağrısı ile **API Log çubuğuna** iletilir:
  metot, yol, HTTP durumu, süre (ms) ve Redis HIT/MISS bilgisi canlı görünür.
- Bu mekanizma, mobilden REST API'ye giden trafiğin görsel kanıtıdır.
