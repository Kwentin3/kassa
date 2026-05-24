# BOLARS 1C Visual Contract Refinement Report

Дата: 2026-05-24
Статус: visual contracts refined, implementation not changed

## Задача

Уточнить визуальные контракты BOLARS MVP так, чтобы следующая правка верстки была ориентирована на фактический браузер 1С/V8WebKit, а не только на обычный modern browser.

## Вывод

Починка белой страницы закрыла runtime/JS compatibility problem: 1C-safe HTML начал загружать приложение. Текущий дефект на скриншоте относится к другому слою: visual/layout compatibility inside 1C HTML field.

Основная причина разъезда: 1C-вариант унаследовал web/tablet stage framing and modern CSS assumptions:

- centered stage with max width creates white side gutters in a wider 1C host field;
- critical layout uses viewport units and nested overflow;
- CTA/summary patterns allowed sticky-like thinking;
- cart rows use dense grid/fixed columns;
- heavy shadows/color effects render differently in V8WebKit.

## Изменённые документы

- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/product-ux/VISUAL_CONTRACTS.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/integrations/1c-html-shell/runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`

## Что зафиксировано

- Введён строгий `embeddedOneC` visual/composition profile.
- 1C route должен использовать host-fill stage, а не desktop centered max-width.
- `100dvh` больше не считается достаточным единственным sizing primitive for 1C.
- `position: sticky` запрещён для customer-critical CTA/help/summary in 1C.
- CSS Grid допустим осторожно, с safe layout/fallback для critical zones.
- Heavy shadows, glow, gradients and `color-mix` are enhancement; 1C profile requires static colors/borders/light elevation fallback.
- 1C acceptance теперь требует clean screenshots and metrics for the 1C-safe artifact, including current diagnostic viewport `1628x823`.

## Следующий implementation slice

Кодовые правки должны ссылаться на обновлённые пункты контрактов:

1. Сделать 1C-specific layout profile/class for `/bolars/self-checkout-mvp-1c.html`.
2. Убрать centered max-width/gutters в 1C route.
3. Перевести CTA/summary в reserved layout zone without sticky dependency.
4. Упростить cart row layout for V8WebKit.
5. Добавить static color/light-elevation fallback for 1C.
6. Проверить start/cart/payment setup/payment waiting/payment error/final на `1628x823`, `1366x768`, `1280x800`.

## Scope guard

Реальная 1С, оплата, РМК, ККТ, фискализация, маркировка и backend не добавлялись. Это только документационный refine визуального и runtime-совместимого контракта.
