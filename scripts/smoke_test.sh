#!/usr/bin/env bash
# ============================================================================
#  Obilet — Uçtan uca duman testi (smoke test)
#  Tüm 10 REST uç noktasını + Redis cache + RabbitMQ akışını doğrular.
#  Jenkins pipeline'ının "Health Check / Test" adımında da çağrılır.
# ============================================================================
set -euo pipefail
BASE="${BASE_URL:-http://localhost:8000}"
pass() { echo "  ✅ $1"; }
fail() { echo "  ❌ $1"; exit 1; }
hdr()  { echo; echo "▶ $1"; }

echo "================  OBILET SMOKE TEST  ================"
echo "Hedef: $BASE"

hdr "[0] /health — Mongo/Redis/RabbitMQ ayakta mı?"
H=$(curl -s "$BASE/health")
echo "$H" | jq .
[ "$(echo "$H" | jq -r .servisler.mongodb)" = "up" ]   && pass "MongoDB up"   || fail "MongoDB down"
[ "$(echo "$H" | jq -r .servisler.redis)" = "up" ]      && pass "Redis up"     || fail "Redis down"
[ "$(echo "$H" | jq -r .servisler.rabbitmq)" = "up" ]   && pass "RabbitMQ up"  || fail "RabbitMQ down"

hdr "[1] GET /api/sehirler"
N=$(curl -s "$BASE/api/sehirler" | jq -r .adet); echo "  şehir sayısı: $N"
[ "$N" -gt 0 ] && pass "Şehirler listelendi" || fail "Şehir yok"

hdr "[2] GET /api/seferler — REDIS CACHE (MISS -> HIT)"
# Türkçe karakterler URL-encode edilir (tarayıcı/mobil otomatik yapar)
SEFER_ARA=(--get "$BASE/api/seferler" --data-urlencode "kalkis=İstanbul" --data-urlencode "varis=Ankara" --data-urlencode "tarih=2026-06-23")
# MISS gözlemleyebilmek için cache'i temizle (önce Redis'i, yoksa API ile)
docker exec obilet-redis redis-cli FLUSHALL >/dev/null 2>&1 || true
C1=$(curl -s "${SEFER_ARA[@]}")
if [ "$(echo "$C1" | jq -r .cache)" = "HIT" ]; then
  curl -s -X POST "$BASE/api/seferler" -H 'Content-Type: application/json' \
    -d '{"kalkis":"İstanbul","varis":"Ankara","tarih":"2026-06-23","saat":"23:59","fiyat":999,"sure":"-"}' >/dev/null
  C1=$(curl -s "${SEFER_ARA[@]}")
fi
MISS=$(echo "$C1" | jq -r .cache); MS1=$(echo "$C1" | jq -r .sure_ms)
echo "  1. istek: cache=$MISS  süre=${MS1}ms"
C2=$(curl -s "${SEFER_ARA[@]}"); HIT=$(echo "$C2" | jq -r .cache); MS2=$(echo "$C2" | jq -r .sure_ms)
echo "  2. istek: cache=$HIT  süre=${MS2}ms"
[ "$MISS" = "MISS" ] && pass "İlk istek MongoDB'den (MISS)" || fail "MISS bekleniyordu"
[ "$HIT" = "HIT" ]   && pass "İkinci istek Redis'ten (HIT)" || fail "HIT bekleniyordu"
SEFER_ID=$(echo "$C1" | jq -r '.seferler[0].id')
echo "  örnek sefer: $SEFER_ID"

hdr "[3] POST /api/seferler — yeni sefer (cache temizlenir)"
NEW=$(curl -s -X POST "$BASE/api/seferler" -H 'Content-Type: application/json' \
  -d '{"kalkis":"Konya","varis":"Samsun","tarih":"2026-06-26","saat":"12:00","fiyat":300,"sure":"7s"}')
echo "$NEW" | jq '{id, kalkis, varis, bos_koltuk}'
[ "$(echo "$NEW" | jq -r .kalkis)" = "Konya" ] && pass "Sefer eklendi" || fail "Sefer eklenemedi"

hdr "[4] GET /api/seferler/{id} — koltuk haritası"
D=$(curl -s "$BASE/api/seferler/$SEFER_ID")
echo "$D" | jq '{id, kalkis, varis, toplam_koltuk, bos_koltuk}'
[ "$(echo "$D" | jq -r .id)" = "$SEFER_ID" ] && pass "Sefer detayı geldi" || fail "Detay yok"

hdr "[5] POST /api/yolcular — yolcu kaydı"
TC="$(date +%s | tail -c 11)0"
Y=$(curl -s -X POST "$BASE/api/yolcular" -H 'Content-Type: application/json' \
  -d "{\"ad\":\"Demo\",\"soyad\":\"Yolcu\",\"tc\":\"$TC\",\"telefon\":\"05551112233\",\"email\":\"demo@obilet.com\"}")
echo "$Y" | jq '{id, ad, soyad}'
YID=$(echo "$Y" | jq -r .id)
[ "$YID" != "null" ] && pass "Yolcu kaydedildi ($YID)" || fail "Yolcu kaydedilemedi"

hdr "[6] GET /api/yolcular"
YN=$(curl -s "$BASE/api/yolcular" | jq -r .adet); echo "  yolcu sayısı: $YN"
[ "$YN" -gt 0 ] && pass "Yolcular listelendi" || fail "Yolcu yok"

hdr "[7] POST /api/biletler — BİLET AL (RabbitMQ olayı yayınlanır)"
SEAT=$(( (RANDOM % 38) + 1 ))
B=$(curl -s -X POST "$BASE/api/biletler" -H 'Content-Type: application/json' \
  -d "{\"sefer_id\":\"$SEFER_ID\",\"koltuk_no\":$SEAT,\"yolcu_id\":\"$YID\"}")
echo "$B" | jq '{pnr, koltuk_no, durum, rabbitmq_published, mesaj}'
PNR=$(echo "$B" | jq -r .pnr); BID=$(echo "$B" | jq -r .id)
[ "$(echo "$B" | jq -r .durum)" = "ONAYLANDI" ] && pass "Bilet alındı (PNR=$PNR)" || fail "Bilet alınamadı"
[ "$(echo "$B" | jq -r .rabbitmq_published)" = "true" ] && pass "RabbitMQ olayı yayınlandı" || fail "RabbitMQ publish başarısız"

hdr "[8] GET /api/biletler"
BN=$(curl -s "$BASE/api/biletler" | jq -r .adet); echo "  bilet sayısı: $BN"
[ "$BN" -gt 0 ] && pass "Biletler listelendi" || fail "Bilet yok"

hdr "[~] RabbitMQ worker bildirimi işledi mi? (2sn bekle)"
sleep 2
BILDIRIM=$(curl -s "$BASE/api/istatistik" | jq -r .gonderilen_bildirim)
echo "  worker'ın gönderdiği bildirim sayısı: $BILDIRIM"
[ "$BILDIRIM" -gt 0 ] && pass "Worker bildirimi işledi (RabbitMQ uçtan uca çalışıyor)" || fail "Worker bildirim üretmedi"

hdr "[9] DELETE /api/biletler/{id} — iptal"
DEL=$(curl -s -X DELETE "$BASE/api/biletler/$BID")
echo "$DEL" | jq .
[ "$(echo "$DEL" | jq -r .pnr)" = "$PNR" ] && pass "Bilet iptal edildi" || fail "İptal başarısız"

hdr "[10] GET /api/istatistik — dashboard"
curl -s "$BASE/api/istatistik" | jq .

echo; echo "================  ✅ TÜM TESTLER GEÇTİ  ================"
