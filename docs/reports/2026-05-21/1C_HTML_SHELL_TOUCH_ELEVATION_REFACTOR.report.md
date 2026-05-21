# 1C HTML Shell Touch Elevation Refactor Report

Дата: 2026-05-21
Статус: реализовано, задеплоено и проверено на публичном URL

## Что изменено

- Для showcase runtime добавлен единый touch elevation слой: активные карточки, кнопки, категории и клавиши имеют lift/press feedback через `box-shadow`, `transform` и короткий transition.
- `ProductCard` в showcase стала нажимаемой поверхностью: карточка добавляет mock-товар по click/Enter/Space и не требует touch/pointer events.
- Disabled/busy состояния визуально приглушены и не выглядят как обычные нажимаемые поверхности.
- PRD, Blueprint, Runtime Capability Contract, общий Visual Contract и Smoke Checklist обновлены новым контрактом сенсорного отклика.

## Границы

- Реальная кассовая логика не добавлялась.
- РМК, чек, оплата, ККТ, фискализация, печать и маркировка не подключались.
- React/Vite runtime не добавлялся в 1C HTML Shell diagnostic/showcase artifact.
- Touch/pointer events не стали обязательной зависимостью.

## Проверки

- Inline diagnostic/showcase script `node --check`: passed.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 9 files / 26 tests.
- `npm run build`: passed.
- `npm run visual:cards`: passed.
- Local Playwright smoke, landscape: product card lift/press, category press, card click add, no horizontal scroll: passed.
- Local Playwright smoke, portrait: product card press, no horizontal scroll, cart sheet, keyboard key press: passed.
- Public URL `https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=showcase`: HTTP 200.
- Public Playwright smoke: diagnostic → showcase → diagnostic navigation, landscape lift/press, portrait lift/press, cart sheet, keyboard, no global horizontal scroll: passed.

## Осталось проверить вручную

- Реальный touch terminal / 1C V8WebKit: фактическая тактильная эргономика, задержка pressed-state, размер пальца, отсутствие hover-залипания.
