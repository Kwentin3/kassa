# Sticky Context - Self-Checkout Terminal MVP

Дата: 2026-05-19  
Назначение: быстрый контекст для нового чата/агента без полной истории переписки.

## Проект

- Repo: `https://github.com/Kwentin3/kassa`.
- Branch: `mvp/self-checkout-web-ui`.
- Product: frontend-only web MVP кассы самообслуживания.
- Демо-домен: `https://kassa.speechbattle.com`.
- Основной форм-фактор: Android tablet 10-13" landscape.
- Business logic: mock-only. Не подключать real 1C/backend/payment/SBP/KKT/fiscalization/CMS.

## Текущий статус

- MVP реализован на React + TypeScript + Vite + Tailwind + Zustand.
- Core Demo реализован: idle -> add product -> cart -> payment success -> receipt -> reset.
- Extended Demo gap fixes реализованы: staff actions, receipt-error resolution, edge-case toggle, idle timeout, SBP mock QR, Quick Branding field edits.
- Последняя проверка: `npm run typecheck`, `npm run test:run`, `npm run build` прошли.
- Тесты: 7 files / 22 tests.
- Деплой на сервер выполнен, контейнер `kassa-web` running.

## Инфраструктура

- SSH доступ из локального контура: `roman@192.168.7.64`.
- External SSH на `146.19.211.30:22` не использовать из этого workspace.
- Deploy path: `/opt/stacks/kassa-web`.
- Docker container: `kassa-web`.
- Docker image: `kassa-web:demo`.
- Traefik container: `traefik`.
- Traefik network: `traefik-net`.
- Traefik entrypoint: `websecure`.
- Traefik certresolver: `letsencrypt`.
- Не менять существующий Traefik static config и не трогать чужие контейнеры.

## Env / Secrets

- Frontend env uses `VITE_*`; all `VITE_*` values are public.
- Real `.env` and `.env.deploy` exist locally and are gitignored.
- Do not print/cat real `.env` or `.env.deploy` values.
- Do not commit SSH keys, passwords, tokens, real API keys or production `.env`.
- Safe templates: `.env.example`, `.env.deploy.example`, `.env.secrets.example`.

## Key Docs

- PRD: `docs/product-ux/self-checkout-terminal-mvp-prd.v0.2.md`.
- Frontend blueprint: `docs/SELF_CHECKOUT_FRONTEND_BLUEPRINT.md`.
- Deployment runbook: `docs/runbooks/DEPLOYMENT_RUNBOOK.md`.
- Server audit: `docs/runbooks/SERVER_INFRASTRUCTURE_AUDIT.md`.
- Smoke checklist: `docs/runbooks/SMOKE_CHECKLIST.md`.
- Latest gap closure report: `docs/reports/2026-05-19/GAP_CLOSURE_VERIFICATION.report.md`.

## Safe Deploy Pattern

1. Run local checks: `npm run typecheck`, `npm run test:run`, `npm run build`.
2. Archive the checked commit.
3. Copy archive to `roman@192.168.7.64:/tmp/kassa-web.tar`.
4. Extract into `/opt/stacks/kassa-web`.
5. Run `docker compose --env-file .env.deploy up -d --build kassa-web`.
6. Smoke `https://kassa.speechbattle.com`.

## Known Remaining Manual Check

- Android Chrome physical camera permission/scan must still be checked on the actual tablet.
