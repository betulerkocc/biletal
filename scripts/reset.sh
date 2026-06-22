#!/usr/bin/env bash
# Demo verisini sıfırla: MongoDB temizle + Redis boşalt + backend'i yeniden seed et.
set -e
echo "🧹 MongoDB 'obilet' veritabanı siliniyor..."
docker exec obilet-mongo mongosh --quiet obilet --eval "db.dropDatabase()" >/dev/null 2>&1 || true
echo "🧹 Redis cache temizleniyor..."
docker exec obilet-redis redis-cli FLUSHALL >/dev/null 2>&1 || true
echo "🔄 Backend yeniden başlatılıyor (yeniden seed)..."
docker compose restart backend >/dev/null
echo "⏳ Hazır olması bekleniyor..."
for i in $(seq 1 20); do
  if curl -fsS http://localhost:8000/health 2>/dev/null | grep -q '"mongodb": *"up"'; then
    echo "✅ Sıfırlandı ve hazır."; exit 0
  fi
  sleep 2
done
echo "⚠️ Backend henüz hazır değil, birkaç saniye sonra tekrar deneyin."
