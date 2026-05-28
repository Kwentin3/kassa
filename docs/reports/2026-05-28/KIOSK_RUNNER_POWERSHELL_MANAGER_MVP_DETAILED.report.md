# KioskRunner PowerShell Manager MVP - Detailed Report

Дата: 2026-05-28

Статус: READY_WITH_NOTES

## 1. Краткое резюме

Для KioskRunner реализован бюджетный PowerShell Manager-слой вместо отдельного `.NET GUI Manager`.

Цель слоя - дать внедренцу простой операционный UX:

- увидеть, установлена ли служба;
- увидеть, запущена ли служба;
- проверить `StartupType=Automatic`;
- проверить `registryUrl`, manifest и bundle;
- установить/запустить/остановить/перезапустить/удалить службу;
- выполнить безопасный `update now`;
- выполнить rollback;
- открыть витрину, health/status endpoints, logs и config;
- выполнить post-reboot smoke check.

KioskRunner core не менялся. Скрипты управляют уже существующими возможностями runner-а и Windows Service.

## 2. Почему выбран PowerShell Manager, а не .NET GUI

На текущем этапе нужен не полноценный продуктовый GUI, а дешёвый и проверяемый ops-слой для field trial.

PowerShell выбран как MVP default по нескольким причинам:

1. Он нативен для Windows-внедрения.

   KioskRunner живёт на Windows-узле рядом с 1С Web. У администратора или внедренца PowerShell уже есть в системе. Не нужно тащить новый desktop UI stack, разбираться с WinForms/WPF, publish-профилями GUI и отдельным lifecycle приложения.

2. Он хорошо подходит для управления Windows Service.

   Установка, запуск, остановка, проверка `Get-Service`, `Get-CimInstance Win32_Service`, `Start-Service`, `Stop-Service`, `sc.exe failure` - это естественные операции PowerShell. Делать это через GUI на MVP означало бы написать обёртку поверх тех же команд.

3. Он не меняет KioskRunner core.

   Все update/rollback/serve сценарии уже есть в `KioskRunner.exe`. PowerShell слой только вызывает CLI и читает локальные endpoints. Это снижает риск регрессии в уже принятом runner RC.

4. Он быстрее закрывает field-trial UX.

   Внедренцу нужен понятный маршрут: распаковал zip, поправил `config.json`, запустил manager script, поставил службу, запустил, обновил, открыл витрину. PowerShell даёт этот маршрут без разработки отдельного GUI-процесса.

5. Он сохраняет будущий путь к .NET GUI.

   Скрипты не создают новый домен и не меняют контракты. В будущем `KioskRunner.Manager.exe` сможет использовать те же внешние точки управления: Windows Service, CLI, `/healthz`, `/runner/status`, logs и config.

6. Он честно ограничен.

   PowerShell Manager не становится backend-ом, update-server-ом, fleet dashboard-ом или telemetry-агентом. Он работает локально на конкретной машине.

## 3. Архитектурная граница

### Что делает KioskRunner

KioskRunner остаётся владельцем runtime/delivery lifecycle:

- читает `config.json`;
- читает `registryUrl`;
- скачивает production manifest;
- скачивает immutable `bundle.zip`;
- проверяет SHA-256;
- распаковывает bundle;
- переключает `current`;
- ведёт `state.json` и logs;
- отдаёт static HTML через embedded web server;
- отдаёт `/healthz`;
- отдаёт `/runner/status`;
- выполняет rollback.

### Что делает PowerShell Manager

PowerShell слой:

- управляет одной Windows Service;
- вызывает готовые CLI-команды runner-а;
- читает config;
- читает service metadata;
- читает локальные health/status endpoints;
- открывает URL/папки/файлы для оператора;
- помогает выполнить безопасный manual update.

### Что PowerShell Manager не делает

Скрипты не реализуют update lifecycle самостоятельно:

- не распаковывают bundle;
- не переключают `current`;
- не пишут `state.json`;
- не валидируют manifest как source of truth;
- не заменяют SHA-256 проверку runner-а;
- не читают GitHub branch/main/dist;
- не делают `git pull`;
- не скачивают HTML напрямую из source repo;
- не принимают бизнес-команды;
- не работают с корзиной, продажей, оплатой, чеком, ККТ или фискализацией;
- не подключают 1С;
- не меняют HTML <-> 1С bridge.

## 4. Итоговый набор скриптов

### `packaging/manage-kioskrunner.ps1`

Главный интерактивный menu-script.

Меню:

```text
[1]  Show status
[2]  Install service
[3]  Start service
[4]  Stop service
[5]  Restart service
[6]  Update now
[7]  Rollback
[8]  Check registry
[9]  Open showcase
[10] Open health
[11] Open runner status
[12] Open logs folder
[13] Open config file
[14] Uninstall service
[15] Post-reboot smoke check
[0]  Exit
```

Назначение:

- дать один входной файл для внедренца;
- спрятать отдельные команды за меню;
- показывать понятные предупреждения перед опасными действиями;
- не смешивать CLI runner-а с ручными Windows-командами.

Ключевые решения:

- `Stop service` требует подтверждения `STOP`;
- `Update now` при запущенной службе предлагает safe mode;
- `Rollback` требует подтверждения `ROLLBACK`;
- `Uninstall service` передаётся в отдельный uninstall script;
- после start/restart/update/rollback показывается актуальный status.

Почему так:

- внедренец не обязан помнить точные команды;
- опасные действия требуют явного намерения;
- manual update не конфликтует с service update loop, потому что safe mode временно останавливает службу.

### `packaging/kioskrunner-common.ps1`

Общая библиотека для остальных скриптов.

Содержит:

- резолвинг путей config/exe;
- чтение `config.json`;
- вычисление service name;
- получение информации о Windows Service;
- извлечение config path из service `PathName`;
- сборку local showcase URL;
- сборку `/healthz` URL;
- сборку `/runner/status` URL;
- HTTP JSON helper;
- wrapper для вызова `KioskRunner.exe`;
- построение единой status-модели;
- печать status summary.

Почему вынесено отдельно:

- чтобы не дублировать парсинг config и service logic в каждом скрипте;
- чтобы status, manager, smoke и open helpers использовали одинаковые правила;
- чтобы будущий GUI/CLI мог опираться на уже проверенную модель поведения.

Важная деталь:

- service name по умолчанию строится как `KioskRunner-<showcaseId>`, для BOLARS это `KioskRunner-bolars`;
- если `config.json` отсутствует, но служба уже установлена, common пытается восстановить config path из service `PathName`.

### `packaging/kioskrunner-status.ps1`

Неинтерактивный status script.

Выводит:

- `serviceName`;
- service installed yes/no;
- service state;
- startup type;
- service `PathName`;
- config path;
- registryUrl;
- rootDir;
- local showcase URL;
- `/healthz` status;
- `/runner/status` status;
- currentVersion;
- servedVersion;
- previousVersion;
- lastUpdateStatus;
- lastError;
- lastSuccessfulUpdateAt.

Поддерживает `-Json`.

Почему нужен отдельный status script:

- его можно запускать без меню;
- им удобно проверять состояние после install/start/restart;
- его можно использовать в smoke/checklist;
- он пригоден для будущей автоматизации.

### `packaging/check-registry.ps1`

Диагностический скрипт проверки `registryUrl`.

Что делает:

- читает `config.json`;
- берёт `registryUrl`;
- скачивает manifest;
- проверяет, что ответ не HTML;
- парсит JSON;
- показывает `showcaseId`, `channel`, `status`, `version`, `bundleUrl`, `sha256`, `minRunnerVersion`, `bridgeContractVersion`, `buildCommit`;
- проверяет доступность `bundleUrl` через `HEAD`, с fallback на range `GET`;
- не скачивает bundle полностью;
- не меняет `current`.

Почему это отдельный скрипт:

- внедренцу часто нужно понять: проблема в runner-е или в публикации manifest/bundle;
- проверка registry не должна запускать update;
- это быстрый preflight перед `update now`;
- скрипт помогает диагностировать GitHub Pages/static hosting без изменения состояния киоска.

Ограничение:

- это диагностика, не source-of-truth validation. Окончательное решение принять/reject manifest остаётся за KioskRunner.

### `packaging/install-service.ps1`

Скрипт установки Windows Service.

Что делает:

- принимает `ConfigPath`;
- принимает `ExePath`;
- определяет `ServiceName`;
- проверяет наличие `KioskRunner.exe`;
- проверяет наличие `config.json`;
- требует `showcaseId`;
- регистрирует службу с командой:

```text
KioskRunner.exe service --config <config.json>
```

- ставит `StartupType=Automatic`;
- задаёт display name `KioskRunner Service (<showcaseId>)`;
- настраивает recovery policy restart on failure через `sc.exe failure`;
- не перезаписывает `config.json`;
- не трогает `current`, `versions`, `logs`.

Почему так:

- canonical runtime после перезагрузки должен жить именно как Windows Service;
- service command явно содержит config path, чтобы служба не зависела от текущей директории;
- `Automatic` закрывает требование автозапуска после reboot;
- recovery policy даёт базовую устойчивость без внешнего supervisor-а.

### `packaging/uninstall-service.ps1`

Скрипт удаления Windows Service.

Что делает:

- удаляет только service registration;
- не удаляет `config.json`;
- не удаляет `rootDir`;
- не удаляет `current`;
- не удаляет `versions`;
- не удаляет `logs`;
- требует подтверждение `UNINSTALL`, если не передан `-Force`.

Почему так:

- uninstall службы не должен уничтожать локально установленную витрину;
- внедренец может снять службу и потом установить заново без повторного скачивания bundle;
- logs остаются для диагностики.

### `packaging/open-showcase.ps1`

Маленький helper для открытия витрины.

Что делает:

- читает `config.json`;
- собирает URL из `webServer.listenHost`, `webServer.port`, `webServer.basePath`;
- открывает браузер;
- с `-PrintOnly` только печатает URL.

Почему нужен:

- внедренец не должен руками собирать URL;
- если порт или basePath поменялись в config, helper откроет актуальный адрес.

### `packaging/post-reboot-smoke.ps1`

Проверка, что после перезапуска машины expected runtime состояние восстановилось.

Проверяет:

- служба установлена;
- `StartupType=Automatic`;
- служба запущена;
- `/healthz` отвечает;
- `/runner/status` отвечает;
- `currentVersion` заполнен;
- `servedVersion` совпадает с `currentVersion`.

Поддерживает `-Json`.

Почему нужен:

- это простой checklist после reboot;
- его можно дать внедренцу как “после перезагрузки запусти и посмотри PASS/FAIL”;
- он не требует 1С и не проверяет бизнес-логику.

## 5. Почему safe update останавливает службу

В текущем MVP update lock может быть in-process only. Это значит:

- service mode может выполнять scheduled update внутри процесса службы;
- отдельный `KioskRunner.exe update-once`, запущенный из PowerShell, является другим процессом;
- без inter-process lock есть риск, что manual update и scheduled update одновременно полезут в `versions/current/state`.

Чтобы не менять KioskRunner core в этой задаче, выбран бюджетный безопасный режим:

1. Если служба запущена, manager предупреждает оператора.
2. Оператор подтверждает `UPDATE`.
3. Скрипт останавливает службу.
4. Скрипт запускает:

```powershell
KioskRunner.exe update-once --config config.json
```

5. Скрипт снова запускает службу.
6. Скрипт показывает status.

Плюсы:

- нет гонки с scheduled update;
- не нужно менять runner core;
- не нужен distributed/inter-process lock;
- поведение понятно оператору.

Минус:

- на время manual update локальная витрина может быть недоступна.

Для field trial это приемлемо. Будущее улучшение: rootDir-scoped inter-process lock в runner core.

## 6. Почему rollback тоже выполняется через stop -> rollback -> start

Rollback меняет опубликованный `current`.

Чтобы не получить конфликт с web-server serving и scheduled update, выбран тот же безопасный паттерн:

1. подтвердить `ROLLBACK`;
2. остановить службу, если она запущена;
3. выполнить:

```powershell
KioskRunner.exe rollback --config config.json
```

4. запустить службу снова;
5. проверить status.

Если `previousVersion` отсутствует, runner возвращает понятную ошибку. Скрипт не пытается “лечить” это сам.

## 7. Как выглядит UX внедренца

Ожидаемый путь:

1. Скачать `KioskRunner-win-x64.zip`.
2. Распаковать.
3. Скопировать `config.example.json` в `config.json`.
4. Заполнить `registryUrl`, `rootDir`, `webServer.listenHost`, `webServer.port`, `webServer.basePath`.
5. Запустить:

```powershell
.\manage-kioskrunner.ps1
```

6. Выбрать `[1] Show status`.
7. Выбрать `[8] Check registry`.
8. Выбрать `[2] Install service`.
9. Выбрать `[3] Start service`.
10. Выбрать `[6] Update now`, если current ещё не установлен или нужно форсировать проверку.
11. Выбрать `[9] Open showcase`.

Для 1С-программиста итогом остаётся один стабильный URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С не знает про GitHub, GitHub Pages, manifest, bundle.zip, sha256, current, versions или logs.

## 8. Проверенный smoke-flow

Проверка выполнялась на чистой smoke-распаковке:

```text
artifacts/kioskrunner-powershell-manager-smoke/runner
```

Registry URL:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

Установленная/отдаваемая версия:

```text
2026.05.28.github-fieldtrial-1
```

Проверено:

- все `packaging/*.ps1` проходят PowerShell parse check;
- status script корректно показывает `NotInstalled`;
- registry-check получает production manifest и видит доступный bundleUrl;
- service устанавливается как `KioskRunner-bolars`;
- service имеет `StartupType=Automatic`;
- service `PathName` содержит `service --config <config.json>`;
- service стартует;
- `/healthz` отвечает HTTP 200;
- `/runner/status` отвечает HTTP 200;
- `http://127.0.0.1:8787/kiosk/bolars/` отвечает HTTP 200;
- header `X-Kiosk-Showcase-Version` равен `2026.05.28.github-fieldtrial-1`;
- `currentVersion` равен `servedVersion`;
- safe update даёт `noop` на той же версии и не ломает current;
- restart сохраняет работоспособность;
- rollback без `previousVersion` возвращает понятную ошибку и не ломает current;
- uninstall удаляет только службу и оставляет `config/rootDir/current/versions/logs`.

## 9. Что вошло в пакет

Обновлён:

```text
artifacts/kiosk-runner/KioskRunner-win-x64.zip
```

Внутри:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
kioskrunner-common.ps1
kioskrunner-status.ps1
check-registry.ps1
open-showcase.ps1
post-reboot-smoke.ps1
manage-kioskrunner.ps1
README.md
```

SHA-256 пакета:

```text
DD6E6F54340A09EA2B848673F5FC33F056D4A8F1FFCA74D6874DE754F3EB0705
```

Проверено, что в zip нет:

- `config.json`;
- `.env`;
- `.env.local`;
- `.env.deploy`;
- `.pem`;
- `.pfx`;
- `.key`.

## 10. Документация

Добавлен runbook:

```text
docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md
```

Обновлён handoff для 1С-внедренца:

```text
docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md
```

Обновлён packaging README:

```text
packaging/README.md
```

Closeout smoke report:

```text
docs/reports/2026-05-28/KIOSK_RUNNER_POWERSHELL_MANAGER_MVP_CLOSEOUT.report.md
```

## 11. Границы, которые сохранены

Подтверждено:

- KioskRunner core не менялся;
- .NET GUI не добавлялся;
- вторая служба не добавлялась;
- Task Scheduler не добавлялся как основной механизм;
- update-server не добавлялся;
- fleet dashboard не добавлялся;
- telemetry не добавлялась;
- auth/private registry не добавлялись;
- dependency на 1С не добавлялась;
- HTML <-> 1С bridge не менялся;
- runner не читает branch/main/dist;
- runner не делает `git pull`;
- scripts не скачивают HTML напрямую из source repo.

## 12. Ограничения текущего MVP

1. Реальный reboot не выполнялся в агентской сессии.

   Выполнены stop/start/restart и `post-reboot-smoke.ps1`. Физическую перезагрузку нужно проверить на целевой машине.

2. Safe update временно останавливает службу.

   Это осознанный компромисс без изменения runner core. Для магазина это лучше выполнять в сервисное окно или до передачи киоска покупателям.

3. Успешный rollback не проверен, потому что в smoke-сценарии не было `previousVersion`.

   Проверен понятный отказ при отсутствии предыдущей версии. Наличие рабочей старой версии нужно проверить после двух production-install/update циклов.

4. `check-registry.ps1` является диагностикой.

   Он не заменяет KioskRunner validation и не должен становиться альтернативным updater-ом.

## 13. Почему это не конфликтует с будущим Manager GUI

PowerShell Manager использует те же внешние интерфейсы, которые понадобятся GUI:

- Windows Service status;
- service install/start/stop/restart/uninstall actions;
- `config.json`;
- `/healthz`;
- `/runner/status`;
- `KioskRunner.exe update-once`;
- `KioskRunner.exe rollback`;
- logs folder;
- local showcase URL.

Поэтому будущий `.NET GUI Manager` сможет заменить PowerShell UX без изменения delivery canon. PowerShell слой можно оставить как fallback/admin toolkit.

## 14. Рекомендация

PowerShell Manager MVP можно использовать для field trial.

Рекомендуемый следующий практический шаг:

1. Распаковать обновлённый `KioskRunner-win-x64.zip` на целевой Windows-машине.
2. Настроить `config.json`.
3. Запустить `manage-kioskrunner.ps1`.
4. Установить и запустить службу.
5. Выполнить update.
6. Открыть витрину.
7. Перезагрузить машину.
8. Запустить `post-reboot-smoke.ps1`.

После успешного reboot smoke можно считать ops-UX достаточным для бюджетного field trial без .NET GUI.
