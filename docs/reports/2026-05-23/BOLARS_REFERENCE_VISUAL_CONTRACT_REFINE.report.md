# BOLARS Reference Visual Contract Refine Report

Дата: 2026-05-23
Статус: visual contracts refined before UI refactor
Scope: documentation only, no frontend refactor

## 1. Причина

После сравнения текущего prototype MVP с raster reference sketches стало ясно, что реализация функционально проходит scan-first flow, но визуально ближе к рабочему wireframe, чем к БОЛАРС kiosk reference.

Владелец продукта уточнил порядок: сначала адаптировать, уточнить и детализировать визуальные контракты, и только потом делать refactor. Поэтому этот этап фиксирует расхождения и refactor targets в документах, без изменений frontend-кода.

## 2. Проанализированные референсы

Источник:

`D:\Users\Roman\Desktop\Эскизы для терминала кассы самообслуживания\тема боларс`

Файлы:

- `стартовый экран 23 мая 2026 г., 10_05_21 (1).png`
- `корзина  23 мая 2026 г., 10_05_21 (2).png`
- `подтверждение заказа 23 мая 2026 г., 10_05_21 (3).png`
- `оплата  23 мая 2026 г., 10_05_21 (4).png`
- `завершение  23 мая 2026 г., 10_05_21 (5).png`

Текущие screenshots реализации использовались как comparison evidence:

`docs/reports/2026-05-23/bolars-implementation-evidence/`

## 3. Главные выводы по расхождениям

### Start

Reference строится на black brand header, light textured body, крупной scan-инструкции, scanner brackets/barcode visual, двух action cards, отдельном text-scale card и help card.

Текущий MVP использует full-magenta hero и компактные кнопки. Это функционально понятно, но композиционно не повторяет reference.

### Cart

Reference cart - это portrait kiosk work screen: search, scan continuation card, product rows with image slots, bottom summary band and help. Текущий MVP больше похож на desktop/workbench layout с right summary rail и text-heavy rows.

Ключевой refactor target: product image slot, cyan recent-change language, bottom summary band, visible scan/add continuation card.

### Payment Setup

Reference payment setup выглядит как order confirmation: review card with product rows, package cards, discount/bonus card, cyan final-total band and full-width green payment CTA.

Текущий MVP работает, но выглядит как простая список/панель. Нужно усилить hierarchy итогов, пакетов, скидки и bottom CTA.

### Payment Waiting / Error

Reference waiting screen имеет brand header, top amount card, large central payment terminal/card visual, order preview and recovery actions for error. Текущий MVP похож на generic centered status card.

Ключевой refactor target: top amount/order card, central payment visual zone, compact order preview, error recovery cards.

### Final

Reference final screen light, with black brand header, green success mark, large thank-you, receipt preview and countdown progress card. Текущий MVP использует solid magenta background with centered card.

Ключевой refactor target: light final composition, receipt preview, countdown card/progress.

## 4. Обновлённые документы

- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
  - status raised to `draft 0.2`;
  - added refactor-first rule;
  - added `Reference Fidelity Delta Before UI Refactor`;
  - added P0/P1/P2 visual priorities;
  - documented screen-by-screen deltas.

- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
  - status raised to `draft 0.2`;
  - added clean screenshot rule;
  - added `Reference Fidelity Refactor Notes`;
  - specified required zones for start/cart/payment setup/payment waiting/error/final.

- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
  - status raised to `draft 0.2`;
  - added missing reference-fidelity token groups:
    - header/clock;
    - product image slots;
    - bottom summary/sticky CTA;
    - scan action/scanner visual;
    - payment visual;
    - receipt/countdown;
    - help card.

- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
  - status raised to `draft 0.2`;
  - added `Reference Fidelity Gate`;
  - added clean customer screenshot requirement;
  - added evidence requirement mapping implementation changes to visual contract section 18 and screen spec section 14.

## 5. Что зафиксировано как P0 перед refactor

- Restore black brand/work headers according to screen family.
- Stop using full magenta as generic body background where reference uses light body.
- Preserve product image slots in cart/payment rows.
- Use bottom summary/CTA band for portrait cart/payment instead of right-rail-first composition.
- Add reference-level payment waiting visual: amount card, central payment terminal/card zone, order preview.
- Add final receipt/countdown composition.
- Keep all of the above behind theme tokens and RuntimePort snapshot rendering.

## 6. Что не менялось

- Frontend code was not changed.
- RuntimePort contract was not changed.
- MockAdapter, PreviewAdapter and OneCInterfaceAdapter were not changed.
- Product scope was not expanded.
- No media delivery, real payment internals, KKT/fiscalization/OFD or Честный знак design was added.
- Old showcase/catalog flow remains out of source of truth for BOLARS MVP.

## 7. Refactor sequencing recommendation

Next implementation/refactor should proceed in this order:

1. Token expansion for new reference-fidelity groups.
2. Clean screenshot capture path without debug/preview overlays.
3. Start screen composition.
4. Cart row anatomy + bottom summary band.
5. Payment setup review/packages/discount/CTA hierarchy.
6. Payment waiting/error visual anatomy.
7. Final receipt/countdown screen.
8. Visual acceptance screenshots against the new gate.

This keeps the work conservative: contracts first, then screen refactor against explicit deltas.
