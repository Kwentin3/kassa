# PRD: KioskRunner / .NET Runner витрин 1С

Дата: 2026-05-28  
Статус: draft v0.3  
Область: доставка и локальная публикация production HTML-витрины на Windows-узле рядом с 1С Web  
Целевой компонент: `KioskRunner` на .NET Worker Service / Windows Service

## 0. Основание и границы документа

KioskRunner проектируется для направления **1C HTML Shell / Self-Checkout Showcase**. v0.2 изменил deployment-канон: Apache больше не является обязательным компонентом. v0.3 добавляет bootstrap/distribution слой: откуда берётся сам runner, как создаётся config и как runner находит production manifest HTML-витрины.

Продуктовая граница:

```text
HTML - визуальная оболочка и bridge-интерфейс.
1С / РМК - владелец бизнес-логики, корзины, продажи, оплаты, маркировки, чека, ККТ и фискализации.
KioskRunner - доставка, проверка, переключение и локальная HTTP-публикация статического HTML bundle.
Embedded static web server - часть KioskRunner, отдающая current по стабильному localhost URL.
```

KioskRunner не становится backend-приложением витрины. Он не читает и не пишет бизнес-данные 1С, не управляет корзиной, не вызывает методы 1С, не принимает ручную загрузку JSON и не заменяет HTML ↔ 1С bridge.

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

Текущий public demo deploy через Docker/Nginx/Traefik на `https://kassa.speechbattle.com` этим PRD не изменяется. KioskRunner описывает отдельный целевой контур для Windows-узла клиента или стенда рядом с 1С Web.

## 1. Назначение фичи

KioskRunner нужен как безопасный, проверяемый и управляемый механизм доставки и локальной публикации HTML-витрины на Windows-узле рядом с 1С Web, без участия 1С в GitHub/update/versioning-логике.

Проблема: HTML-витрина должна регулярно получать production-сборки и открываться в 1С по стабильному URL. 1С не должна знать про GitHub Releases, manifest, hash, папки `versions`, переключение `current`, rollback или локальные служебные файлы. Внедрение не должно требовать обязательного Apache/Nginx только ради отдачи статической витрины на localhost.

KioskRunner объединяет:

1. updater production HTML bundle;
2. локальное хранение `versions/current/state/logs`;
3. embedded static web server;
4. health/status diagnostics;
5. rollback lifecycle.

KioskRunner решает lifecycle статического bundle:

- найти актуальную production-версию;
- скачать bundle;
- проверить manifest и `sha256`;
- распаковать версию;
- безопасно переключить `current`;
- сохранить state/logs;
- отдать `current` через локальный HTTP endpoint;
- позволить rollback на предыдущую локальную версию.

Целевой URL для 1С:

```text
http://127.0.0.1:8787/kiosk/bolars/
http://localhost:8787/kiosk/bolars/
```

Целевой технологический выбор: **.NET Worker Service / Windows Service**.

Причины:

- Windows + 1С Web естественно сочетаются с .NET;
- MVP можно начать с CLI-команды `update-once`;
- затем тот же lifecycle можно поднять как Windows Service с update loop и web serving;
- .NET даёт штатные конфиги, логирование, работу с файловой системой, HTTP hosting и service lifecycle;
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
- embedded static web server;
- local HTTP listener;
- configurable `listenHost`, `listenPort`, `basePath`;
- static serving from `current`;
- cache policy для `index.html` и `assets`;
- health endpoint;
- status endpoint;
- port conflict handling;
- path traversal protection;
- stable URL для 1С, например `http://127.0.0.1:8787/kiosk/bolars/`;
- runner distribution model;
- first install / bootstrap flow;
- `config.example.json` как поставляемый шаблон;
- local `config.json`, создаваемый внедренцем/администратором;
- artifact separation: runner artifact vs showcase artifact;
- public/no-auth MVP mode;
- basic failure handling;
- GitHub Releases / registry publishing model;
- future path к production registry/update-server;
- optional Apache/Nginx external mode как non-primary deployment option.

Из обязательного scope удалена Apache Alias integration. Она остаётся только как optional external publishing / reverse proxy compatibility для внедрений, где клиентская инфраструктура отдельно требует Apache/Nginx.

Из scope исключены:

- бизнес-логика 1С;
- эквайринг;
- сканер;
- маркировка;
- ККТ/фискализация;
- состояние корзины;
- ручная загрузка JSON в HTML;
- `git pull` из runner;
- application backend внутри runner;
- business API внутри runner;
- dynamic 1C data server внутри runner;
- self-update самого runner в MVP;
- авторизация/private registry как обязательное требование MVP;
- управление HTML ↔ 1С bridge-контрактом внутри runner;
- изменение текущего Docker/Traefik deploy без отдельной задачи;
- real backend, CMS или update-flow внутри HTML.

Разрешено и требуется: embedded static web server для публикации `current` bundle. Запрещено превращать этот static server в backend бизнес-операций.

## 3. Runner Distribution Model

Сам KioskRunner распространяется как отдельный release artifact, независимо от HTML-витрин.

Пример MVP-артефакта:

```text
KioskRunner-win-x64.zip
```

Минимальный состав:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
README.md
LICENSE / NOTICE при необходимости
```

MVP-источник скачивания:

- GitHub Releases проекта KioskRunner;
- другой публичный release URL, если проектный ops-контур выберет отдельное место публикации.

Важно:

- HTML-витрины обновляются автоматически через runner по `registryUrl`;
- сам runner в MVP не обязан самообновляться;
- self-update runner - отдельная будущая фича, не часть MVP;
- один и тот же runner binary может обслуживать разные `showcaseId` через разные `config.json`;
- config не должен быть захардкожен в коде runner;
- config не должен требовать пересборки runner.

## 4. First Install / Bootstrap Flow

MVP-сценарий первой установки:

1. Внедренец скачивает `KioskRunner-win-x64.zip`.
2. Распаковывает его, например, в `C:\KioskRunner`.
3. Копирует `config.example.json` в `config.json`.
4. Заполняет управляемые параметры:
   - `runnerId`;
   - `showcaseId`;
   - `channel`;
   - `registryUrl`;
   - `rootDir`;
   - `checkIntervalMinutes`;
   - `keepVersions`;
   - `webServer.listenHost`;
   - `webServer.port`;
   - `webServer.basePath`.
5. Запускает `KioskRunner.exe update-once` для первичной проверки и загрузки витрины.
6. Проверяет `http://127.0.0.1:8787/kiosk/bolars/`.
7. Устанавливает runner как Windows Service через `install-service.ps1` или `KioskRunner.exe install`.
8. 1С открывает стабильный localhost URL.

На MVP `config.json` создаётся локально внедренцем или системным администратором. `config.example.json` - шаблон без секретов и без привязки к клиентским приватным данным.

Runner узнаёт, где лежит production manifest, только из локального `config.json`:

```text
config.json
  -> registryUrl
  -> production manifest
  -> bundle.zip + sha256
```

Runner не должен сам догадываться, где опубликована HTML-витрина, и не должен подключаться к ветке GitHub напрямую.

Правильная модель:

```text
GitHub source repo
  -> build/publish process
  -> bundle.zip
  -> sha256
  -> manifest.json
  -> production registry/manifest URL
  -> KioskRunner
```

Неправильно:

- runner смотрит в branch/main/dist;
- runner скачивает HTML напрямую из ветки;
- runner делает `git pull`;
- runner сам догадывается, где лежит опубликованная HTML.

## 5. Artifact Separation

Есть два разных типа артефактов.

### A. Runner artifact

Runner artifact - это программа доставки и локальной публикации:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
README.md
LICENSE / NOTICE
```

Версионирование runner:

```text
runnerVersion = 0.3.0
```

Runner artifact обновляет tooling, service lifecycle, static server, diagnostics, security hardening и update logic.

### B. Showcase artifact

Showcase artifact - это HTML-витрина:

```text
bundle.zip
manifest.json
sha256
```

Версионирование витрины:

```text
showcase version = 2026.05.28.1
```

Showcase artifact обновляет UI shell, стили, ассеты, JS-интерфейс, visual logic и bridge-compatible HTML runtime.

Важно:

- `runnerVersion` и showcase version - разные сущности;
- `manifest.minRunnerVersion` говорит, какая минимальная версия runner нужна для конкретного bundle;
- обновление showcase не означает обновление runner;
- обновление runner не означает обновление showcase;
- self-update runner не входит в MVP;
- runner не читает source branch HTML-витрины.

## 6. Public MVP / No Auth Mode

На MVP допустимо, что `KioskRunner.exe`, `manifest.json` и `bundle.zip` публично доступны по URL.

Это приемлемо для MVP, потому что:

- bundle не содержит секреты;
- bundle не содержит бизнес-данные 1С;
- bundle не содержит персональные данные;
- bundle не содержит токены;
- runner слушает только `127.0.0.1` по умолчанию;
- runner не даёт доступа к 1С;
- runner не является backend;
- runner не хранит корзину, чек, оплату, маркировку или фискализацию.

Риски MVP:

- любой может скачать публичный runner;
- любой может скачать публичный HTML bundle;
- можно скопировать визуальную оболочку;
- `sha256` защищает только от повреждения или несовпадения bundle относительно manifest;
- `sha256` не защищает, если злоумышленник получил возможность изменить и manifest, и bundle.

Ограничения безопасности до появления авторизации:

- публичный manifest не должен содержать секреты;
- публичный bundle не должен содержать секреты или бизнес-данные;
- `config.example.json` не должен содержать токены;
- public/no-auth mode нельзя использовать для передачи данных 1С;
- runner web server нельзя открывать наружу только потому, что artifacts публичные;
- registry URL должен считаться доверенным источником до появления подписи manifest/bundle.

Future hardening:

- private registry;
- token-based download;
- signed manifest;
- signed bundle;
- runner license/tenant binding;
- allowlist registry domains;
- release signing для самого `KioskRunner.exe`;
- central update-server;
- self-update runner отдельной фазой.

## 7. Роли и пользователи

| Роль | Интерес / ответственность |
| --- | --- |
| 1С-программист / внедренец | Открывает стабильный URL витрины из 1С, использует нативный HTML API / bridge и не занимается GitHub/update/versioning. |
| Системный администратор клиента | Устанавливает KioskRunner, проверяет порт, права на `C:\KioskShowcases`, Windows Service, logs/state и место на диске. |
| Разработчик витрины | Публикует static production bundle, соблюдает bundle contract, static serving contract и bridge compatibility. |
| DevOps/release operator | Собирает release, считает `sha256`, публикует manifest, переводит candidate в production. |
| KioskRunner | Технический updater/runtime-компонент доставки и локальной публикации: скачивание, проверка, распаковка, `current`, state, logs, rollback, HTTP static serving, health/status. |
| Embedded static web server | Часть KioskRunner, которая отдаёт только `current` и diagnostics endpoints по локальному stable URL. |
| Apache/Nginx | Optional external reverse/static layer. Не является обязательным компонентом canonical MVP. |
| 1С | Владелец бизнес-процесса: каталог, корзина, поиск, сканирование, маркировка, эквайринг, чек, ККТ, фискализация и состояние продажи. |

## 8. Целевая архитектура

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
  -> KioskRunner embedded web server отдаёт current/
  -> 1С открывает стабильный URL витрины
```

Разделение ответственности:

| Компонент | Делает | Не делает |
| --- | --- | --- |
| KioskRunner | Скачивает manifest и bundle, проверяет `sha256`, распаковывает, переключает `current`, ведёт `state.json`, пишет logs, умеет rollback, поднимает локальный HTTP server, отдаёт static files из `current`, даёт health/status diagnostics. | Не является backend 1С, не управляет корзиной, не принимает бизнес-команды от HTML вместо 1С, не хранит состояние продажи, не делает `git pull`, не исполняет arbitrary scripts из manifest, не даёт directory listing, не отдаёт `downloads/versions/state/logs/config` наружу. |
| Embedded static web server | Слушает configured local endpoint, отдаёт `index.html` и ассеты из `current`, применяет cache policy, блокирует forbidden paths и path traversal, отдаёт локальный health/status. | Не выполняет бизнес-API, не проксирует команды в 1С, не отдаёт служебные папки, не принимает JSON upload. |
| 1С | Открывает стабильный URL и передаёт данные в HTML только нативными механизмами 1С → HTML / HTML ↔ 1С. | Не знает про GitHub, manifest, versions, current-switching, rollback, state/logs runner. |
| GitHub Release / registry | Хранит production manifest, `bundle.zip`, `sha256`, `version`, `channel`, `status`, `bridgeContractVersion`, `minRunnerVersion`. | Не выполняет update на клиентском Windows-узле. |
| Apache/Nginx | Может использоваться только как optional external reverse/static layer, если это отдельно требуется внедрением. | Не является обязательной зависимостью, не является canonical MVP path. |

Runner не является частью `SelfCheckoutRuntimePort`, `OneCInterfaceAdapter` или `window.BolarsSelfCheckout`. Эти bridge/runtime-контракты остаются в HTML/1С-контуре.

## 9. MVP lifecycle

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

`update-once` подготавливает и переключает локальный `current`. Canonical runtime deployment для покупателя - Windows Service, который одновременно обслуживает HTTP endpoint и выполняет update loop. `update-once` полезен для первичной установки, ручной проверки, CI/ops smoke и optional external publishing mode.

MVP не обязан решать все нюансы атомарного directory switch на Windows идеально, но требование продукта жёсткое: успешная старая версия должна остаться доступной, если новая версия не прошла проверку или переключение не завершилось.

## 10. Service lifecycle

Canonical service-mode:

```text
KioskRunner.exe service
```

Windows Service должен выполнять две параллельные ответственности.

Update loop:

- читать `config.json`;
- периодически проверять manifest по `checkIntervalMinutes`;
- выполнять тот же update lifecycle, что `update-once`;
- не запускать параллельные update-процессы для одного `showcaseId`;
- писать logs/state для каждой проверки;
- не ломать `current` при сетевых, manifest, hash или filesystem ошибках.

Web serving:

- стартовать embedded static web server по `webServer.listenHost`, `webServer.port`, `webServer.basePath`;
- постоянно отдавать `current` по stable localhost URL;
- отдавать локальные health/status diagnostics;
- не отдавать служебные папки и файлы;
- переживать update `current` без падения службы;
- корректно останавливаться по сигналу Windows Service Control Manager.

Требования к деградации:

- если update failed, server продолжает отдавать старый `current`;
- если manifest недоступен, server продолжает отдавать старый `current`;
- если порт занят, service пишет ошибку и не считается healthy;
- если `current` отсутствует при первом запуске, health/status показывает `degraded/no_current`;
- если `current` появился после успешного update, server начинает отдавать витрину без ручной перенастройки;
- если web server не стартовал, service status должен явно показывать `web_server_failed`.

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
| `status` | Показать `currentVersion`, `previousVersion`, web server status, последний update status и последнюю ошибку без изменения файлов. |
| `rollback` | Вернуть `previousVersion` в `current`, если версия есть локально. |
| `install` | Установить Windows Service с текущим config/rootDir. |
| `uninstall` | Удалить Windows Service без удаления версий витрин. |
| `start` | Запустить установленную службу. |
| `stop` | Остановить установленную службу. |
| `service` | Рабочий entrypoint службы. |

## 11. First-run validation

При первом запуске runner должен уметь диагностировать bootstrap-проблемы до нормальной работы update loop и web serving.

Обязательные first-run checks:

- `config.json` отсутствует;
- `config.example.json` не скопирован в `config.json`;
- `registryUrl` не задан;
- `registryUrl` ведёт не на manifest;
- `registryUrl` возвращает HTML вместо JSON manifest;
- manifest недоступен;
- manifest не соответствует `showcaseId`;
- bundle недоступен;
- `rootDir` не создан и не может быть создан;
- нет прав на `rootDir`;
- порт занят;
- `listenHost` недоступен;
- `current` отсутствует до первого update;
- service запущен, но витрина ещё не загружена.

Ожидаемое поведение:

- понятная ошибка в logs/status;
- никаких падений без объяснения;
- health показывает `degraded/no_config`, `degraded/no_current`, `unhealthy/port_in_use` или другой явный код;
- web endpoint может отдавать простую диагностическую страницу или 503;
- directory listing остаётся запрещённым даже в degraded mode;
- runner не пытается угадать `registryUrl` из GitHub branch, `main`, `dist` или HTML source repo.

## 12. Embedded Web Server Contract

Минимальные требования:

- web server встроен в KioskRunner Windows Service;
- слушает только configured `listenHost`, по умолчанию `127.0.0.1`;
- порт по умолчанию `8787`;
- `basePath` по умолчанию `/kiosk/{showcaseId}/`;
- root для static serving - `current`;
- request на `basePath` и SPA fallback должны отдавать `index.html`;
- directory listing запрещён;
- доступ к `downloads`, `versions`, `logs`, `state.json`, `config.json` запрещён;
- path traversal protection обязательна;
- MIME types для `html`, `js`, `css`, `json`, `png`, `jpg`, `jpeg`, `svg`, `webp`, `ico`, `woff`, `woff2`, `ttf`, `map` должны быть корректными;
- неизвестный MIME type должен отдаваться безопасно как download/octet-stream или блокироваться по политике MVP;
- `index.html` должен получать `Cache-Control: no-store` или короткий cache;
- fingerprinted assets могут получать long cache policy;
- non-fingerprinted assets должны получать короткий cache;
- health endpoint локальный: `/healthz`;
- status endpoint локальный: `/runner/status` или `/status.json`;
- status не должен раскрывать секреты;
- server должен корректно переживать update `current` без падения службы.

Canonical URL:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Diagnostics endpoints должны быть локальными. По умолчанию нельзя слушать `0.0.0.0`. Открытие listener наружу допустимо только по явному ops-решению и после security review.

Минимальный status payload на уровне PRD:

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "health": "ok",
  "webServer": {
    "listening": true,
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/"
  },
  "currentVersion": "2026.05.28.1",
  "previousVersion": "2026.05.27.1",
  "lastCheckAt": "2026-05-28T12:05:00Z",
  "lastUpdateStatus": "updated",
  "lastSuccessfulUpdateAt": "2026-05-28T12:05:00Z",
  "lastError": null
}
```

Status не является бизнес-API и не содержит корзину, чек, оплату, ФИО, телефоны, токены, внутренние ссылки 1С или коммерческие данные клиента.

## 13. Manifest contract

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
  "minRunnerVersion": "0.3.0",
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
| `minRunnerVersion` | Минимальная версия KioskRunner, которая умеет безопасно поставить и отдать этот bundle. |
| `publishedAt` | Время публикации manifest для аудита и диагностики. |
| `buildCommit` | Коммит исходников витрины, из которого собран bundle. |
| `rollbackVersion` | Рекомендованная версия отката, если release operator явно её указал. MVP rollback всё равно должен работать от локального `previousVersion`. |

Runner должен тянуть только production-версию из production registry/manifest. Он не должен тянуть `main`, `dist`, branch artifacts или произвольный URL без production manifest.

## 14. Bundle contract

`bundle.zip` должен соответствовать требованиям:

- внутри после распаковки должен быть `index.html` в корне bundle;
- должна быть папка `assets` или эквивалентная самодостаточная структура ассетов;
- bundle должен быть static UI shell: HTML, CSS, JS, ассеты;
- bundle не должен содержать бизнес-данные 1С;
- bundle не должен содержать секреты, токены, приватные ключи, `.env`, `.env.deploy`;
- bundle не должен содержать внутренние ссылки объектов 1С;
- bundle должен быть совместим с `bridgeContractVersion` из manifest;
- bundle должен открываться через KioskRunner embedded static web server;
- bundle не должен требовать runner как application backend;
- bundle не должен требовать ручной загрузки JSON пользователем.

Для 1С/V8WebKit-safe artifact остаются обязательны ограничения runtime profile: не закладывать неподтверждённые современные browser features как mandatory path, не требовать CDN, external runtime, обязательный `fetch`, `type=module`, `?.` / `??` или другой неподтверждённый синтаксис. Если используется split-assets bundle через local HTTP, он должен быть проверен в целевой 1С-среде как same-origin static delivery.

## 15. Windows file layout

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
| `current\` | Версия, которую публикует embedded static web server внутри KioskRunner. 1С открывает stable localhost URL, который указывает сюда через server mapping. |
| `logs\` | Логи проверок, обновлений, ошибок, web server status и rollback. |

Путь установки может быть уточнён в ops-решении, но PRD фиксирует принцип: у каждой витрины есть изолированный `rootDir`, а наружу публикуется только `current`.

## 16. Config contract

Минимальный `config.json`:

```json
{
  "runnerId": "kiosk-runner-bolars-001",
  "showcaseId": "bolars",
  "channel": "production",
  "registryUrl": "https://example.com/registry/bolars/production/manifest.json",
  "rootDir": "C:\\KioskShowcases\\bolars",
  "checkIntervalMinutes": 15,
  "keepVersions": 5,
  "autoUpdate": true,
  "webServer": {
    "enabled": true,
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/",
    "staticRoot": "current",
    "enableDirectoryListing": false,
    "healthPath": "/healthz",
    "statusPath": "/runner/status"
  }
}
```

Смысл полей:

| Поле | Смысл |
| --- | --- |
| `runnerId` | Локальный идентификатор установки для logs/diagnostics. Не должен быть секретом. |
| `showcaseId` | Какая витрина обслуживается этим rootDir. |
| `channel` | Канал, который разрешено ставить. Для production-узла - `production`. |
| `registryUrl` | URL production manifest или registry endpoint. Это не URL ветки GitHub и не URL папки `dist`. |
| `rootDir` | Корневая папка витрины. |
| `checkIntervalMinutes` | Интервал проверки для service-mode. |
| `keepVersions` | Сколько распакованных версий сохранять локально. Не должен удалять `current` и `previousVersion`. |
| `autoUpdate` | Разрешает service-mode автоматически применять production update. `update-once` может использовать тот же флаг как guard. |
| `webServer.enabled` | Включает embedded static web server. Для canonical MVP должно быть `true`. |
| `webServer.listenHost` | Host для listener. По умолчанию `127.0.0.1`; `0.0.0.0` запрещён без явного ops-решения. |
| `webServer.port` | Local HTTP port. По умолчанию `8787`. |
| `webServer.basePath` | Stable URL path витрины, например `/kiosk/bolars/`. |
| `webServer.staticRoot` | Относительный root для static serving. В MVP - `current`. |
| `webServer.enableDirectoryListing` | Должно быть `false`; directory listing запрещён. |
| `webServer.healthPath` | Локальный health endpoint. |
| `webServer.statusPath` | Локальный status endpoint без секретов. |

`registryUrl` - это адрес production manifest, из которого runner узнаёт `bundleUrl` и `sha256`. В MVP `registryUrl` может указывать на публично доступный `manifest.json`, опубликованный через GitHub Pages, GitHub Release asset, raw static hosting или простой update-server. Но runner должен трактовать этот URL только как production manifest, а не как рабочую ветку разработки, папку `dist`, source repo или место, откуда можно скачать HTML напрямую.

Пример допустимого смысла URL:

```text
https://updates.example.com/showcases/bolars/production/manifest.json
https://github.com/<org>/<release-repo>/releases/download/bolars-production/manifest.json
```

Реальные секреты, токены и приватные ключи не должны попадать в PRD или репозиторий. Если в будущем потребуется приватный registry, секреты должны жить в защищённом ops/secret-контуре Windows, CI/CD или vault, а не в bundle и не в публичном config example.

## 17. State contract

Минимальный `state.json`:

```json
{
  "currentVersion": "2026.05.28.1",
  "previousVersion": "2026.05.27.1",
  "currentSha256": "64-char-lowercase-hex-sha256",
  "lastCheckAt": "2026-05-28T12:05:00Z",
  "lastUpdateStatus": "updated",
  "lastError": null,
  "lastSuccessfulUpdateAt": "2026-05-28T12:05:00Z",
  "webServerStatus": "listening"
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
| `webServerStatus` | Последнее состояние embedded web server: `listening`, `degraded`, `failed`, `disabled`. |

`state.json` нужен для диагностики, rollback и идемпотентности update-процесса. Он не является источником бизнес-истины и не содержит данные продажи.

## 18. Rollback

MVP rollback-механика:

- если новая версия не прошла manifest/hash/zip/index validation, `current` не переключается;
- если переключение `current` сломалось, runner должен сохранить или восстановить предыдущую рабочую версию;
- `rollback` должен возвращать `previousVersion` в `current`, если эта версия есть в `versions`;
- rollback должен обновить `state.currentVersion`, `state.previousVersion`, `state.currentSha256`, `lastUpdateStatus=rolledBack`;
- web server после rollback должен отдавать восстановленный `current`;
- лог должен фиксировать причину rollback;
- rollback не должен зависеть от GitHub, если предыдущая версия уже есть локально.

Rollback не исправляет бизнес-состояние 1С. Если во время обновления пользовательская сессия была открыта в 1С, именно 1С остаётся владельцем продажи и решает, как восстановить экран через свой snapshot/bridge.

## 19. Failure modes

Общее правило для всех отказов: не ломать текущую витрину, записать ошибку, завершиться с понятным статусом, оставить `previous/current` в согласованном состоянии. Если HTTP server уже отдаёт рабочий `current`, он должен продолжать отдавать старый `current` при неуспешном update.

| Сценарий отказа | Ожидаемое поведение PRD |
| --- | --- |
| Runner artifact скачан, но `config.json` отсутствует | Runner не начинает update; logs/status показывают `no_config`; health `degraded/no_config`; web endpoint может вернуть диагностическую страницу или 503 без directory listing. |
| `config.example.json` не скопирован в `config.json` | Поведение такое же, как `no_config`; runner не использует example как production config автоматически. |
| `registryUrl` не задан | Runner не начинает network update; logs/status показывают `registry_url_missing`; health degraded. |
| `registryUrl` указывает на branch/raw `dist`, а не на manifest | Runner отклоняет ответ как invalid manifest, если JSON shape не соответствует contract; не скачивает HTML напрямую и не пытается угадать bundle. |
| `registryUrl` возвращает HTML вместо JSON manifest | Runner записывает parse/shape error; не меняет `current`; health/status показывают manifest invalid. |
| Manifest недоступен | Не менять `current`; записать `lastUpdateStatus=failed`, `lastError=manifest_unavailable`; web server продолжает отдавать старую витрину. |
| Manifest повреждён | Не скачивать bundle; записать ошибку parse/validation; сохранить текущую версию. |
| Manifest не соответствует `showcaseId` | Отклонить manifest как чужой; не менять `current`; записать mismatch. |
| `status` не production | Не ставить candidate/non-production на production-узел; завершиться как `blocked` или `noop` с диагностикой. |
| `bundleUrl` недоступен | Не менять `current`; сохранить старый bundle; записать download error. |
| Manifest публичен, но `bundleUrl` недоступен | Public/no-auth mode сам по себе допустим, но update неуспешен; runner не меняет `current` и пишет download error. |
| Manifest и bundle доступны публично без auth | Это допустимый MVP mode при условии, что bundle/manifest не содержат секреты и бизнес-данные; runner всё равно проверяет `sha256`. |
| `sha256` не совпал | Удалить или пометить скачанный zip как invalid; не распаковывать в `current`; записать integrity error. |
| Zip повреждён | Не переключать `current`; удалить/изолировать staging; записать unzip error. |
| Нет `index.html` | Считать bundle invalid; не переключать `current`; записать bundle validation error. |
| Битый `index.html` | Не переключать `current`, если проблема найдена до switch; если обнаружено после switch, health/status должен показать degraded, а rollback должен быть доступен. |
| Недостаточно прав на файловую систему | Не продолжать partial update; записать permission error; `current` остаётся старым. |
| Нет места на диске | Прервать до переключения; записать disk space error; не удалять рабочие версии без явной retention-политики. |
| Версия уже установлена | Записать `lastCheckAt`, `lastUpdateStatus=noop`; не скачивать заново без force-режима. |
| `minRunnerVersion` выше текущей версии runner | Отклонить manifest как требующий обновления runner; не менять `current`; записать blocked. |
| Нужно обновить runner, но self-update отсутствует в MVP | Runner пишет `runner_update_required`; внедренец обновляет runner вручную через новый runner artifact; showcase update не применяется. |
| `bridgeContractVersion` несовместим | Не ставить bundle, который текущий HTML ↔ 1С контур не поддерживает; записать compatibility error. |
| `state.json` повреждён | Не выполнять разрушительное переключение; попытаться безопасно диагностировать `current`; записать `invalidState`; требовать восстановления state или явного init-процесса. |
| Частичное обновление после аварийного завершения | На следующем запуске очистить/изолировать staging; сверить `state` и `current`; не считать update успешным без валидного `current`. |
| Port already in use | Web server не стартует; service пишет `port_in_use`; health `unhealthy`; update loop может работать, но canonical URL недоступен. |
| `listenHost` недоступен | Web server не стартует; service пишет `listen_host_unavailable`; health `unhealthy`. |
| Нет прав открыть порт | Web server не стартует; service пишет permission/bind error; health `unhealthy`; не пытаться открыть внешний host автоматически. |
| `current` отсутствует | Health/status показывает `degraded/no_current`; static requests получают понятный 503/404 без directory listing; после успешного update server начинает отдавать витрину. |
| `current` переключается во время HTTP-запроса | Запрос должен завершиться либо старой, либо новой версией без partial file leak; service не должен падать. |
| Запрос пытается выйти за пределы `current` через path traversal | Вернуть 400/403/404; записать security warning без раскрытия путей; не читать файл. |
| Запрос к forbidden paths: `/downloads`, `/versions`, `/logs`, `/state.json`, `/config.json` | Вернуть 403/404; не отдавать содержимое; записать security warning при необходимости. |
| Неизвестный MIME type | Отдать безопасный default или заблокировать по политике MVP; не выполнять как script. |
| Service started, but web server failed | Service status `web_server_failed`; health `unhealthy`; logs содержат bind/config причину без секретов. |
| Update succeeded, but web server still serves stale files | Health/status должен показать mismatch `state.currentVersion` vs served version, если это диагностируемо; требуется cache/switch invalidation и warning в logs. |
| Cache мешает 1С увидеть новую версию | `index.html` должен иметь no-store/short cache; assets policy должна учитывать fingerprinting; status/logs фиксируют текущую версию для диагностики. |
| Пользователь пытается использовать runner без 1С | Static UI может открыться в браузере, но business flow остаётся mock/debug или bridge-dependent по HTML contract; runner не подменяет 1С и не добавляет backend. |
| Runner скачан третьим лицом | Это допустимый риск public MVP; сам runner не содержит секреты и по умолчанию слушает localhost. Лицензирование/tenant binding откладываются в future hardening. |

Ошибки не должны печатать секреты, токены, приватные URL с credentials или содержимое реальных `.env`.

## 20. Security and integrity

`sha256` проверяет целостность bundle относительно manifest. `sha256` не заменяет подпись manifest. Пока manifest публичный и неподписанный, security model MVP основана на доверии к `registryUrl`. Для production hardening нужна подпись manifest/bundle или другой trust mechanism.

Требования:

- `sha256` verification обязательна до распаковки и переключения;
- нельзя исполнять произвольные скрипты из manifest;
- нельзя делать `git pull` рабочей ветки из runner;
- нельзя принимать bundle без production manifest;
- нельзя хранить секреты в публичном manifest;
- нельзя хранить секреты в bundle;
- нельзя хранить токены в `config.example.json`;
- нельзя хранить секреты в публичном `config.json` example;
- нельзя считать public bundle защищённым от копирования;
- нельзя давать 1С URL на версионную папку `versions/<version>/`;
- нельзя превращать runner в application backend;
- нельзя добавлять business API;
- нельзя использовать runner для передачи бизнес-данных 1С в HTML;
- нельзя использовать public/no-auth mode для передачи данных 1С;
- нельзя открывать runner web server наружу только потому, что artifacts публичные;
- нельзя слушать `0.0.0.0` без явного ops-решения;
- нельзя включать directory listing;
- нельзя публиковать `state/config/logs/downloads/versions`;
- path traversal protection обязательна;
- status endpoint не должен раскрывать секреты, внутренние 1С ссылки, телефоны, ФИО, токены или коммерческие данные клиента;
- желательно предусмотреть будущую подпись manifest/bundle, но для MVP достаточно обязательного `sha256` при условии доверенного production registry URL.

Future hardening:

- подпись manifest;
- подпись bundle;
- release signing для `KioskRunner.exe`;
- private registry;
- token-based download;
- runner license/tenant binding;
- allowlist доменов registry;
- TLS pinning или корпоративный certificate policy, если это потребуется клиентским ops;
- отдельный защищённый secret provider для private registry;
- explicit firewall guidance для localhost-only deployment.

## 21. Optional external publishing / reverse proxy mode

Apache/Nginx можно использовать дополнительно, если внедрение требует внешнюю публикацию, reverse proxy, корпоративный TLS, единый порт или существующий ops-стандарт.

Canonical MVP - embedded web server внутри KioskRunner. Apache/Nginx не является обязательной зависимостью.

Допустимые optional profiles:

- reverse proxy from Apache/Nginx to `http://127.0.0.1:8787/kiosk/bolars/`;
- external static publishing from `current`, если клиентская инфраструктура запрещает локальный KioskRunner HTTP listener;
- mixed mode для диагностики, где KioskRunner продолжает update lifecycle, а внешний web server отдаёт `current`.

Если Apache/Nginx используется:

- это отдельный deployment profile;
- он не должен знать про GitHub, production/candidate, manifest, hash и rollback;
- он не должен публиковать `downloads`, `versions`, `logs`, `state.json`, `config.json`;
- он не должен становиться business backend;
- 1С всё равно должна открывать stable URL и не знать внутренние папки.

## 22. 1С handoff

Что нужно знать 1С-программисту / внедренцу:

- стабильный URL теперь выдаёт KioskRunner;
- пример URL: `http://127.0.0.1:8787/kiosk/bolars/`;
- `http://localhost:8787/kiosk/bolars/` допустим, если локальная среда корректно резолвит `localhost`;
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
- runner state/logs, кроме диагностики администратора.

Что 1С не должна делать:

- открывать путь к `versions/<version>`;
- вызывать runner API для бизнес-операций;
- отправлять бизнес-команды в runner вместо HTML bridge;
- считать `/healthz` или `/runner/status` частью кассового процесса;
- использовать ручной JSON upload/import.

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

- runner обновляет и отдаёт только static файлы витрины;
- runner не вызывает методы 1С;
- runner не читает и не пишет чек;
- runner не управляет оплатой, ККТ, сканером или маркировкой;
- runner не заменяет bridge.

## 23. GitHub publishing model

### A. Showcase publishing

Минимальная стратегия публикации HTML-витрины:

1. Исходники витрины живут в GitHub.
2. CI/build собирает static HTML artifact.
3. Результат пакуется в `bundle.zip`.
4. Для `bundle.zip` считается `sha256`.
5. Создаётся `manifest.json`.
6. Release получает статус `candidate`.
7. Candidate проверяется на нужных smoke/visual/1C/static-serving gates.
8. После проверки release operator продвигает manifest/channel/status в `production`.
9. Runner читает только production registry/manifest.

Runner не должен ходить в `main`, `dist`, branch artifacts или raw GitHub files как источник истины для установки. Источник установки - только production manifest, который указывает на конкретный immutable bundle и hash.

### B. Runner publishing

Минимальная стратегия публикации KioskRunner:

1. Исходники runner живут в отдельном repo или отдельной области monorepo.
2. CI/build собирает `KioskRunner.exe`.
3. Release pipeline пакует `KioskRunner-win-x64.zip`.
4. В zip входят `KioskRunner.exe`, `config.example.json`, install/uninstall scripts, `README.md` и license/notice файлы при необходимости.
5. Release публикуется как runner artifact.
6. В MVP внедренец скачивает runner вручную.
7. Self-update runner не входит в MVP.

Runner release и showcase release должны быть разделены. HTML-витрина может обновляться часто через production manifest, а сам runner остаётся установленной инфраструктурной программой до отдельного ops-решения об обновлении.

Future path для showcase publishing:

- заменить GitHub Release registry на production update-server;
- сохранить тот же manifest/bundle/state/webServer contract;
- добавить подписи и access control;
- не менять обязанность 1С открывать только stable URL.

Future path для runner publishing:

- подписывать `KioskRunner.exe`;
- публиковать MSI/installer;
- добавить self-update после отдельного PRD;
- добавить private release registry или central update-server.

## 24. Acceptance criteria

PRD считается принятым, если:

- объясняет, зачем нужен KioskRunner;
- фиксирует embedded static web server как часть KioskRunner;
- не требует Apache для canonical deployment;
- фиксирует разделение 1С / HTML / Runner / optional external proxy / GitHub;
- содержит MVP lifecycle `update-once`;
- содержит service lifecycle с update loop и web serving;
- содержит embedded web server contract;
- содержит `webServer` config contract;
- содержит `listenHost`, `listenPort`, `basePath`, `staticRoot`;
- содержит health/status endpoints;
- содержит static serving security requirements;
- содержит manifest contract;
- содержит bundle contract;
- содержит config/state contracts;
- содержит Windows file layout;
- содержит rollback;
- содержит failure modes;
- содержит port/path/cache failure modes;
- содержит optional external publishing / reverse proxy mode;
- содержит 1С handoff;
- описывает, откуда скачивается сам KioskRunner;
- разделяет runner artifact и showcase artifact;
- описывает first install/bootstrap flow;
- фиксирует, что `registryUrl` указывает на production manifest, а не на branch/dist;
- фиксирует, что config управляет адресами и не хардкодится;
- фиксирует public/no-auth MVP mode;
- описывает риски public MVP;
- откладывает авторизацию, подписи и self-update в future hardening;
- объясняет, что `sha256` не заменяет подпись manifest;
- явно запрещает ручную загрузку JSON;
- явно запрещает `git pull` из runner;
- явно запрещает backend/business ownership внутри runner;
- явно запрещает отдавать служебные папки наружу;
- явно запрещает использовать public/no-auth mode для передачи бизнес-данных 1С;
- явно запрещает заставлять 1С знать про GitHub, versions или manifest;
- не начинает реализацию кода;
- не меняет текущую архитектуру bridge/runtime без отдельного обоснования.

## 25. Open questions

Открытые вопросы не блокируют создание PRD:

- точный путь установки на Windows: `C:\KioskShowcases` или клиентский стандартный путь;
- где будет жить официальный release KioskRunner;
- будет ли отдельный repo для runner или monorepo;
- какой формат installer выбрать: zip, msi, exe installer;
- нужен ли install wizard или достаточно config + PowerShell script;
- нужен ли self-update runner в следующей фазе;
- нужен ли приватный GitHub registry или публичный release;
- когда вводим private registry/auth;
- нужна ли подпись manifest/bundle в MVP или достаточно `sha256`;
- нужна ли подпись `KioskRunner.exe`;
- будет ли tenant/license binding;
- как централизованно управлять config на множестве киосков;
- какая минимальная версия .NET;
- какой .NET hosting stack выбрать для embedded static server;
- как именно происходит promotion `candidate` → `production`;
- какой формат логов нужен: plain text или JSON lines;
- нужен ли отдельный machine-readable health/status файл рядом с HTTP endpoint;
- как тестировать совместимость `bridgeContractVersion`;
- как безопаснее переключать `current` на Windows в MVP: directory replace, staging copy, junction/symlink или другой ops-approved механизм;
- как server должен определять served version для диагностики stale cache;
- какая точная cache policy нужна для fingerprinted и non-fingerprinted assets;
- нужна ли отдельная retention-политика для `downloads`;
- нужен ли explicit `force` режим для переустановки той же версии;
- нужна ли offline-install команда из локального bundle для изолированных клиентских контуров;
- нужен ли HTTPS на localhost или достаточно HTTP для 1С local field;
- какие firewall/endpoint правила нужны, если клиент попросит не-localhost listener.

## 26. Формат результата и запреты для следующего этапа

Этот PRD является одним документом требований. Он не реализует runner, не добавляет код, не меняет Apache/Nginx config и не меняет HTML ↔ 1С bridge.

Следующему агенту нельзя:

- начинать реализацию без отдельной задачи;
- подключать real backend/1C/payment/SBP/KKT/fiscalization/CMS;
- делать runner application backend-ом;
- добавлять business API;
- добавлять авторизацию в MVP как обязательную;
- добавлять self-update runner в MVP как обязательный;
- добавлять ручной JSON upload/import в HTML;
- позволять runner владеть корзиной;
- использовать public/no-auth mode для передачи бизнес-данных 1С;
- заставлять 1С знать про GitHub, versions или manifest;
- возвращать Apache как обязательную зависимость;
- отдавать служебные папки наружу;
- открывать HTTP listener на `0.0.0.0` без явного ops-решения;
- делать directory listing;
- публиковать `state/config/logs/downloads/versions`;
- делать `git pull` как update-механизм;
- печатать или читать реальные `.env` / `.env.deploy`.

## 27. Changelog v0.3

Изменение v0.3:

- добавлен bootstrap/distribution model;
- разделены runner release и showcase release;
- зафиксирован first install flow через `KioskRunner-win-x64.zip`, `config.example.json`, локальный `config.json`, `update-once` и service install;
- уточнено, что runner читает production manifest из `registryUrl`, а не GitHub branch, `main`, `dist` или source repo;
- зафиксирован public/no-auth MVP mode;
- добавлены риски public MVP и ограничения до авторизации;
- уточнено, что `sha256` не заменяет подпись manifest;
- добавлен first-run validation для `no_config`, invalid `registryUrl`, missing `current`, port conflict и других bootstrap-ошибок;
- добавлены future hardening направления: auth, private registry, signed manifest/bundle, signed runner release, tenant/license binding, runner self-update.

Сохранено из v0.2:

- Apache-dependent модель заменена на embedded web-server модель внутри KioskRunner;
- canonical URL для 1С остаётся `http://127.0.0.1:8787/kiosk/bolars/`;
- Apache/Nginx остаются optional external publishing / reverse proxy mode;
- сохранены инварианты: 1С владеет бизнес-логикой, HTML остаётся visual/bridge shell, runner не становится backend.
