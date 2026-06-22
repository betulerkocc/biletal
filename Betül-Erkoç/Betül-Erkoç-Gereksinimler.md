# Betül Erkoç'un Gereksinimleri

1. **Şehirleri Listeleme**
   - **API Metodu:** `GET /api/sehirler`
   - **Açıklama:** Kullanıcıların kalkış ve varış noktası seçebilmesi için sistemde
     tanımlı şehirlerin listesini getirir. Sefer arama ekranı açıldığında otomatik
     olarak çağrılır ve şehir seçim alanlarını doldurur.

2. **Sefer Arama**
   - **API Metodu:** `GET /api/seferler`
   - **Açıklama:** Kullanıcının seçtiği kalkış, varış ve tarihe uygun otobüs
     seferlerini arar ve listeler. Sonuçların hızlı dönmesi için arama sonuçları
     önbelleğe alınır; ilk arama veritabanından, tekrar aramalar önbellekten gelir.
     Hangi koltukların boş olduğu da bu listede görünür.

3. **Sefer Ekleme**
   - **API Metodu:** `POST /api/seferler`
   - **Açıklama:** Sisteme yeni bir otobüs seferi ekler. Kalkış, varış, tarih, saat,
     firma, fiyat ve koltuk sayısı gibi bilgiler kaydedilir. Yeni sefer eklendiğinde
     eski arama önbelleği otomatik olarak temizlenir ki yeni sefer aramalarda görünsün.

4. **Sefer Detayı Görüntüleme**
   - **API Metodu:** `GET /api/seferler/{sefer_id}`
   - **Açıklama:** Seçilen bir seferin tüm ayrıntılarını ve koltuk haritasını getirir.
     Hangi koltukların dolu, hangilerinin boş olduğu gösterilir; böylece kullanıcı
     bilet alırken uygun bir koltuk seçebilir.

5. **Yolcu Kaydetme**
   - **API Metodu:** `POST /api/yolcular`
   - **Açıklama:** Yeni bir yolcuyu sisteme kaydeder. Ad, soyad, TC kimlik numarası,
     telefon, e-posta ve cinsiyet bilgileri alınır. Aynı TC numarasıyla daha önce
     kayıt varsa sistem uyarı verir ve mükerrer kayda izin vermez. Kayıt sonrası
     yolcuya "hoş geldin" bildirimi bir mesaj kuyruğuna (RabbitMQ) bırakılır ve
     arka plandaki worker servisi bunu işler.

6. **Yolcuları Listeleme**
   - **API Metodu:** `GET /api/yolcular`
   - **Açıklama:** Sisteme kayıtlı tüm yolcuları listeler. Bilet alırken kayıtlı bir
     yolcunun hızlıca seçilebilmesini sağlar.

7. **Bilet Satın Alma**
   - **API Metodu:** `POST /api/biletler`
   - **Açıklama:** Seçilen sefer ve koltuk için bilet oluşturur. Koltuk dolu olarak
     işaretlenir ve bilete benzersiz bir PNR kodu verilir. Bilet alındığı anda,
     yolcuya gönderilecek bildirim bir mesaj kuyruğuna bırakılır; arka plandaki
     servis bu bildirimi (SMS ve e-posta simülasyonu) işler.

8. **Biletleri Listeleme**
   - **API Metodu:** `GET /api/biletler`
   - **Açıklama:** Satın alınmış biletleri listeler. Her bilet için PNR, koltuk,
     güzergâh, tarih, durum (onaylı/iptal) ve bildirim durumu görüntülenir.

9. **Bilet İptal Etme**
   - **API Metodu:** `DELETE /api/biletler/{bilet_id}`
   - **Açıklama:** Mevcut bir bileti iptal eder. Bilet "iptal" durumuna geçer ve
     o koltuk yeniden boşa çıkarılır; böylece koltuk başka bir yolcuya satılabilir.
     Zaten iptal edilmiş bir bilet tekrar iptal edilemez. İptal sonrası yolcuya
     "iptal ve iade" bildirimi bir mesaj kuyruğuna (RabbitMQ) bırakılır ve
     arka plandaki worker servisi bunu işler.

10. **İstatistikleri Görüntüleme**
    - **API Metodu:** `GET /api/istatistik`
    - **Açıklama:** Sistemin genel durumunu özetleyen verileri getirir: toplam sefer,
      toplam yolcu, aktif ve iptal bilet sayısı, toplam gelir, en popüler güzergâhlar
      ve gönderilen bildirim sayısı. Gönderilen bildirim sayısı, mesaj kuyruğunun
      çalıştığının uygulama içinden görülebilen kanıtıdır.
