# syntax=docker/dockerfile:1
# Site estático servido por nginx (imagem sem root, porta 8080).
FROM nginxinc/nginx-unprivileged:1.30-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html cardapio.css cardapio.js /usr/share/nginx/html/
COPY imagens/ /usr/share/nginx/html/imagens/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
