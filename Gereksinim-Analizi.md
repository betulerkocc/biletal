# Gereksinim Analizi

Bu projede tüm gereksinimler çıkarıldıktan sonra son hâlleri, hangi API metoduna
karşılık geldikleri ve kısa açıklamalarıyla birlikte aşağıya numaralı olarak
yazılmıştır. Ardından ekip üyesinin kendi sayfası oluşturulmuş ve gereksinimler
o sayfada ayrıntılı şekilde listelenmiştir.

> **Ekip:** Tek kişilik (Betül Erkoç). Tek kişi için **en az 10 gereksinim**
> kuralı gereği, projedeki **10 gereksinim doğrudan 10 REST API uç noktasına**
> birebir karşılık gelir.

## Gereksinim Sayıları (En Az)

- **1 Kişi:** 10 gereksinim
- **2 Kişi:** 16 gereksinim
- **3 Kişi:** 21 gereksinim
- **4 Kişi:** 24 gereksinim
- **5 Kişi:** 30 gereksinim

## Gereksinimlerde Uyulması Gereken Kurallar

1. **İsimler anlamlı olmalı:** Gereksinim isimleri net ve anlaşılır olmalıdır.
2. **Açıklamalar net olmalı:** Her gereksinimin açıklaması açık ve anlaşılır şekilde yazılmalıdır.
3. **Açıklamalar teknik jargon ve kısaltmalar içermemeli:** Herkesin anlayabileceği basit bir dille yazılmalıdır.
4. **Gereksinim isimleri çok uzun olmamalı ve bir eylem bildirmeli:**
   - İsimler kısa ve öz olmalıdır
   - Bir eylem fiili içermelidir
   - Örnekler: "Sefer Arama", "Bilet Satın Alma", "Bilet İptal Etme"

# Tüm Gereksinimler

1. **Şehirleri Listeleme** — `GET /api/sehirler` — (Betül Erkoç)
   Kalkış ve varış seçimi için sistemdeki şehirlerin listesini getirir.
2. **Sefer Arama** — `GET /api/seferler` — (Betül Erkoç)
   Kalkış, varış ve tarihe göre seferleri arar/listeler. Sonuçlar **Redis** ile önbelleğe alınır.
3. **Sefer Ekleme** — `POST /api/seferler` — (Betül Erkoç)
   Sisteme yeni bir sefer ekler; ilgili arama önbelleği otomatik temizlenir.
4. **Sefer Detayı Görüntüleme** — `GET /api/seferler/{sefer_id}` — (Betül Erkoç)
   Bir seferin ayrıntılarını ve koltuk haritasını (dolu/boş koltuklar) getirir.
5. **Yolcu Kaydetme** — `POST /api/yolcular` — (Betül Erkoç)
   Yeni bir yolcuyu kişisel bilgileriyle (ad, soyad, TC, telefon) kaydeder; "hoş geldin" bildirim olayını **RabbitMQ** kuyruğuna yayınlar.
6. **Yolcuları Listeleme** — `GET /api/yolcular` — (Betül Erkoç)
   Kayıtlı yolcuların listesini getirir.
7. **Bilet Satın Alma** — `POST /api/biletler` — (Betül Erkoç)
   Seçilen sefer ve koltuk için bilet oluşturur; bildirim olayını **RabbitMQ** kuyruğuna yayınlar.
8. **Biletleri Listeleme** — `GET /api/biletler` — (Betül Erkoç)
   Satın alınmış biletleri listeler.
9. **Bilet İptal Etme** — `DELETE /api/biletler/{bilet_id}` — (Betül Erkoç)
   Bir bileti iptal eder; koltuğu yeniden boşa çıkarır; "iptal" bildirim olayını **RabbitMQ** kuyruğuna yayınlar.
10. **İstatistikleri Görüntüleme** — `GET /api/istatistik` — (Betül Erkoç)
    Toplam sefer/yolcu/bilet, gelir ve gönderilen bildirim sayısı gibi özet verileri getirir.

# Gereksinim Dağılımları

1. [Betül Erkoç'un Gereksinimleri](Betül-Erkoç/Betül-Erkoç-Gereksinimler.md)
