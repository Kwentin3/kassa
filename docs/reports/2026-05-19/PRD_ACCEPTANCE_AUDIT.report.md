# PRD Acceptance Audit - Self-Checkout Terminal MVP

Дата: 2026-05-19  
Статус: Core Demo implemented and deployed

## Core Acceptance

- `idle -> add product -> cart -> payment success -> receipt -> reset`: реализовано через terminal state machine, cart store, `PaymentMockService` и `ReceiptScreen`.
- Добавление товара через mock scan/manual barcode: реализовано.
- Camera demo scanner: реализован через browser adapter и `html5-qrcode`; требует HTTPS/secure context.
- Fallback при ошибке камеры: mock input, keyboard scanner mode, manual search и catalog доступны.
- Manual search: реализован локальный поиск по name, brand, category, barcode, sku, packageSize, aliases и tags.
- Catalog: реализован плиточный каталог с категориями и popular/scenario products.
- Cart total: реализованы quantity, line sum, total, empty cart guard.
- Mock card payment success: реализовано.
- Mock receipt success: реализовано с mock receipt id, QR placeholder, items и total.
- Android tablet readiness: UI построен touch-first для landscape tablet; фактический Android device smoke не выполнялся.
- HTTPS domain: `https://kassa.speechbattle.com` открыт, TLS выпущен Let's Encrypt.

## Extended Acceptance

- Payment declined/timeout/connection/cancelled: реализованы как demo scenarios.
- SBP QR mock: реализован как mock payment scenario без реального QR/payment provider.
- Receipt failed after payment: реализован, выход ведет через help/staff.
- Help requested: реализовано.
- Staff mock mode: реализован с demo PIN и действиями staff.
- Remove item with staff: реализовано через staff action.
- Idle promotion screen: реализован с state guards и fallback при битом ассете.
- Quick branding: реализован как sales-demo mechanism, не production admin.
- Demo Control Panel: реализован и явно промаркирован `DEMO / Настройка прототипа`; во время `payment_pending` read-only/disabled.

## Optional / Deferred

- Mock loyalty: оставлено визуальным/fixture-level направлением, без реальной логики.
- Multi-language: не реализовано.
- PWA install prompt/service worker: не реализовано намеренно, чтобы не создать stale shell для демо.
- Advanced camera tuning: не выполнялось; camera scanner остается demo capability.
- Реальные backend/1C/payment/SBP/KKT/fiscalization integrations: не входят в MVP.

## Verification

- `npm install`: passed, reported 5 moderate dependency audit findings.
- `npm run typecheck`: passed.
- `npm run test:run`: passed.
- `npm run build`: passed.
- Local Docker build: not available in this Windows workspace by project constraint.
- Server Docker build/deploy: passed on `roman@192.168.7.64`.
- HTTPS smoke: passed.
- Cache headers smoke: passed.
- Android tablet smoke: not performed because no physical device was available to the agent.

## Secrets Check

- Real `.env` and `.env.deploy` are ignored by git.
- No SSH private keys, passwords, API tokens, payment credentials or production `.env` values were committed.
- `VITE_*` values are treated as public frontend config only.
