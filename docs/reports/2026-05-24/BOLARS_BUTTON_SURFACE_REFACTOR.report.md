# BOLARS Button Surface Refactor

Дата: 2026-05-24

## Статус

Implemented and locally verified.

## Scope

- Customer-facing BOLARS button surfaces now use a centralized CSS contract.
- Refactor is CSS-only for runtime behavior: no backend, 1C, payment, SBP, KKT, fiscalization, CMS or update-flow was added.
- Existing semantic `button`, `input`, `select` structure remains unchanged.
- Legacy showcase/catalog flow was checked separately and remains separate from BOLARS flow.

## Changes

- Added centralized BOLARS button surface tokens in `src/styles/index.css`.
- Added centralized selector block: `Central BOLARS button-surface contract`.
- Covered roles: start cards, primary/info/secondary/danger actions, scan action, search candidates, package buttons, quantity/delete controls, phone apply action, numpad keys and text-scale micro-feedback.
- Normal state now has a filled surface darker or more tonally distinct than the parent surface.
- Pressed state reduces shadow and applies a short depression transform.
- Hover lift is limited to pointer devices.
- Disabled state is explicit and de-emphasizes shadow/texture.
- Reduced-motion keeps surface contrast but removes transform transitions.
- Added visual contract test coverage in `src/tests/visual-contract.test.ts`.

## Verification

PowerShell, workspace `d:\Users\Roman\Desktop\Проекты\Витрина`.

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 11 files / 52 tests.
- `npm run build`: passed.
- Local Playwright BOLARS button surface smoke on production preview: passed.
- `npm run smoke:showcase-catalog` on local production preview: passed.
- `npm run visual:cards` on local production preview: passed.

## UI Integrity Evidence

- Problem: customer-facing touch elements must read as buttons without relying only on outline.
- Primary user action: scan/add products, change quantity, go to payment, pay, recover from error.
- States covered: normal, hover, pressed, disabled, focus-visible and reduced-motion; terminal app states remain start/cart/search/payment/final/modal from runtime snapshot.
- Boundary: UI still renders runtime snapshot and emits typed commands; no business decision moved into CSS or components.
- Feedback: immediate visual press feedback is local CSS; terminal feedback remains runtime state, messages, modal, payment and final screens.

## Deployment

Pending at report creation; final deployment smoke is recorded in sticky context after server rollout.

