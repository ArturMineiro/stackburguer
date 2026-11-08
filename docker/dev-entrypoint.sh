#!/bin/sh
# Container de desenvolvimento: instala as dependências (Linux) só quando o
# package-lock.json muda e sobe o Astro com hot reload em http://localhost:4321
set -eu

lock_hash="$(sha256sum package-lock.json | cut -d' ' -f1)"
if [ "$(cat node_modules/.lock-hash 2>/dev/null || true)" != "$lock_hash" ]; then
  echo "[dev] Instalando dependências..."
  npm install --no-audit --no-fund --no-save
  echo "$lock_hash" > node_modules/.lock-hash
fi

exec npx astro dev --host 0.0.0.0 --port 4321
