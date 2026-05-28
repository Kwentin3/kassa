# PRD: KioskRunner / .NET Runner витрин 1С

Дата: 2026-05-28  
Статус: draft v0.1  
Область: доставка production HTML-витрины на Windows-узел рядом с 1С Web и Apache  
Целевой компонент: `KioskRunner` на .NET Worker Service / Windows Service

## 0. Основание и границы документа

KioskRunner проектируется для направления **1C HTML Shell / Self-Checkout Showcase**. Он не меняет уже зафиксированную продуктовую границу:

```text
HTML - визуальная оболочка и bridge-интерфейс.
1С / РМК - владелец бизнес-логики, корзины, продажи, оплаты, чека, ККТ и фискализации.
KioskRunner - доставка и переключение статического HTML bundle.
Apache - публикация текущей распакованной версии.
```

Документ учитывает текущие контракты:

- `docs/integrations/1c-html-shell/PRD_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- `docs/integrations/1c-html-shell/BLUEPRINT_1C_HTML_SHELL_SELF_CHECKOUT_SHOWCASE.md`;
- `docs/integrations/1c-html-shell/1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md`;
- `docs/integrations/1c-html-shell/1C_SHOWCASE_CATALOG_DATA_CONTRACT.md`;
- `docs/integrations/1c-html-shell/1C_HTML_SHELL_BRIDGE_MANIFEST.md`;
- `docs/integrations/1c-html-shell/runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`;
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`;
- `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`;
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`;
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`;
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`;
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`;
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`;
- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`.

Текущий public demo deploy через Docker/Nginx/Traefik на `https://kassa.speechbattle.com` этим PRD не изменяется. KioskRunner описывает отдельный целевой контур для Windows-узла клиента или стенда рядом с 1С Web и Apache.

## 1. Назначение фичи

KioskRunner нужен как безопасный, проверяемый и управляемый механизм доставки HTML-витрины на Windows-узел рядом с 1С Web, без участия 1С в GitHub/update/versioning-логике.

Проблема: HTML-витрина должна регулярно получать production-сборки, но 1С не должна знать про GitHub Releases, manifest, hash, папки `versions`, переключение `current` или rollback. Apache тоже не должен становиться updater-ом. Ему достаточно отдавать статические файлы из стабильной папки.

KioskRunner решает только lifecycle статического bundle:

- найти актуальную production-версию;
- скачать bundle;
- проверить manifest и `sha256`;
- распаковать версию;
- безопасно переключить `current`;
- сохранить state/logs;
- позволить rollback на предыдущую локальную версию.

Он не является backend-приложением витрины, не является мостом HTML ↔ 1С и не управляет бизнес-состоянием кассы.

Целевой технологический выбор: **.NET Worker Service / Windows Service**.

Причины:

- Windows + 1С Web + Apache естественно сочетаются с .NET;
- MVP можно начать с CLI-команды `update-once`;
- затем тот же lifecycle можно поднять как Windows Service;
- .NET даёт штатные конфиги, логирование, работу с файловой системой и service lifecycle;
- будущий delivery может быть self-contained single-file `.exe`.

Go рассматривался как возможная альтернатива для single-binary tooling, но в этом PRD целевой выбор - .NET.

## 2. Product scope

В scope MVP и ближайшего расширения входят:

- `manifest.json` contract;
- `bundle.zip` contract;
- production channel;
- `update-once` mode;
- future Windows Service mode;
- обязательная `sha256` verification;
- `versions` directory;
- `current` directory;
- `state.json`;
- `logs`;
- rollback;
- Apache Alias integration;
- stable URL для 1С, например `http://localhost/kiosk/bolars/`;
- basic failure handling;
- GitHub Releases / registry publishing model;
- future path к production registry/update-server.

Из scope исключены:

- бизнес-логика 1С;
- эквайринг;
- сканер;
- маркировка;
- ККТ/фискализация;
- состояние корзины;
- ручная загрузка JSON в HTML;
- `git pull` из runner;
- превращение runner в полноценный web-server;
- управление HTML ↔ 1С bridge-контрактом внутри runner;
- изменение текущего Docker/Traefik deploy без отдельной задачи;
- real backend, CMS или update-flow внутри HTML.

## 3. Роли и пользователи

| Роль | Интерес / ответственность |
| --- | --- |
| 1С-программист / внедренец | Открывает стабильный URL витрины из 1С, использует нативный HTML API / bridge и не занимается GitHub/update/versioning. |
| Системный администратор клиента | Устанавливает KioskRunner, Apache Alias, права на `C:\KioskShowcases`, проверяет logs/state и место на диске. |
| Разработчик витрины | Публикует static production bundle, соблюдает bundle contract и bridge compatibility. |
| DevOps/release operator | Собирает release, считает `sha256`, публикует manifest, переводит candidate в production. |
| KioskRunner | Технический updater/runtime-компонент доставки: скачивание, проверка, распаковка, `current`, state, logs, rollback. |
| Apache | Static publishing layer: отдаёт только папку `current` по Alias. |
| 1С | Владелец бизнес-процесса: каталог, корзина, поиск, сканирование, маркировка, эквайринг, чек, ККТ, фискализация и состояние продажи. |

## 4. Целевая архитектура

Поток:

```text
GitHub Release / registry
  -> KioskRunner скачал production manifest
  -> KioskRunner понял, есть ли новая production-версия
  -> KioskRunner скачал bundle.zip
  -> KioskRunner проверил sha256
  -> KioskRunner распаковал bundle в versions/<version>/
  -> KioskRunner проверил index.html и минимальную валидность bundle
  -> KioskRunner обновил current/
  -> Apache отдаёт current/
  -> 1С открывает стабильный URL витрины
```

Разделение ответственности:

| Компонент | Делает | Не делает |
| --- | --- | --- |
| KioskRunner | Скачивает manifest и bundle, проверяет `sha256`, распаковывает, переключает `current`, ведёт `state.json`, пишет logs, умеет rollback. | Не отдаёт HTTP как основной web-server, не ходит в 1С, не управляет корзиной, не меняет bridge API, не делает `git pull`. |
| Apache | Публикует только `current` как static HTML. | Не знает про GitHub, production/candidate, manifest, versions, hash, rollback. |
| 1С | Открывает стабильный URL и передаёт данные в HTML только нативными механизмами 1С → HTML / HTML ↔ 1С. | Не знает про GitHub, manifest, versions, current-switching, rollback. |
| GitHub Release / registry | Хранит production manifest, `bundle.zip`, `sha256`, `version`, `channel`, `status`, `bridgeContractVersion`, `minRunnerVersion`. | Не выполняет update на клиентском Windows-узле. |

Runner не является частью `SelfCheckoutRuntimePort`, `OneCInterfaceAdapter` или `window.BolarsSelfCheckout`. Эти bridge/runtime-контракты остаются в HTML/1С-контуре.

## 5. MVP lifecycle

MVP-команда:

```text
KioskRunner.exe update-once
```

Команда должна:

1. Прочитать локальный `config.json`.
2. Скачать `manifest.json` из `registryUrl`.
3. Проверить, что `showcaseId` совпадает с config.
4. Проверить, что `channel` совпадает с config и равен `production` для production-узла.
5. Проверить, что `status` разрешает установку production-версии.
6. Проверить, что `minRunnerVersion` не выше текущей версии runner.
7. Проверить совместимость `bridgeContractVersion` с локально поддерживаемым диапазоном.
8. Прочитать `state.json`, если он есть и валиден.
9. Сравнить `manifest.version` с `state.currentVersion`.
10. Если новой версии нет, записать `lastCheckAt`, `lastUpdateStatus=noop` и корректно завершиться.
11. Если версия новая, скачать `bundle.zip` в `downloads`.
12. Проверить `sha256` скачанного zip.
13. Распаковать bundle в staging-папку, затем в `versions/<version>/`.
14. Проверить наличие `index.html`.
15. Проверить минимальную валидность bundle: нет пустого `index.html`, есть ассеты или самодостаточная структура, нет явных запрещённых служебных файлов.
16. Максимально безопасно обновить `current`.
17. Записать `previousVersion`, `currentVersion`, `currentSha256`.
18. Записать `lastCheckAt`, `lastUpdateStatus`, `lastSuccessfulUpdateAt`.
19. Записать лог с итогом операции.
20. При ошибке не ломать текущую рабочую витрину.

MVP не обязан решать все нюансы атомарного directory switch на Windows идеально, но требование продукта жёсткое: успешная старая версия должна остаться доступной, если новая версия не прошла проверку или переключение не завершилось.

## 6. Future lifecycle

Будущий service-mode:

```text
KioskRunner.exe service
```

Windows Service должен:

- стартовать вместе с Windows или по политике администратора;
- читать тот же `config.json`;
- периодически проверять manifest по `checkIntervalMinutes`;
- выполнять тот же update lifecycle, что `update-once`;
- не запускать параллельные update-процессы для одного `showcaseId`;
- писать logs/state для каждой проверки;
- не ломать `current` при сетевых, manifest, hash или filesystem ошибках;
- корректно останавливаться по сигналу Windows Service Control Manager.

Желательные будущие команды:

```text
KioskRunner.exe status
KioskRunner.exe rollback
KioskRunner.exe install
KioskRunner.exe uninstall
KioskRunner.exe start
KioskRunner.exe stop
KioskRunner.exe service
```

Ожидаемая роль команд:

| Команда | Назначение |
| --- | --- |
| `status` | Показать `currentVersion`, `previousVersion`, последний статус и последнюю ошибку без изменения файлов. |
| `rollback` | Вернуть `previousVersion` в `current`, если версия есть локально. |
| `install` | Установить Windows Service с текущим config/rootDir. |
| `uninstall` | Удалить Windows Service без удаления версий витрин. |
| `start` | Запустить установленную службу. |
| `stop` | Остановить установленную службу. |
| `service` | Рабочий entrypoint службы. |

## 7. Manifest contract

Минимальный `manifest.json`:

```json
{
  "showcaseId": "bolars",
  "channel": "production",
  "version": "2026.05.28.1",
  "status": "production",
  "bundleUrl": "https://github.com/example/releases/download/2026.05.28.1/bolars.bundle.zip",
  "sha256": "64-char-lowercase-hex-sha256",
  "bridgeContractVersion": "bolars-web-1c-v0.1",
  "minRunnerVersion": "0.1.0",
  "publishedAt": "2026-05-28T12:00:00Z",
  "buildCommit": "abcdef1234567890",
  "rollbackVersion": "2026.05.27.1"
}
```

Смысл полей:

| Поле | Смысл |
| --- | --- |
| `showcaseId` | Идентификатор витрины, например `bolars`. Runner не ставит manifest от другой витрины. |
| `channel` | Канал доставки. Для production-узла целевой канал - только `production`. |
| `version` | Версия bundle. Используется для сравнения с `state.currentVersion` и папки `versions/<version>/`. |
| `status` | Статус публикации. MVP принимает только production-разрешённый статус; candidate не ставится на production-узел. |
| `bundleUrl` | URL готового zip-архива. Runner скачивает именно bundle, а не `main`, `dist` или рабочую ветку. |
| `sha256` | Контрольная сумма zip-архива. Проверка обязательна до распаковки/переключения. |
| `bridgeContractVersion` | Версия HTML ↔ 1С контракта, с которой совместим bundle. Runner только проверяет совместимость, но не управляет bridge. |
| `minRunnerVersion` | Минимальная версия KioskRunner, которая умеет безопасно поставить этот bundle. |
| `publishedAt` | Время публикации manifest для аудита и диагностики. |
| `buildCommit` | Коммит исходников витрины, из которого собран bundle. |
| `rollbackVersion` | Рекомендованная версия отката, если release operator явно её указал. MVP rollback всё равно должен работать от локального `previousVersion`. |

Runner должен тянуть только production-версию из production registry/manifest. Он не должен тянуть `main`, `dist`, branch artifacts или произвольный URL без production manifest.

## 8. Bundle contract

`bundle.zip` должен соответствовать требованиям:

- внутри после распаковки должен быть `index.html` в корне bundle;
- должна быть папка `assets` или эквивалентная самодостаточная структура ассетов;
- bundle должен быть static UI shell: HTML, CSS, JS, ассеты;
- bundle не должен содержать бизнес-данные 1С;
- bundle не должен содержать секреты, токены, приватные ключи, `.env`, `.env.deploy`;
- bundle не должен содержать внутренние ссылки объектов 1С;
- bundle должен быть совместим с `bridgeContractVersion` из manifest;
- bundle должен открываться через Apache static publishing;
- bundle не должен требовать runner как backend;
- bundle не должен требовать ручной загрузки JSON пользователем.

Для 1С/V8WebKit-safe artifact остаются обязательны ограничения runtime profile: не закладывать неподтверждённые современные browser features как mandatory path, не требовать CDN, external runtime, обязательный `fetch`, `type=module`, `?.` / `??` или другой неподтверждённый синтаксис. Если используется split-assets bundle через Apache, он должен быть отдельно проверен в целевой 1С-среде как same-origin static delivery.

## 9. Windows file layout

Целевая структура:

```text
C:\KioskShowcases\
  bolars\
    config.json
    state.json
    downloads\
    versions\
      2026.05.27.1\
      2026.05.28.1\
    current\
    logs\
```

Назначение:

| Путь | Назначение |
| --- | --- |
| `C:\KioskShowcases\bolars\config.json` | Локальная конфигурация конкретной витрины и узла. |
| `C:\KioskShowcases\bolars\state.json` | Текущее состояние runner: установленная версия, предыдущая версия, hash, последние статусы. |
| `downloads\` | Временное или историческое хранение скачанных zip. Может очищаться по retention-политике. |
| `versions\` | Распакованные версии bundle. Rollback должен опираться на локальные версии отсюда. |
| `current\` | Версия, которую публикует Apache. 1С открывает URL, который указывает сюда через Alias. |
| `logs\` | Логи проверок, обновлений, ошибок и rollback. |

Путь установки может быть уточнён в ops-решении, но PRD фиксирует принцип: у каждой витрины есть изолированный rootDir, а Apache публикует только `current`.

## 10. Config contract

Минимальный `config.json`:

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "channel": "production",
  "registryUrl": "https://example.com/registry/bolars/production/manifest.json",
  "rootDir": "C:\\KioskShowcases\\bolars",
  "apachePublishedDir": "C:\\KioskShowcases\\bolars\\current",
  "checkIntervalMinutes": 15,
  "keepVersions": 5,
  "autoUpdate": true
}
```

Смысл полей:

| Поле | Смысл |
| --- | --- |
| `runnerId` | Локальный идентификатор установки для logs/diagnostics. Не должен быть секретом. |
| `showcaseId` | Какая витрина обслуживается этим rootDir. |
| `channel` | Канал, который разрешено ставить. Для production-узла - `production`. |
| `registryUrl` | URL production manifest или registry endpoint. |
| `rootDir` | Корневая папка витрины. |
| `apachePublishedDir` | Папка, которую публикует Apache. В MVP должна совпадать с `current`. |
| `checkIntervalMinutes` | Интервал проверки для future service-mode. |
| `keepVersions` | Сколько распакованных версий сохранять локально. Не должен удалять `current` и `previousVersion`. |
| `autoUpdate` | Разрешает service-mode автоматически применять production update. `update-once` может использовать тот же флаг как guard. |

Реальные секреты, токены и приватные ключи не должны попадать в PRD или репозиторий. Если в будущем потребуется приватный registry, секреты должны жить в защищённом ops/secret-контуре Windows, CI/CD или vault, а не в bundle и не в публичном config example.

## 11. State contract

Минимальный `state.json`:

```json
{
  "currentVersion": "2026.05.28.1",
  "previousVersion": "2026.05.27.1",
  "currentSha256": "64-char-lowercase-hex-sha256",
  "lastCheckAt": "2026-05-28T12:05:00Z",
  "lastUpdateStatus": "updated",
  "lastError": null,
  "lastSuccessfulUpdateAt": "2026-05-28T12:05:00Z"
}
```

Смысл полей:

| Поле | Смысл |
| --- | --- |
| `currentVersion` | Версия, которая сейчас опубликована через `current`. |
| `previousVersion` | Предыдущая рабочая версия для rollback. |
| `currentSha256` | Hash zip-архива, из которого поставлена текущая версия. |
| `lastCheckAt` | Последняя попытка проверить manifest. |
| `lastUpdateStatus` | Последний статус: `noop`, `updated`, `failed`, `rolledBack`, `blocked`, `invalidState`. |
| `lastError` | Последняя диагностическая ошибка без секретов и без длинных stack trace для пользовательских handoff. |
| `lastSuccessfulUpdateAt` | Время последнего успешного переключения `current`. |

`state.json` нужен для диагностики, rollback и идемпотентности update-процесса. Он не является источником бизнес-истины и не содержит данные продажи.

## 12. Rollback

MVP rollback-механика:

- если новая версия не прошла manifest/hash/zip/index validation, `current` не переключается;
- если переключение `current` сломалось, runner должен сохранить или восстановить предыдущую рабочую версию;
- `rollback` должен возвращать `previousVersion` в `current`, если эта версия есть в `versions`;
- rollback должен обновить `state.currentVersion`, `state.previousVersion`, `state.currentSha256`, `lastUpdateStatus=rolledBack`;
- лог должен фиксировать причину rollback;
- rollback не должен зависеть от GitHub, если предыдущая версия уже есть локально.

Rollback не исправляет бизнес-состояние 1С. Если во время обновления пользовательская сессия была открыта в 1С, именно 1С остаётся владельцем продажи и решает, как восстановить экран через свой snapshot/bridge.

## 13. Failure modes

Общее правило для всех отказов: не ломать текущую витрину, записать ошибку, завершиться с понятным статусом, оставить `previous/current` в согласованном состоянии.

| Сценарий отказа | Ожидаемое поведение PRD |
| --- | --- |
| Manifest недоступен | Не менять `current`; записать `lastUpdateStatus=failed`, `lastError=manifest_unavailable`; завершиться без update. |
| Manifest повреждён | Не скачивать bundle; записать ошибку parse/validation; сохранить текущую версию. |
| Manifest не соответствует `showcaseId` | Отклонить manifest как чужой; не менять `current`; записать mismatch. |
| `status` не production | Не ставить candidate/non-production на production-узел; завершиться как `blocked` или `noop` с диагностикой. |
| `bundleUrl` недоступен | Не менять `current`; сохранить старый bundle; записать download error. |
| `sha256` не совпал | Удалить или пометить скачанный zip как invalid; не распаковывать в `current`; записать integrity error. |
| Zip повреждён | Не переключать `current`; удалить/изолировать staging; записать unzip error. |
| Нет `index.html` | Считать bundle invalid; не переключать `current`; записать bundle validation error. |
| Недостаточно прав на файловую систему | Не продолжать partial update; записать permission error; current остаётся старым. |
| Apache `current` занят/заблокирован | Не удалять рабочий `current`; записать lock/switch error; оставить старую версию доступной. |
| Нет места на диске | Прервать до переключения; записать disk space error; не удалять рабочие версии без явной retention-политики. |
| Версия уже установлена | Записать `lastCheckAt`, `lastUpdateStatus=noop`; не скачивать заново без force-режима. |
| `minRunnerVersion` выше текущей версии runner | Отклонить manifest как требующий обновления runner; не менять `current`; записать blocked. |
| `bridgeContractVersion` несовместим | Не ставить bundle, который текущий HTML ↔ 1С контур не поддерживает; записать compatibility error. |
| `state.json` повреждён | Не выполнять разрушительное переключение; попытаться безопасно диагностировать `current`; записать `invalidState`; требовать восстановления state или явного init-процесса. |
| Частичное обновление после аварийного завершения | На следующем запуске очистить/изолировать staging; сверить `state` и `current`; не считать update успешным без валидного `current`. |

Ошибки не должны печатать секреты, токены, приватные URL с credentials или содержимое реальных `.env`.

## 14. Security and integrity

Требования:

- `sha256` verification обязательна до распаковки и переключения;
- нельзя исполнять произвольные скрипты из manifest;
- нельзя делать `git pull` рабочей ветки из runner;
- нельзя принимать bundle без production manifest;
- нельзя хранить секреты в bundle;
- нельзя хранить секреты в публичном `config.json` example;
- нельзя давать 1С URL на версионную папку `versions/<version>/`;
- нельзя смешивать updater и Apache;
- нельзя публиковать zip через Apache как customer-facing артефакт;
- нельзя превращать runner в HTML backend;
- нельзя использовать runner для передачи бизнес-данных 1С в HTML;
- желательно предусмотреть будущую подпись manifest/bundle, но для MVP достаточно обязательного `sha256` при условии доверенного production registry URL.

Future hardening:

- подпись manifest;
- подпись bundle;
- allowlist доменов registry;
- TLS pinning или корпоративный certificate policy, если это потребуется клиентским ops;
- отдельный защищённый secret provider для private registry.

## 15. Apache integration

Apache должен публиковать уже распакованный `current`.

Целевой Alias:

```text
/kiosk/bolars/ -> C:\KioskShowcases\bolars\current\
```

Примерная идея конфигурации:

```apache
Alias "/kiosk/bolars/" "C:/KioskShowcases/bolars/current/"
<Directory "C:/KioskShowcases/bolars/current/">
    Require all granted
    Options -Indexes
</Directory>
```

Требования:

- Apache публикует уже распакованный `current`;
- Apache не публикует `downloads` и `versions`;
- Apache не публикует `bundle.zip`;
- Apache не управляет версиями;
- Apache не скачивает release artifacts;
- Apache не знает про registry;
- 1С открывает только стабильный URL:

```text
http://localhost/kiosk/bolars/
http://127.0.0.1/kiosk/bolars/
```

1С не должна открывать `C:\KioskShowcases\bolars\versions\2026.05.28.1\` и не должна хранить версионный URL.

## 16. 1С handoff

Что нужно знать 1С-программисту / внедренцу:

- 1С открывает стабильный URL витрины, например `http://localhost/kiosk/bolars/`;
- URL не меняется при обновлениях витрины;
- HTML-страница отдаёт свой JavaScript API, например `window.BolarsSelfCheckout`, если это BOLARS runtime;
- 1С передаёт данные в HTML только нативными механизмами: direct JS call / HTML API / согласованный bridge;
- для BOLARS рабочий принцип: Web отдаёт команды покупателя, 1С применяет бизнес-логику и возвращает полный authoritative snapshot.

Что 1С не нужно знать:

- GitHub;
- manifest;
- `bundle.zip`;
- `sha256`;
- `versions`;
- `current` switching;
- rollback;
- runner logs, кроме диагностики администратора.

Почему нельзя ручную загрузку JSON:

- ручной JSON import создаёт ложный operational path и обходит 1С как владельца данных;
- пользователь или внедренец может загрузить устаревшие/чужие данные;
- это противоречит текущим контрактам `1C_TO_HTML_DIRECT_CATALOG_DELIVERY_RESEARCH.md`, `1C_SHOWCASE_CATALOG_DATA_CONTRACT.md` и BOLARS handoff;
- production обмен должен идти программно через 1С → HTML / HTML ↔ 1С.

Почему HTML не владеет корзиной:

- корзина, цены, скидки, маркировка, оплата, чек и фискализация принадлежат 1С / РМК;
- HTML рисует snapshot и отправляет user intent;
- после reload HTML должен получить актуальный state от 1С, а не восстанавливать продажу из собственной памяти.

Почему runner не влияет на бизнес-логику 1С:

- runner обновляет только static файлы витрины;
- runner не вызывает методы 1С;
- runner не читает и не пишет чек;
- runner не управляет оплатой, ККТ, сканером или маркировкой.

## 17. GitHub publishing model

Минимальная стратегия публикации:

1. Исходники витрины живут в GitHub.
2. CI/build собирает static HTML artifact.
3. Результат пакуется в `bundle.zip`.
4. Для `bundle.zip` считается `sha256`.
5. Создаётся `manifest.json`.
6. Release получает статус `candidate`.
7. Candidate проверяется на нужных smoke/visual/1C gates.
8. После проверки release operator продвигает manifest/channel/status в `production`.
9. Runner читает только production registry/manifest.

Runner не должен ходить в `main`, `dist`, branch artifacts или raw GitHub files как источник истины для установки. Источник установки - только production manifest, который указывает на конкретный immutable bundle и hash.

Future path:

- заменить GitHub Release registry на production update-server;
- сохранить тот же manifest/bundle/state contract;
- добавить подписи и access control;
- не менять обязанность 1С открывать только stable URL.

## 18. Acceptance criteria

PRD считается принятым, если:

- объясняет, зачем нужен KioskRunner;
- фиксирует разделение 1С / HTML / Runner / Apache / GitHub;
- содержит MVP lifecycle `update-once`;
- содержит future service-mode lifecycle;
- содержит manifest contract;
- содержит bundle contract;
- содержит config/state contracts;
- содержит Windows file layout;
- содержит rollback;
- содержит failure modes;
- содержит Apache Alias integration;
- содержит 1С handoff;
- явно запрещает ручную загрузку JSON;
- явно запрещает `git pull` из runner;
- явно запрещает превращать HTML-витрину в backend;
- явно запрещает заставлять 1С знать про GitHub, versions или manifest;
- не начинает реализацию кода;
- не меняет текущую архитектуру bridge/runtime без отдельного обоснования.

## 19. Open questions

Открытые вопросы не блокируют создание PRD:

- точный путь установки на Windows: `C:\KioskShowcases` или клиентский стандартный путь;
- нужен ли приватный GitHub registry или публичный release;
- нужна ли подпись manifest/bundle в MVP или достаточно `sha256`;
- какая минимальная версия .NET;
- как именно происходит promotion `candidate` → `production`;
- какой формат логов нужен: plain text или JSON lines;
- нужен ли отдельный health/status файл для внешней диагностики;
- как тестировать совместимость `bridgeContractVersion`;
- как безопаснее переключать `current` на Windows в MVP: directory replace, staging copy, junction/symlink или другой ops-approved механизм;
- нужна ли отдельная retention-политика для `downloads`;
- нужен ли explicit `force` режим для переустановки той же версии;
- нужна ли offline-install команда из локального bundle для изолированных клиентских контуров.

## 20. Формат результата и запреты для следующего этапа

Этот PRD является одним документом требований. Он не реализует runner, не добавляет код, не меняет Apache config и не меняет HTML ↔ 1С bridge.

Следующему агенту нельзя:

- начинать реализацию без отдельной задачи;
- подключать real backend/1C/payment/SBP/KKT/fiscalization/CMS;
- добавлять ручной JSON upload/import в HTML;
- превращать HTML-витрину в backend;
- заставлять 1С знать про GitHub, versions или manifest;
- заставлять Apache управлять версиями;
- делать runner web-server-ом для витрины;
- делать `git pull` как update-механизм;
- печатать или читать реальные `.env` / `.env.deploy`.
