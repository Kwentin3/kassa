# Work Header Icon Navigation

Date: 2026-05-25

## Scope

- Replaced the visible `Отменить покупку` work-header text button with an icon-only destructive cancel action.
- Added an icon-only neutral back action on `paymentSetup`.
- Kept payment-in-progress and final screens unchanged.
- No real backend, 1C, payment, SBP, KKT, fiscalization, CMS or update-flow integration was added.

## Contract

- Back and cancel are separate actions in `workHeader`.
- Back dispatches `returnToPurchase()` and is shown on `paymentSetup`.
- `returnToPurchase()` returns `paymentSetup -> cart` without clearing `cartLines`.
- If a modal is open, `returnToPurchase()` only closes the modal and keeps the underlying screen.
- Cancel dispatches `cancelPurchaseRequest()` and still opens confirmation when the cart is not empty.
- Icon-only actions keep accessible `aria-label` and `title` copy.

## Implementation

- `src/bolars/BolarsSelfCheckoutApp.tsx`: `WorkHeader` now renders icon-only back/cancel controls.
- `src/bolars/runtime/defaults.ts`: added `returnToCart` copy.
- `src/bolars/runtime/mockAdapter.ts`: updated `returnToPurchase` semantics for back vs modal close.
- `src/styles/index.css`: added stable icon-only header action dimensions for normal and compact landscape profiles.
- `src/bolars/runtime/__tests__/bolarsRuntime.test.ts`: covers `paymentSetup -> cart` back and modal-close-only behavior.
- `src/bolars/__tests__/bolarsApp.test.tsx`: covers icon-only header actions and returning to cart with cart preserved.

## Documentation Updated

- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`

## Verification

PowerShell, workspace `d:\Users\Roman\Desktop\Проекты\Витрина`.

- `npm run test:run -- src/bolars/runtime/__tests__/bolarsRuntime.test.ts`: passed, 16 tests.
- `npm run test:run -- src/bolars/__tests__/bolarsApp.test.tsx`: passed, 17 tests.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 12 files / 67 tests.
- `npm run build`: passed, including 1C HTML export verification and publish.
- `npm run visual:cards`: passed.
- `npm run smoke:1c-layout`: passed for start/cart/payment/final scenarios across `1628x823`, `1366x768`, `1280x800`, `1920x1080`, `1080x1920`; `maxOffBottom=0` for all rows.

## Notes

- No deployment was performed at report creation time; deployment is handled as the next delivery step.
