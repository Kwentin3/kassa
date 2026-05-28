# KioskRunner / 1C Handoff / Debug Entrypoint Docs Closeout

Дата: 2026-05-28

Статус: PASSED

## Цель

Закрыть документационный эпик KioskRunner после проверки delivery/runtime контура:

- GitHub Actions публикует BOLARS showcase bundle;
- GitHub Pages отдаёт production manifest;
- KioskRunner скачивает manifest по `registryUrl`;
- KioskRunner скачивает immutable `bundle.zip`;
- KioskRunner проверяет SHA-256;
- KioskRunner разворачивает `current`;
- KioskRunner отдаёт витрину через `http://127.0.0.1:8787/kiosk/bolars/`;
- KioskRunner установлен как Windows Service;
- service `StartupType=Automatic`;
- service autoupdate loop сам обновляет витрину при новой production-версии;
- PowerShell Manager MVP реализован.

## Обновлённые Документы

### Главный KioskRunner handoff

Файл:

```text
docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md
```

Изменения:

- добавлен короткий вход для внедренца;
- добавлена ссылка на простой документ `HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md`;
- простыми словами объяснено, что KioskRunner - локальная Windows-служба;
- объяснено, что служба скачивает витрину с GitHub Pages, проверяет bundle и отдаёт localhost URL;
- зафиксировано, что после перезагрузки служба должна стартовать сама;
- зафиксировано, что service autoupdate сам проверяет production manifest;
- расширен troubleshooting для `manage-kioskrunner.ps1`, service status, registry check, `currentVersion`, `servedVersion`, `/healthz`, `/runner/status`, logs.

### Существующий BOLARS 1C handoff

Файл:

```text
docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md
```

Изменения:

- существующая точка входа из debug UI сохранена;
- добавлен короткий блок `KioskRunner: Локальный Запуск Витрины`;
- добавлена ссылка на простой KioskRunner handoff;
- документ не превращён в ops-runbook: основной BOLARS bridge handoff оставлен как есть.

### Packaging README

Файл:

```text
packaging/README.md
```

Изменения:

- добавлен блок `For 1C Implementer / Quick Local Launch`;
- добавлены шаги:
  - copy `config.example.json` to `config.json`;
  - run `manage-kioskrunner.ps1`;
  - install service;
  - start service;
  - check registry;
  - update now;
  - open showcase;
  - run `post-reboot-smoke.ps1` after reboot;
- повторно зафиксировано, что 1С получает только stable localhost URL.

### Domain README

Файл:

```text
docs/integrations/1c-html-shell/kiosk-runner/README.md
```

Изменения:

- добавлен раздел `For Implementers / Quick Entrypoints`;
- добавлены ссылки на:
  - `HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md`;
  - `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`;
  - `RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md`;
  - `RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`;
- новый простой handoff добавлен в таблицу документов.

## Новый Документ

Создан:

```text
docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md
```

Назначение:

- короткий документ на 2-4 экрана для 1С-программиста, внедренца и администратора киоска;
- без глубоких деталей GitHub Actions, bundle internals, current switch и service loop.

Содержит:

- что такое KioskRunner;
- что делает KioskRunner;
- что KioskRunner не делает;
- где скачать runner;
- быстрый запуск через `manage-kioskrunner.ps1`;
- признаки успешной установки;
- что происходит после перезагрузки;
- какую ссылку дать 1С;
- troubleshooting table.

Ключевой URL для 1С:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

## Release URL

Проверка `gh release list --repo Kwentin3/kassa --limit 20` не вернула опубликованных GitHub Releases.

Поэтому в простом handoff оставлен явный TODO:

```text
TODO: вставить официальный release URL после публикации KioskRunner-win-x64.zip.
```

Локальная папка `artifacts/` не указана как production-источник для внедренца.

## Debug Entrypoint

Найден debug entrypoint:

```text
src/bolars/BolarsSelfCheckoutApp.tsx
```

До изменения debug panel имела ссылку:

```text
1C handoff -> docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md
```

Что сделано:

- существующая ссылка `1C handoff` сохранена;
- добавлена короткая отдельная ссылка:

```text
KioskRunner local launch
```

Она ведёт на:

```text
docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md
```

Runtime-поведение кассы не менялось. Изменён только debug help entrypoint.

Тест обновлён:

```text
src/bolars/__tests__/bolarsApp.test.tsx
```

Он теперь проверяет, что debug panel содержит ссылку на простой KioskRunner handoff.

## Sticky Comments

Отдельных sticky comments в runtime-коде для KioskRunner не найдено.

Существующая sticky/context документация проекта не переписывалась.

Обновлена только debug panel ссылка и handoff-документы.

## Проверки

Команды:

```powershell
npm run test:run -- src/bolars/__tests__/bolarsApp.test.tsx
npx vitest run src/bolars/__tests__/bolarsApp.test.tsx --exclude artifacts/**
npm run typecheck
```

Результаты:

- первый `npm run test:run -- src/bolars/__tests__/bolarsApp.test.tsx` запустил две копии теста: актуальную `src/...` и старую audit-копию под `artifacts/...`;
- актуальная `src/...` копия прошла;
- старая audit-копия под `artifacts/...` упала с `React is not defined`, что не относится к изменённому рабочему коду;
- повторный запуск с `--exclude artifacts/**` прошёл;
- `npm run typecheck` прошёл.

Финальная проверка актуального кода:

```text
npx vitest run src/bolars/__tests__/bolarsApp.test.tsx --exclude artifacts/**
1 file passed, 17 tests passed
```

Typecheck:

```text
npm run typecheck
passed
```

## Что Не Менялось

- KioskRunner core не менялся.
- KioskRunner service/update loop не менялся.
- PowerShell Manager scripts не менялись.
- 1С bridge contract не менялся.
- Runtime business behavior кассы не менялся.
- Реальная 1С, backend, payment, KKT, fiscalization, scanner, marking не подключались.
- Update-server, fleet dashboard, telemetry, auth/private registry не добавлялись.

## Итоговая Точка Входа Для 1С

Для простого локального запуска:

```text
docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md
```

Для bridge-интеграции HTML ↔ 1С:

```text
docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md
```

В debug panel теперь доступны обе ссылки:

```text
1C handoff
KioskRunner local launch
```

## Future

- Опубликовать официальный `KioskRunner-win-x64.zip` в GitHub Releases или другом утверждённом release location.
- Заменить TODO в handoff на конкретный release URL.
- При необходимости позже внедрить `.NET Manager GUI`; текущий field-trial путь остаётся PowerShell Manager.
- После публикации release URL обновить packaging README и простой handoff.
