# 1C HTML Shell Slice 2 Copy Refactor Report

Дата: 2026-05-21
Статус: готово к деплою

## Что изменено

- На диагностической странице уточнен блок для 1С-специалиста: Slice 2 описан как отдельный периметрный диагностический адаптер для проверки обмена HTML -> 1С -> HTML.
- Статус `bridge.status` в JSON теперь объясняет факт точнее: `Slice 2 Diagnostic Loader не подключён`, а не смешивает это с Slice 1.
- В guide для 1С-специалиста добавлена явная последовательность: Slice 1 = baseline HTML-render, Slice 2 = двусторонний диагностический обмен.
- В README source-пакета loader-а и handoff-документах минимальный успех уточнен как `diag.ping` round-trip с тем же `requestId`.
- В BSL-комментариях loader-а закреплена граница: это не касса и не РМК-адаптер, а диагностический адаптер для `diag.*`.

## Что осталось без изменений

- Runtime-логика Slice 1 не расширялась.
- Реальный 1С Diagnostic Loader не подключался к production.
- РМК, чек, оплата, ККТ, фискализация, печать и маркировка не затрагивались.

## Проверки

- `node --check` для inline script диагностической страницы: passed.
- `npm run typecheck`: passed.
- `npm run test:run`: passed, 9 files / 26 tests.
- `npm run build`: passed.
- `npm run visual:cards`: passed.
- Локальный Playwright smoke diagnostic page: passed.

## Следующий шаг

После деплоя проверить публичный URL `/diagnostics/1c-html-shell?mode=diagnostic` и убедиться, что новый блок Slice 2 виден на странице и в JSON.
