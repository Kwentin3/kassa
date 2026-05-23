# Deployment Runbook - Self-Checkout Terminal

Статус: ready for isolated deployment  
Домен: `kassa.speechbattle.com`  
Service: `kassa-web`

## Preflight

1. Verify DNS:

```bash
dig +short kassa.speechbattle.com
```

Expected: `146.19.211.30`.

2. Verify SSH from local network:

```bash
ssh -p 22 roman@192.168.7.64
```

External SSH to `146.19.211.30:22` is not expected to work from this workspace.

3. Verify Docker/Traefik read-only:

```bash
docker ps
docker network ls
docker inspect <traefik-container>
```

Confirmed values:

- Traefik container name;
- Traefik network;
- Docker provider labels;
- entrypoint, expected `websecure`;
- certresolver name;
- no router/container conflict for `kassa` / `kassa-web`.

Use:

- `TRAEFIK_NETWORK=traefik-net`;
- `TRAEFIK_ENTRYPOINT=websecure`;
- `TRAEFIK_CERT_RESOLVER=letsencrypt`;
- `DEPLOY_TARGET_PATH=/opt/stacks/kassa-web`.

## Build

```bash
npm ci
npm run typecheck
npm run test:run
npm run build
docker build -t kassa-web:demo .
```

## Deploy

Only after Traefik values are confirmed:

```bash
docker compose --env-file .env.deploy up -d --build kassa-web
docker ps --filter name=kassa-web
```

Do not restart or modify existing Traefik.

## HTTPS Smoke

- Open `https://kassa.speechbattle.com`.
- Open `https://kassa.speechbattle.com/bolars/self-checkout-mvp`.
- Open `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1`.
- Open `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1`.
- Verify old showcase/diagnostics routes remain separate from the BOLARS route.
- Verify valid TLS certificate.
- Verify no mixed content warnings in DevTools.
- Verify `index.html` uses no-cache/short cache.
- Verify `/assets/*` uses long immutable cache.
- Verify `manifest.webmanifest` uses short/moderate cache.

Observed on 2026-05-19:

- `https://kassa.speechbattle.com` returned `200 OK`.
- TLS certificate subject is `kassa.speechbattle.com`; issuer is Let's Encrypt.
- `index.html` returned `Cache-Control: no-cache, no-store, must-revalidate`.
- `/assets/*` returned `Cache-Control: public, max-age=31536000, immutable`.
- `manifest.webmanifest` returned `Cache-Control: public, max-age=300`.

## Android Tablet Smoke

- Open domain in Android Chrome.
- Rotate to landscape.
- Verify idle screen.
- Start purchase.
- Trigger camera permission.
- If camera fails, use mock input.
- Manual search works.
- Catalog works.
- Card mock success works.
- Mock receipt success works.
- Quick branding works.
- Idle promo works.
- Demo Control Panel is disabled/read-only during `payment_pending`.

## Rollback

```bash
docker compose stop kassa-web
```

If previous image exists:

```bash
docker compose up -d kassa-web
```

Do not stop Traefik or unrelated containers.

## Certificate Error

- Confirm DNS points to `146.19.211.30`.
- Confirm router rule is `Host(\`kassa.speechbattle.com\`)`.
- Confirm entrypoint and certresolver names match actual Traefik config.
- Check Traefik logs read-only.
- Do not edit Traefik static config without explicit approval.

## Route Error

- Confirm service is attached to existing Traefik network.
- Confirm labels are visible on `kassa-web`.
- Confirm service port is `80`.
- Confirm no router name conflict with existing services.

## Camera Error

- Confirm page is opened via HTTPS.
- Confirm no mixed content warnings.
- Confirm Android Chrome camera permission is granted.
- Use fallback: mock input, keyboard input, manual search or catalog.
