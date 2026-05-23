# BOLARS Text Scale Header Refactor

Дата: 2026-05-23

## Что изменено

- Переключатель размера текста закреплён в верхней чёрной шапке на start/work/status screens.
- Нижняя text-scale карточка стартового экрана убрана, чтобы не конкурировать с корзиной, CTA и help-зонами.
- Визуальный control теперь состоит из трёх контрастных букв `A` разного размера без видимой подписи.
- `normal/large/extraLarge` применяются через semantic CSS scale variables к start hero, товарным строкам, totals, CTA, payment/status copy, modal и numpad copy.

## Почему так

Нижняя зона уже несёт кассовый контекст: корзина, итог, CTA, help и состояния оплаты. Text-scale control там создаёт визуальный шум и риск перекрытия/вытеснения важных действий. Чёрная шапка постоянна, контрастна и лучше подходит для служебного accessibility-control.

## Архитектурная граница

UI по-прежнему только dispatches `setTextScale` через `SelfCheckoutRuntimePort` и рендерит authoritative snapshot. Бизнес-логика, корзина, цены, скидки и payment outcome не перенесены в UI.

## Обновлённые документы

- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/infra-ops/STICKY_CONTEXT.md`

## Проверки

- `npm run typecheck` passed.
- `npm run test:run` passed: 11 files / 46 tests.
- `npm run build` passed.
- `npm run visual:cards` passed.
- `npm run smoke:showcase-catalog` passed.
- Local browser smoke via Playwright passed on `1366x768`, `1280x800`, `1080x1920`:
  - start screen has exactly one text-scale control in `brandHeader`;
  - no `.bolars-start-scale-card`;
  - `A` buttons render with different sizes (`15/22/32px` in compact landscape, `17/24/36px` in portrait);
  - start hero text increases from normal to `extraLarge`;
  - cart/paymentWaiting/final keep text-scale control in the header;
  - no horizontal or vertical body overflow in checked viewports.
- Production preview browser smoke on `1366x768` passed:
  - start: one header text-scale control, no old start text-scale card;
  - `extraLarge` increases start `h1` from `41.472px` to `47.616px`;
  - cart keeps one work-header control and CTA font is controlled by the semantic scale (`25.53px`);
  - no horizontal or vertical overflow.
- Production preview matrix passed: 18 preview scenarios × 3 viewports (`1366x768`, `1280x800`, `1080x1920`) = 54 checks, 0 failures. Each scenario had exactly one header text-scale control, no old start text-scale card, unequal `A` button sizes, and no body overflow.
