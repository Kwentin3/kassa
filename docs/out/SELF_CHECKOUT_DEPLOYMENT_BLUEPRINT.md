# Self-Checkout Terminal - Deployment Blueprint

Статус: Blueprint Draft 0.1  
Дата: 2026-05-19  
Целевой demo-домен: `kassa.speechbattle.com`  
Сервер: `roman@146.19.211.30`  
Действие сейчас: проектирование, без деплоя

## 1. Назначение

Документ описывает deployment design для статического Vite frontend MVP через Docker/Nginx и существующий Traefik. Он не выполняет деплой, не меняет сервер и не предполагает реальные secrets.

Запрещено без отдельной команды:

- SSH inspection;
- изменение Traefik;
- перезапуск существующих контейнеров;
- деплой приложения;
- запись ключей или паролей в репозиторий.

## 2. Deployment Assumptions

- Vite build produces static assets in `dist`.
- Runtime container serves `dist` through Nginx.
- Existing server already has Docker containers and Traefik.
- Service name: `kassa-web`.
- Domain: `kassa.speechbattle.com`.
- HTTPS is terminated by existing Traefik.
- Existing Traefik network, entrypoints and certresolver must be inspected before deployment.

Placeholders:

```dotenv
TRAEFIK_NETWORK=<existing-traefik-network>
TRAEFIK_CERT_RESOLVER=<existing-certresolver>
TRAEFIK_ENTRYPOINT=websecure
```

Do not assume network/certresolver names blindly.

## 3. Static Build Design

Build:

- install dependencies;
- run typecheck/tests if implemented;
- run `npm run build`;
- verify `dist/` contains `index.html`, assets and manifest.

Runtime:

- Nginx serves static files on port 80;
- SPA fallback routes unknown paths to `index.html`;
- cache hashed assets longer than `index.html`;
- `index.html` must use `no-cache` or a very short cache lifetime;
- hashed assets under `/assets/*` should use long cache with `immutable`;
- `manifest.webmanifest` should use short or moderate cache, not immutable;
- no backend routes.

Nginx SPA fallback concept:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

The actual `nginx.conf` should be created during implementation.

## 4. Docker Image Design

Recommended multi-stage Dockerfile concept:

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Implementation must pin or deliberately choose Node version. If package manager is pnpm/yarn, adjust install commands and lockfile copy.

Closed-world requirement: runtime image must contain all files needed to serve the app. It must not depend on source workspace files after build.

## 5. Docker Compose Design

Compose concept, not final production file:

```yaml
services:
  kassa-web:
    build:
      context: .
      dockerfile: Dockerfile
    image: kassa-web:demo
    container_name: kassa-web
    restart: unless-stopped
    networks:
      - traefik
    labels:
      - traefik.enable=true
      - traefik.http.routers.kassa.rule=Host(`kassa.speechbattle.com`)
      - traefik.http.routers.kassa.entrypoints=${TRAEFIK_ENTRYPOINT}
      - traefik.http.routers.kassa.tls=true
      - traefik.http.routers.kassa.tls.certresolver=${TRAEFIK_CERT_RESOLVER}
      - traefik.http.services.kassa.loadbalancer.server.port=80

networks:
  traefik:
    external: true
    name: ${TRAEFIK_NETWORK}
```

Before deployment, verify:

- actual Traefik network name;
- actual entrypoint name;
- actual certresolver name;
- whether existing Traefik uses Docker provider labels;
- router name `kassa` does not conflict;
- container name `kassa-web` does not conflict.

## 6. Traefik Design

Expected labels:

- `traefik.enable=true`;
- `traefik.http.routers.kassa.rule=Host(\`kassa.speechbattle.com\`)`;
- `traefik.http.routers.kassa.entrypoints=<entrypoint>`;
- `traefik.http.routers.kassa.tls=true`;
- `traefik.http.routers.kassa.tls.certresolver=<resolver>`;
- `traefik.http.services.kassa.loadbalancer.server.port=80`.

Do not alter existing Traefik static config in this blueprint. Deployment should attach only the new app container to the existing Traefik network.

## 7. Preflight Checklist

DNS:

- verify `kassa.speechbattle.com` has an A record;
- verify it points to `146.19.211.30`;
- verify DNS propagation before HTTPS smoke.

SSH/server:

- verify key-based SSH access to `roman@146.19.211.30`;
- do not copy or commit private keys;
- verify `docker ps`;
- verify `docker network ls`;
- identify Traefik container;
- identify Traefik network;
- identify entrypoints and certresolver from existing Traefik config;
- check container name availability.

Repo/build:

- verify branch/tag to deploy;
- verify `.env.example` exists;
- verify real `.env` is not committed;
- verify Vite build works locally or in CI;
- verify `dist` exists and includes manifest.

## 8. Runbook Draft

This is a template. Do not execute without deployment approval.

Preflight commands:

```bash
dig +short kassa.speechbattle.com
ssh roman@146.19.211.30
docker ps
docker network ls
docker inspect <traefik-container>
```

Build commands:

```bash
npm ci
npm run build
docker build -t kassa-web:demo .
```

Deploy commands concept:

```bash
docker compose --env-file .env.deploy up -d --build kassa-web
docker ps --filter name=kassa-web
```

Smoke:

- open `https://kassa.speechbattle.com`;
- verify idle screen;
- run Core Demo;
- check Android camera permission;
- check fallback mock input;
- check manual search;
- check payment success;
- check receipt success;
- check idle promotion;
- check quick branding;
- check Demo Control Panel is not active during payment pending.
- check browser DevTools for mixed content warnings; no app image, script, manifest or promo asset should load via `http://` on the HTTPS demo domain.

Rollback concept:

- stop only `kassa-web`;
- restore previous image/tag if one exists;
- do not touch Traefik;
- do not stop unrelated containers.

## 9. Android Tablet Verification

Checklist:

- Chrome opens `https://kassa.speechbattle.com`;
- fullscreen/browser kiosk mode is usable;
- landscape layout fits 10-13";
- camera permission prompt appears;
- camera scanner can scan at least one demo barcode/QR if lighting allows;
- permission denied shows fallback options;
- mock input fallback works;
- manual search works;
- catalog works;
- touch targets are large enough;
- no text overflow in key CTAs.

## 10. Security Boundaries

Do not store:

- SSH private keys;
- passwords;
- real API keys;
- bank tokens;
- KKT/fiscal provider tokens;
- production `.env`;
- Traefik admin credentials.

All `VITE_*` values are public in browser build. Do not place secrets in them.

## 11. Source Notes

- Vite build: https://vite.dev/guide/build
- Traefik Docker provider: https://doc.traefik.io/traefik/reference/install-configuration/providers/docker/
- Traefik Docker routing labels: https://doc.traefik.io/traefik/reference/routing-configuration/other-providers/docker/
- Nginx `try_files`: https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files
- Nginx Docker image: https://hub.docker.com/_/nginx
