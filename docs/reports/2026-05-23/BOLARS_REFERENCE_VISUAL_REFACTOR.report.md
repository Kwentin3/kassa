# BOLARS Reference Visual Refactor Report

Дата: 2026-05-23
Статус: P0 reference visual refactor implemented after contract refine
Scope: BOLARS customer UI only, no runtime/business integration changes

## 1. Порядок выполнения

Сначала были уточнены visual contracts:

- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

Только после этого выполнен P0 visual refactor frontend, чтобы изменения ссылались на зафиксированные contract deltas.

## 2. Что изменено в UI

- Start screen:
  - добавлен black brand header с БОЛАРС logo и clock/date;
  - full-magenta hero заменён на light reference-style body;
  - добавлены scan hero, product side placeholders, scan/manual action cards;
  - добавлены text-scale card и help card.

- Cart screen:
  - scan/add card перенесён в основной flow над cart list;
  - product rows получили thumbnail/image slot fallback;
  - recent-change highlight переведён на cyan reference language;
  - right summary rail заменён на portrait bottom summary band;
  - help card видна в customer flow.

- Payment setup:
  - review card усилен product thumbnail rows and totals section;
  - package and discount blocks приведены ближе к reference hierarchy;
  - добавлен cyan final-total band;
  - `Оплатить` стал full-width bottom CTA.

- Payment waiting/error:
  - добавлен black brand header;
  - добавлены title/order, amount/order summary card;
  - добавлена central payment visual zone with terminal/card/phone fallback;
  - order preview получил thumbnail placeholders;
  - error state сохраняет recovery actions and order context.

- Final success:
  - solid magenta final заменён на light final body;
  - добавлены green success mark, receipt preview and countdown card/progress.

## 3. Что не менялось

- RuntimePort boundary не менялся.
- MockAdapter / PreviewAdapter / OneCInterfaceAdapter не менялись.
- UI по-прежнему dispatches typed commands and renders snapshots.
- UI не считает цены, скидки, totals, repeated scan или payment outcome.
- Не добавлялись real media delivery, KKT/fiscalization/OFD, Честный знак или real payment internals.
- Старый showcase/catalog flow не использовался как source of truth.

## 4. Проверки

Локальная среда: Windows PowerShell, branch `mvp/self-checkout-web-ui`.

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 11 files / 42 tests.
- `npm run build`: passed.
- Static hardcoded HEX check in `src/bolars` excluding `src/bolars/theme/**`: no matches.
- Static no manual JSON / textarea / upload / `window.Showcase` / `localStorage` in `src/bolars`: no matches.
- Static direct OneC adapter import scan: matches only runtime factory/webApi/tests, not UI screens/components.

## 5. Visual smoke

Local Playwright smoke at `1080x1920` confirmed:

- normal customer route has brand header, help card and no debug panel;
- cart flow shows `Добавить товар`, product row, thumbnail slot and bottom summary band;
- payment waiting preview shows amount card and payment visual;
- final success preview shows receipt preview and countdown card;
- checked screens had no horizontal overflow.

Temporary screenshots were generated under local temp only and were not committed.

## 6. Known visual limitations

- Product media uses generated visual slots/placeholders, not real BOLARS product bitmaps. This is intentional until media delivery is clarified.
- Payment illustration is CSS/vector fallback, not final bitmap art.
- Preview screenshots still include debug/preview overlays; final visual acceptance should use clean customer screenshots as required by the updated checklist.
- This is P0 composition alignment, not pixel-perfect final polish.
