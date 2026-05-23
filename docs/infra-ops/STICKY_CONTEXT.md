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
- BOLARS Self-Checkout MVP добавлен как отдельный adaptive scan-first route: `/bolars/self-checkout-mvp`.
- BOLARS debug route: `/bolars/self-checkout-mvp?debug=1`.
- BOLARS preview route: `/bolars/self-checkout-mvp?debug=1&preview=1`.
- BOLARS route использует `SelfCheckoutRuntimePort`, `RuntimeAdapterFactory`, `MockAdapter`, `PreviewAdapter`, `OneCInterfaceAdapter` shell и `window.BolarsSelfCheckout`.
- BOLARS visual layer теперь имеет adaptive viewport contract: portrait `1080x1920` reference + `landscapeCompact` для `1366x768`/`1280x800`; ключевые размеры вынесены в CSS variables/profile rules в `src/styles/index.css`.
- Старый showcase/catalog flow остаётся отдельным контуром и не является source of truth для BOLARS flow.
- Core Demo реализован: idle -> add product -> cart -> payment success -> receipt -> reset.
- Extended Demo gap fixes реализованы: staff actions, receipt-error resolution, edge-case toggle, idle timeout, SBP mock QR, Quick Branding field edits.
- Последняя проверка: `npm run typecheck`, `npm run test:run`, `npm run build`, `npm run visual:cards`, `npm run smoke:showcase-catalog` прошли.
- Тесты: 11 files / 43 tests.
- Product cards use demo HTTPS image URLs from `src/services/productImages.ts` with fallback initials if external images fail.
- Visual layout contract lives in `docs/product-ux/VISUAL_CONTRACTS.md`; avoid new fixed-width screen layouts without an explicit scroll/overflow contract.
- Desktop landscape uses a tablet-like centered stage via `--tablet-stage-max`; do not let customer flow stretch across the full monitor width.
- Product card contract is element-level: single/few cards should stay compact, with capped thumbnails, no full-width stretching, stronger depth shadow and pressed feedback on the add CTA.
- Catalog left panel uses floating category buttons with depth shadow, active-state and pressed feedback.
- Playwright external visual smoke is available: `npm run visual:cards`; it checks size, no unwanted body/content scroll, card/nav shadows and pressed transforms.
- Latest deployed visual change: BOLARS adaptive landscapeCompact refactor for start/cart/payment/final; use current branch head after deploy.
- Latest BOLARS viewport smoke: local Playwright metrics passed for `1366x768`, `1280x800`, `1920x1080`, `1080x1920`; post-public-smoke correction removed compact-landscape clipping on payment waiting/final/status bodies.
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
- Product image update: `docs/reports/2026-05-19/PRODUCT_IMAGE_ASSETS.report.md`.
- Visual contract: `docs/product-ux/VISUAL_CONTRACTS.md`.

## Safe Deploy Pattern

1. Run local checks: `npm run typecheck`, `npm run test:run`, `npm run build`.
2. Archive the checked commit.
3. Copy archive to `roman@192.168.7.64:/tmp/kassa-web.tar`.
4. Extract into `/opt/stacks/kassa-web`.
5. Run `docker compose --env-file .env.deploy up -d --build kassa-web`.
6. Smoke `https://kassa.speechbattle.com`.

## Known Remaining Manual Check

- Android Chrome physical camera permission/scan must still be checked on the actual tablet.
