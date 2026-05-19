# Self-Checkout Terminal - Environment & Configuration Blueprint

Статус: Blueprint Draft 0.1  
Дата: 2026-05-19  
Основание: PRD Draft 0.2 and Frontend Blueprint

## 1. Назначение

Документ задает безопасную схему env/config для frontend MVP. Он не содержит real secrets, production credentials, SSH keys, tokens or passwords.

Vite rule: frontend-exposed values must use `VITE_*` if they need to be available through `import.meta.env` without custom `envPrefix`. Every `VITE_*` value is public in the client bundle and must not contain secrets.

## 2. Configuration Layers

Use three separate layers:

- Vite frontend public config: safe `VITE_*` variables bundled into client.
- Deployment/runbook variables: host, domain, Traefik network, compose/deploy parameters; not required in frontend build.
- Future server-only secrets: listed as future placeholders only, never in frontend and never committed with real values.

Implementation should read env in one entrypoint:

- `src/config/env.ts` parses `import.meta.env`;
- `src/config/appConfig.ts` maps env to application defaults;
- `src/config/featureFlags.ts` exposes booleans for camera, promo, demo mode.

No direct `import.meta.env.*` reads in screens or business components.

## 3. Proposed `.env.example`

This is a project schema for implementation. Values below are placeholders, not credentials.

```dotenv
# App / public frontend config. All VITE_* values are public in the client build.
VITE_APP_NAME=Self-Checkout Terminal Web UI Prototype
VITE_APP_ENV=demo
VITE_APP_VERSION=0.1.0
VITE_BASE_URL=https://kassa.speechbattle.com
VITE_DEMO_MODE=true
VITE_DEFAULT_LOCALE=ru
VITE_TERMINAL_ID=DEMO-001

# Branding / demo
VITE_DEFAULT_BRAND=demo-market
VITE_ENABLE_QUICK_BRANDING=true
VITE_ENABLE_IDLE_PROMO=true
VITE_IDLE_PROMO_DELAY_SEC=20

# Scanner / camera
VITE_ENABLE_CAMERA_SCANNER=true
VITE_CAMERA_SCANNER_MODE=html5-qrcode
VITE_SCANNER_FALLBACK_ENABLED=true

# Mock behavior
VITE_MOCK_CATALOG_SOURCE=local-fixtures
VITE_MOCK_PAYMENT_MODE=demo
VITE_MOCK_RECEIPT_MODE=demo
VITE_MOCK_STAFF_PIN_ENABLED=true
```

Do not put future server-only secrets into frontend `.env.example` unless they are clearly commented as not-for-client and excluded from build usage. Prefer documenting them in this blueprint and future backend docs.

## 4. Deployment / Runbook Variables

These can be used by deployment scripts, compose templates, CI/CD, or an ops runbook. They do not need to be available to Vite at runtime.

```dotenv
HOST_DOMAIN=kassa.speechbattle.com
HTTPS_ENABLED=true
STATIC_BUILD_DIR=dist
DEPLOY_TARGET_PATH=/opt/kassa-web
DEPLOY_HOST=146.19.211.30
DEPLOY_USER=roman
DEPLOY_PORT=22
TRAEFIK_NETWORK=<existing-traefik-network>
TRAEFIK_CERT_RESOLVER=<existing-certresolver>
TRAEFIK_ENTRYPOINT=websecure
```

Do not commit production values if local policy treats deployment host details as sensitive. The target host and domain are documented in the task context, but credentials and keys must stay outside git.

## 5. Future Server-Only Secrets

These names are for future backend/business logic planning only. They must not be referenced by frontend code and must not be bundled into client assets.

```dotenv
PAYMENT_PROVIDER_API_KEY=<server-only>
SBP_PROVIDER_TOKEN=<server-only>
FISCAL_PROVIDER_TOKEN=<server-only>
ONE_C_BASE_URL=<server-only>
ONE_C_USERNAME=<server-only>
ONE_C_PASSWORD=<server-only>
JWT_SECRET=<server-only>
SESSION_SECRET=<server-only>
```

Storage rule:

- real values only in ops/secret manager, CI secrets, deployment environment, or server-side secret store;
- no real values in git;
- no real values in PRD, blueprint, README, compose examples or frontend source.

## 6. `.gitignore` Requirements

Implementation should ensure:

```gitignore
.env
.env.*
!.env.example
!.env.*.example
```

If deployment uses additional local files, ignore them explicitly:

```gitignore
docker-compose.override.yml
*.pem
*.key
id_rsa*
id_ed25519*
```

## 7. Config Validation

`src/config/env.ts` should:

- read only known `VITE_*` names;
- provide safe defaults for demo mode;
- parse booleans explicitly;
- parse numbers explicitly;
- reject impossible values in development;
- never expose future server-only secret names to frontend code.

Suggested validation:

- `VITE_DEMO_MODE`: boolean;
- `VITE_ENABLE_CAMERA_SCANNER`: boolean;
- `VITE_CAMERA_SCANNER_MODE`: enum `html5-qrcode | zxing | disabled`;
- `VITE_IDLE_PROMO_DELAY_SEC`: positive number;
- `VITE_BASE_URL`: URL-like string, default current origin in local dev;
- `VITE_TERMINAL_ID`: non-empty demo string.

## 8. Feature Flag Use

Feature flags should gate UI capabilities, not simulate security:

- `VITE_ENABLE_QUICK_BRANDING` controls demo entry visibility.
- `VITE_ENABLE_IDLE_PROMO` controls idle promo timer.
- `VITE_ENABLE_CAMERA_SCANNER` enables camera scanner UI.
- `VITE_SCANNER_FALLBACK_ENABLED` must stay true for demo resilience.
- `VITE_MOCK_*` values select mock scenario defaults only.

Do not use frontend flags to protect real secrets or production admin features.

## 9. Closed-World Runtime Notes

Implementation must package everything required at runtime:

- fixtures included in `src/mocks` and bundled into `dist`;
- no runtime reads from workspace-only paths;
- all npm imports declared in `package.json`;
- config read through `src/config/env.ts`;
- no hidden `../../config/prod.json` or local secret file assumptions.

Validation after implementation should inspect the production build artifact, not only the IDE workspace.

## 10. Source Notes

- Vite env variables and modes: https://vite.dev/guide/env-and-mode/
- Vite build behavior: https://vite.dev/guide/build
