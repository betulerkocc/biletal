# API Tasarımı — OpenAPI Specification

**OpenAPI Spesifikasyon Dosyası:** [biletal-api.yaml](biletal-api.yaml)
(FastAPI tarafından otomatik üretilen, canlı `/openapi.json` çıktısıdır.)

Bu doküman, Biletal REST API'sini OpenAPI 3.x standardına göre tanımlar.
Çalışan Swagger arayüzü: **http://localhost:8000/docs**

> **Kimlik doğrulama:** Bu prototip API **JWT/Bearer kullanmaz**; tüm uç noktalar
> herkese açıktır. Veri formatı `application/json`'dır.

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Biletal — Otobüs Bileti Otomasyon API
  description: |
    Mikroservis tabanlı otobüs bileti otomasyon sistemi.
    - MongoDB (kalıcı veri) · Redis (cache) · RabbitMQ (mesaj kuyruğu)
    - Toplam 10 iş (business) REST uç noktası
  version: 1.0.0
  contact:
    name: Biletal — Betül Erkoç
    url: https://github.com/betulerkocc/biletal
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: http://localhost:8000
    description: Yerel geliştirme sunucusu (Docker Compose)

tags:
  - name: Şehirler
    description: Şehir listeleme işlemleri
  - name: Seferler
    description: Sefer arama, ekleme ve detay işlemleri (Redis cache)
  - name: Yolcular
    description: Yolcu kayıt ve listeleme işlemleri
  - name: Biletler
    description: Bilet satın alma, listeleme ve iptal işlemleri (RabbitMQ)
  - name: İstatistik
    description: Dashboard özet verileri

paths:
  /api/sehirler:
    get:
      tags: [Şehirler]
      summary: "[1] Şehirleri listele"
      description: Kalkış/varış seçimi için şehir listesini döner.
      operationId: listSehirler
      responses:
        '200':
          description: Başarılı
          content:
            application/json:
              schema:
                type: object
                properties:
                  adet: { type: integer, example: 12 }
                  sehirler:
                    type: array
                    items: { $ref: '#/components/schemas/Sehir' }

  /api/seferler:
    get:
      tags: [Seferler]
      summary: "[2] Sefer ara/listele — REDIS CACHE'li"
      description: |
        Seferleri kalkış/varış/tarihe göre arar.
        İlk istek MongoDB'den (`cache: MISS`), tekrarlar Redis'ten (`cache: HIT`) gelir.
        Yanıtta `cache` ve `sure_ms` alanları ile `X-Cache` başlığı bulunur.
      operationId: listSeferler
      parameters:
        - { name: kalkis, in: query, required: false, schema: { type: string }, example: "İstanbul" }
        - { name: varis,  in: query, required: false, schema: { type: string }, example: "Ankara" }
        - { name: tarih,  in: query, required: false, schema: { type: string }, example: "2026-06-24" }
      responses:
        '200':
          description: Başarılı
          headers:
            X-Cache:
              description: "HIT (Redis) veya MISS (MongoDB)"
              schema: { type: string, enum: [HIT, MISS] }
          content:
            application/json:
              schema: { $ref: '#/components/schemas/SeferListResponse' }
    post:
      tags: [Seferler]
      summary: "[3] Yeni sefer ekle (cache temizlenir)"
      operationId: createSefer
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/SeferCreate' }
      responses:
        '201':
          description: Sefer oluşturuldu
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Sefer' }
        '422': { $ref: '#/components/responses/ValidationError' }

  /api/seferler/{sefer_id}:
    get:
      tags: [Seferler]
      summary: "[4] Sefer detayı + koltuk haritası"
      operationId: getSefer
      parameters:
        - { name: sefer_id, in: path, required: true, schema: { type: string } }
      responses:
        '200':
          description: Başarılı
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Sefer' }
        '404': { $ref: '#/components/responses/NotFound' }

  /api/yolcular:
    get:
      tags: [Yolcular]
      summary: "[6] Yolcuları listele"
      operationId: listYolcular
      responses:
        '200':
          description: Başarılı
          content:
            application/json:
              schema:
                type: object
                properties:
                  adet: { type: integer }
                  yolcular:
                    type: array
                    items: { $ref: '#/components/schemas/Yolcu' }
    post:
      tags: [Yolcular]
      summary: "[5] Yolcu kaydı oluştur"
      operationId: createYolcu
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/YolcuCreate' }
      responses:
        '201':
          description: Yolcu oluşturuldu
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Yolcu' }
        '409':
          description: Bu TC ile kayıtlı yolcu zaten var
        '422': { $ref: '#/components/responses/ValidationError' }

  /api/biletler:
    get:
      tags: [Biletler]
      summary: "[8] Biletleri listele"
      operationId: listBiletler
      parameters:
        - { name: yolcu_id, in: query, required: false, schema: { type: string } }
      responses:
        '200':
          description: Başarılı
          content:
            application/json:
              schema:
                type: object
                properties:
                  adet: { type: integer }
                  biletler:
                    type: array
                    items: { $ref: '#/components/schemas/Bilet' }
    post:
      tags: [Biletler]
      summary: "[7] Bilet satın al — RABBITMQ olayı yayınlar"
      description: |
        Bilet oluşturur, koltuğu doldurur, sefer cache'ini temizler ve
        `ticket_events` kuyruğuna bir olay yayınlar. Worker servisi olayı
        tüketip yolcuya bildirim (SMS/E-posta simülasyonu) gönderir.
      operationId: bookTicket
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/BiletCreate' }
      responses:
        '201':
          description: Bilet oluşturuldu, bildirim kuyruğa alındı
          content:
            application/json:
              schema: { $ref: '#/components/schemas/BiletCreated' }
        '404': { description: Sefer veya yolcu bulunamadı }
        '409': { description: Seçilen koltuk dolu }
        '422': { $ref: '#/components/responses/ValidationError' }

  /api/biletler/{bilet_id}:
    delete:
      tags: [Biletler]
      summary: "[9] Bilet iptal et (koltuk boşalır)"
      operationId: cancelTicket
      parameters:
        - { name: bilet_id, in: path, required: true, schema: { type: string } }
      responses:
        '200':
          description: Bilet iptal edildi
          content:
            application/json:
              schema:
                type: object
                properties:
                  mesaj: { type: string, example: "Bilet iptal edildi" }
                  pnr: { type: string, example: "3P1L8V" }
                  iade_tutari: { type: number, example: 450.0 }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { description: Bilet zaten iptal edilmiş }

  /api/istatistik:
    get:
      tags: [İstatistik]
      summary: "[10] Dashboard istatistikleri"
      description: |
        `gonderilen_bildirim` alanı RabbitMQ worker'ının ürettiği bildirim
        sayısıdır — kuyruğun çalıştığının uygulama içinden görülebilir kanıtı.
      operationId: getIstatistik
      responses:
        '200':
          description: Başarılı
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Istatistik' }

components:
  schemas:
    Sehir:
      type: object
      properties:
        id: { type: string, example: "66795f1c2a..." }
        ad: { type: string, example: "İstanbul" }

    SeferCreate:
      type: object
      required: [kalkis, varis, tarih, saat, fiyat]
      properties:
        kalkis: { type: string, example: "İstanbul" }
        varis: { type: string, example: "Ankara" }
        tarih: { type: string, description: "YYYY-AA-GG", example: "2026-06-25" }
        saat: { type: string, example: "09:00" }
        firma: { type: string, default: "Biletal Turizm" }
        otobus_tipi: { type: string, default: "2+1" }
        fiyat: { type: number, example: 450.0 }
        toplam_koltuk: { type: integer, minimum: 10, maximum: 60, default: 40 }
        sure: { type: string, default: "5s 30dk" }

    Sefer:
      type: object
      properties:
        id: { type: string }
        kalkis: { type: string, example: "İstanbul" }
        varis: { type: string, example: "Ankara" }
        tarih: { type: string, example: "2026-06-24" }
        saat: { type: string, example: "08:00" }
        firma: { type: string, example: "Biletal Turizm" }
        otobus_tipi: { type: string, example: "2+1" }
        fiyat: { type: number, example: 450.0 }
        toplam_koltuk: { type: integer, example: 40 }
        dolu_koltuklar: { type: array, items: { type: integer }, example: [3, 12] }
        bos_koltuk: { type: integer, example: 38 }
        sure: { type: string, example: "5s 30dk" }

    SeferListResponse:
      type: object
      properties:
        kaynak: { type: string, enum: [mongodb, redis-cache], example: "mongodb" }
        cache: { type: string, enum: [HIT, MISS], example: "MISS" }
        sure_ms: { type: number, example: 5.4 }
        adet: { type: integer, example: 8 }
        seferler:
          type: array
          items: { $ref: '#/components/schemas/Sefer' }

    YolcuCreate:
      type: object
      required: [ad, soyad, tc, telefon]
      properties:
        ad: { type: string, example: "Ahmet" }
        soyad: { type: string, example: "Yılmaz" }
        tc: { type: string, minLength: 11, maxLength: 11, example: "12345678901" }
        telefon: { type: string, example: "05551112233" }
        email: { type: string, example: "ahmet@example.com" }
        cinsiyet: { type: string, default: "Belirtilmedi", example: "Erkek" }

    Yolcu:
      allOf:
        - $ref: '#/components/schemas/YolcuCreate'
        - type: object
          properties:
            id: { type: string }
            created_at: { type: string, format: date-time }

    BiletCreate:
      type: object
      required: [sefer_id, koltuk_no]
      properties:
        sefer_id: { type: string, description: "Satın alınacak seferin ID'si" }
        koltuk_no: { type: integer, minimum: 1, maximum: 60, example: 12 }
        yolcu_id: { type: string, description: "Kayıtlı yolcu ID'si (opsiyonel)" }
        ad: { type: string, description: "Yolcu adı (yolcu_id yoksa)" }
        soyad: { type: string, description: "Yolcu soyadı (yolcu_id yoksa)" }

    Bilet:
      type: object
      properties:
        id: { type: string }
        pnr: { type: string, example: "3P1L8V" }
        sefer_id: { type: string }
        yolcu_ad: { type: string, example: "Ahmet Yılmaz" }
        koltuk_no: { type: integer, example: 12 }
        kalkis: { type: string, example: "İstanbul" }
        varis: { type: string, example: "Ankara" }
        tarih: { type: string, example: "2026-06-24" }
        saat: { type: string, example: "08:00" }
        fiyat: { type: number, example: 450.0 }
        durum: { type: string, enum: [ONAYLANDI, IPTAL], example: "ONAYLANDI" }
        bildirim_gonderildi: { type: boolean, example: true }
        created_at: { type: string, format: date-time }

    BiletCreated:
      allOf:
        - $ref: '#/components/schemas/Bilet'
        - type: object
          properties:
            rabbitmq_published: { type: boolean, example: true }
            mesaj: { type: string, example: "Bilet oluşturuldu, bildirim kuyruğa alındı (RabbitMQ)" }

    Istatistik:
      type: object
      properties:
        toplam_sefer: { type: integer, example: 24 }
        toplam_yolcu: { type: integer, example: 3 }
        aktif_bilet: { type: integer, example: 5 }
        iptal_bilet: { type: integer, example: 1 }
        gonderilen_bildirim: { type: integer, example: 5 }
        toplam_gelir: { type: number, example: 2250.0 }
        populer_rotalar:
          type: array
          items:
            type: object
            properties:
              rota: { type: string, example: "İstanbul → Ankara" }
              adet: { type: integer, example: 3 }

  responses:
    NotFound:
      description: Kaynak bulunamadı
      content:
        application/json:
          schema:
            type: object
            properties:
              detail: { type: string, example: "Sefer bulunamadı" }
    ValidationError:
      description: Doğrulama hatası
      content:
        application/json:
          schema:
            type: object
            properties:
              detail:
                type: array
                items:
                  type: object
                  properties:
                    loc: { type: array, items: { type: string } }
                    msg: { type: string }
                    type: { type: string }
```
