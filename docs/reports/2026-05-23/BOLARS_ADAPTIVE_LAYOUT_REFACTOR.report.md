# BOLARS Adaptive Layout Refactor

Дата: 2026-05-23
Статус: implemented locally, tested before deploy

## Что изменено

Реализован frontend refactor под adaptive viewport contract для BOLARS Self-Checkout MVP.

Основные изменения:

- `src/styles/index.css`
  - добавлены BOLARS adaptive CSS variables for stage, headers, spacing, cards, scanner, cart rows, payment visual, final receipt/countdown;
  - добавлен `@media (orientation: landscape) and (max-height: 1100px)` как practical `landscapeCompact/landscapeKiosk` implementation;
  - start/cart/payment setup/payment waiting/payment error/final больше не используют portrait-sized vertical layout в landscape;
  - payment setup перестраивается в two-column composition: order review слева, packages/discount/total/pay справа;
  - cart keeps search/add scan/product/summary visible, product details scroll inside list when needed;
  - payment/final media zones scale down before primary status/CTA zones;
  - alerts on payment waiting/final move away from countdown/status content.
- `src/bolars/BolarsSelfCheckoutApp.tsx`
  - root получает `bolars-screen-${currentScreen}` class only for presentation-specific responsive styling.
- `src/tests/visual-contract.test.ts`
  - добавлен observable CSS contract test for height-aware BOLARS landscape adaptation.

## Что не менялось

- RuntimePort command/snapshot contract не менялся по бизнес-смыслу.
- MockAdapter/PreviewAdapter/OneCInterfaceAdapter business behavior не менялся.
- Cart totals, discounts, repeated scan, payment outcome по-прежнему принадлежат runtime/adapters.
- Старый showcase/catalog flow не переносился и не использовался как source of truth.
- Честный знак, ККТ/fiscalization/OFD, media delivery and real payment internals не добавлялись.

## Viewport Metrics

Локальный Playwright smoke against Vite dev server checked:

- `1366x768`
- `1280x800`
- `1920x1080`
- `1080x1920`

Screens checked:

- start
- cart
- payment setup
- payment waiting
- payment error
- final success

Result:

- `scrollHeight == clientHeight` for checked customer screens.
- `horizontalOverflow=false`.
- critical selectors had no `offBottom`/`offRight` offenders.

Evidence folder:

```text
%TEMP%/bolars-adaptive-refactor-local/
%TEMP%/bolars-adaptive-refactor-local-2/
```

These files are local temporary evidence, not committed artifacts.

## Tests and Checks

Shell: Windows PowerShell.

Executed:

- `npm run typecheck` - passed.
- `npm run test:run` - passed, 11 files / 43 tests.
- `npm run build` - passed.
- `npm run visual:cards` - passed.
- `npm run smoke:showcase-catalog` - passed.
- BOLARS static HEX scan outside theme config - no matches.
- BOLARS manual JSON/file upload/window.Showcase/localStorage scan - no matches.
- Direct concrete adapter import scan from BOLARS UI layer - no matches.

## UI Integrity Notes

- Problem solved: landscape viewport height no longer pushes primary customer actions below the first viewport.
- Primary user actions remain explicit:
  - start: scan/manual search;
  - cart: add/scan product and go to payment;
  - payment setup: pay;
  - waiting: apply card to terminal;
  - error: retry/return;
  - final: countdown reset.
- States remain rendered from `SelfCheckoutStateSnapshot`.
- UI still dispatches typed commands only.
- CSS refactor did not introduce UI-owned price/totals/payment logic.

## Remaining Manual Checks

- Physical Android tablet smoke is still recommended.
- Exact 1C WebView rendering should be checked by 1C specialist when available.
- If real media delivery is later introduced, product/payment visual slots should be retested in landscape.
