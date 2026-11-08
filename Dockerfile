# syntax=docker/dockerfile:1.7

# ---------- build: Node + Chromium (site, PDFs e prévia do link) ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV CI=true \
    ASTRO_TELEMETRY_DISABLED=1 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
# Chromium "headless shell" + bibliotecas do sistema, usados só para gerar os PDFs
RUN npx playwright install --with-deps --only-shell chromium

COPY . .
# Opcionais: commit publicado, quantidade de mesas e URL pública
ARG GIT_COMMIT=""
ARG MESAS=""
ARG SITE_URL=""
RUN GIT_COMMIT="$GIT_COMMIT" MESAS="$MESAS" SITE_URL="$SITE_URL" npm run build

# ---------- runtime: só arquivos estáticos + nginx sem root ----------
FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
