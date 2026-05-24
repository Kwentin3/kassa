# BOLARS Search Keyboard and Phone Numpad

Дата: 2026-05-24  
Статус: implemented, locally verified, ready for deployment

## Scope

- Cart search now opens a UI-owned on-screen touch keyboard.
- Search keyboard supports RU/EN layouts, digits, space, clear, backspace and close.
- Search still dispatches `searchProducts(query)` only after `uiConfig.searchMinLength=4`.
- Search keyboard closes on explicit close, candidate selection, `Escape`, or touch outside the search surface.
- Payment phone input now opens a central UI-owned numeric numpad modal.
- Phone display and submitted discount payload use fixed Russian `+7` formatting for local digits, for example `9001234567` -> `+7 900 123 45 67`.
- Existing runtime commands remain unchanged: `searchProducts`, `selectSearchCandidate`, `applyDiscountByPhone`.

## Documentation Updated

- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/infra-ops/STICKY_CONTEXT.md`

## Verification

Local shell: Windows PowerShell, workspace `d:\Users\Roman\Desktop\Проекты\Витрина`.

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 11 files / 55 tests.
- `npm run build`: passed.
- Local Playwright BOLARS smoke: passed for search keyboard open/input/candidate-close and phone numpad `+7` display/apply.
- `npm run visual:cards`: passed.
- `SHOWCASE_SMOKE_URL=http://127.0.0.1:4174/diagnostics/1c-html-shell/index.html?... npm run smoke:showcase-catalog`: passed.

## Notes

- No real backend, 1C, payment, SBP, KKT, fiscalization or CMS integration was added.
- Phone numpad visibility remains UI-owned and is not added to runtime `ModalState`.
- Search keyboard visibility remains UI-owned; runtime keeps only search query/state.
