# Jenkins CI/CD — Kurulum ve Çalıştırma

Bu klasör, projeye özel **Docker erişimli** bir Jenkins sağlar. Kurulum
sihirbazı kapalıdır; `obilet-ci` pipeline job'u **otomatik** oluşturulur.

## 1) Jenkins'i başlat

```bash
cd jenkins
docker compose -f docker-compose.jenkins.yml up -d --build
```

İlk açılış ~1 dk sürer. Sonra tarayıcıdan:

- **http://localhost:8091**  →  kullanıcı: `admin`  parola: `admin`

> Not: 8090 portu başka bir Jenkins tarafından kullanıldığından bu Jenkins
> **8091**'de çalışır.

## 2) Pipeline'ı çalıştır (live demo)

1. Soldaki listede **obilet-ci** job'una tıkla.
2. **Build Now** (Şimdi Derle) butonuna bas.
3. **Stage View** ile aşamaların sırayla yeşillendiğini izle:
   `Checkout → Build & Deploy (Docker) → Health Check → Smoke Test`
4. **Console Output**'ta `docker compose up`, `/health` çıktısı ve
   tüm REST testlerinin geçtiği canlı görünür.

Pipeline bitince tüm servisler (mongo/redis/rabbitmq/backend/worker/
frontend) Docker üzerinde ayakta olur — yani CI/CD hem **derler** hem **deploy** eder.

## 3) GitHub Webhook (otomatik tetikleme) — opsiyonel

Hocanın istediği "GitHub hook trigger for GITScm polling" için:

1. Jenkins job → **Configure** → **Build Triggers** →
   *GitHub hook trigger for GITScm polling* işaretli (Jenkinsfile zaten
   `triggers { githubPush() }` ile ayarlar).
2. Yerel Jenkins'i internete açmak için bir tünel kullan (derste gösterilen
   yöntem). Örnek:
   ```bash
   cloudflared tunnel --url http://localhost:8091
   ```
   Komut sana `https://xxxx.trycloudflare.com` gibi bir adres verir.
3. GitHub deposu → **Settings → Webhooks → Add webhook**:
   - Payload URL: `https://xxxx.trycloudflare.com/github-webhook/`
   - Content type: `application/json`
   - Event: *Just the push event*
4. Artık her `git push` sonrası pipeline otomatik tetiklenir.

## Sorun Giderme

- **Job görünmüyorsa:** `docker compose -f docker-compose.jenkins.yml logs -f jenkins`
  ile JCasC loglarını kontrol et.
- **`docker: not found` hatası:** Bu imaj docker CLI içerir; konteyneri
  `--build` ile yeniden kur.
- **Port 8091 dolu:** compose dosyasında `8091:8080` satırını değiştir.
