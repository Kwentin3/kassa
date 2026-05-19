# Visual Contract Refactor Report

Дата: 2026-05-19  
Статус: implemented before deployment smoke

## Что исправлено

- Убран глобальный `body min-width: 1024px` и `min-height: 720px`.
- `Screen` больше не использует жесткий `w-screen/h-screen`; вместо этого применяет `.app-screen`.
- Добавлены именованные layout-контракты в `src/styles/index.css`.
- Cart, catalog, search, receipt, payment, help/staff, branding, idle и promo screens переведены на адаптивные containers.
- Сетки товаров используют `.product-grid` с `auto-fit/minmax`, поэтому карточки переносятся, а не уходят за экран.
- Основные длинные зоны получили явный vertical scroll через `.scroll-y`.
- Product image контейнер сохранён с aspect ratio `4 / 3`; image load/fallback не меняет размеры карточки.
- Кнопки и inputs получили более устойчивое поведение по ширине (`max-w-full`, `min-w-0`, wrap где нужно).

## Контракт

Основной документ: `docs/product-ux/VISUAL_CONTRACTS.md`.

Ключевое правило: новые экраны не должны добавлять случайные fixed `w-[...]`, `grid-cols-[...]`, `h-[calc(...)]` без явной причины. Если нужен новый layout, он должен иметь именованный CSS-контракт и определённую scroll-зону.

## Проверки

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 8 files / 24 tests.

Deployment/build smoke фиксируется после server deploy.
