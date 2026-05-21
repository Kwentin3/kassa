# 1C HTML Shell Slice 2 Copy Refactor Report

Дата: 2026-05-21
Статус: реализовано, задеплоено

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
- Деплой на `kassa-web`: passed.
- Public smoke `https://kassa.speechbattle.com/diagnostics/1c-html-shell?mode=diagnostic`: passed.
- Public smoke диагностика -> витрина -> диагностика с сохранением `runId`: passed.

## Следующий шаг

Следующий содержательный шаг - реализовывать/проверять настоящий Slice 2 Diagnostic Loader в целевой 1С-среде. Текущий деплой только уточняет формулировки и не подключает РМК, оплату, ККТ или фискализацию.
