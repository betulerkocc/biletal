# ── Frontend (Expo Web) · çok aşamalı (multi-stage) imaj ──
# 1) Build: statik web export'u üretir   2) Runtime: 8082'de sunar

FROM node:22-alpine AS build
WORKDIR /app
ENV EXPO_NO_TELEMETRY=1 CI=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web

FROM node:22-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 8082
# network_mode: host olduğundan 8082 doğrudan host'ta yayınlanır
CMD ["serve", "-s", "dist", "-l", "8082"]
