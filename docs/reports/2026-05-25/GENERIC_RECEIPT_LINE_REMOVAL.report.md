# Generic Receipt Line Removal

Date: 2026-05-25

## Scope

- Unified receipt line removal for products, packages and future removable runtime lines.
- Customer UI delete action is now available both in cart rows and payment setup order review.
- No real backend, 1C, payment, SBP, KKT, fiscalization, CMS or update-flow integration was added.

## Contract

- `removeCartLine({ lineId })` is the only removal command.
- UI renders state and dispatches the typed command; it does not remove lines or recalculate totals locally.
- Runtime removes the matching `cartLines[]` entry and recalculates `cart`, `totals`, `paymentState.amount` and order/receipt preview data through the next snapshot.
- Removal from `cart` keeps the user on `cart`.
- Removal from `paymentSetup` keeps the user on `paymentSetup` while lines remain.
- Removing the last line returns to empty `cart` with `cart.canGoToPayment=false`.
- Removal is not available once the cart is locked for payment.

## Implementation

- `src/bolars/runtime/mockAdapter.ts`: `removeCartLine` now preserves the current editable screen and recalculates via `recalculateSnapshot`.
- `src/bolars/BolarsSelfCheckoutApp.tsx`: payment setup order review uses `PaymentReviewLine` with the same `removeCartLine(lineId)` command as cart rows.
- `src/styles/index.css`: payment review lines reserve a stable delete-button column and mobile/compact rules keep the control visible.
- `src/bolars/runtime/__tests__/bolarsRuntime.test.ts`: covers product/package removal through the same command, totals recalculation and last-line empty-cart behavior.
- `src/bolars/__tests__/bolarsApp.test.tsx`: covers payment setup delete action, screen preservation and payable update.

## Documentation Updated

- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`

## Verification

PowerShell, workspace `d:\Users\Roman\Desktop\Проекты\Витрина`.

- `npm run test:run -- src/bolars/runtime/__tests__/bolarsRuntime.test.ts`: passed, 15 tests.
- `npm run test:run -- src/bolars/__tests__/bolarsApp.test.tsx`: passed, 16 tests.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 12 files / 65 tests.
- `npm run build`: passed, including 1C HTML export verification and publish.
- `npm run visual:cards`: passed.
- `npm run smoke:1c-layout`: passed for start/cart/payment/final scenarios across `1628x823`, `1366x768`, `1280x800`, `1920x1080`, `1080x1920`; `maxOffBottom=0` for all rows.

## Notes

- One initial UI assertion was too broad because the totals block legitimately contains `Пакеты 0 ₽` after package removal. The test was corrected to assert only payment review item rows.
- No deployment was performed.
