# Blueprint: 1C HTML Shell Diagnostic Harness

Дата: 2026-05-19
Статус: v0.2 refined technical blueprint
Версия документа: v0.2
Основание: `PRD_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`

## 1. Scope

Этот Blueprint описывает, как реализовать диагностическую страницу **1C HTML Shell Diagnostic Harness**. Это не финальная касса, не покупательская HTML-оболочка и не RMK Adapter. Это безопасный диагностический инструмент, который собирает evidence о конкретной HTML-среде и формирует переносимый JSON-профиль среды запуска.

Primary URL:

```text
GET /diagnostics/1c-html-shell
```

Optional saved report:

```text
GET /diagnostics/1c-html-shell/report/{runId}
```

Optional collector:

```text
POST /api/diagnostics/1c-html-shell/reports
```

## 2. Runtime Architecture

Разделить четыре слоя:

| Layer | Required | Description |
|---|---:|---|
| Legacy-safe diagnostic page | yes | Страница, которую открывает 1С. Максимально простой HTML/CSS/JS, standalone single-file baseline, classic script. |
| Human report page | optional vNext | Просмотр сохраненного отчета в обычном браузере; может использовать основной web stack. |
| Backend collector | optional vNext | Принимает диагностический JSON, возвращает `runId` и `reportUrl`. |
| 1C bridge probe contract | optional Slice 2 | Минимальный диагностический обработчик на стороне 1С для проверки HTML <-> 1С. |

Если основной сайт реализован на React/Vite, diagnostic runtime page все равно должна быть standalone legacy-safe artifact. Она не должна зависеть от React hydration, ES modules, service worker, CDN, heavy CSS pipeline или современного browser runtime.

Mandatory first-version delivery shape:

```text
public/diagnostics/1c-html-shell/index.html
```

`index.html` первой диагностической версии должен быть single-file: inline CSS и inline classic JavaScript. Это обязательный baseline для первого запуска в 1С.

Причина: если 1С загрузит HTML, но не загрузит внешний CSS или JS, команда не должна гадать, где проблема: в HTML-render, путях, кэше, TLS, загрузке ресурсов или политике WebView.

Optional split-assets variant после подтверждения загрузки ресурсов:

```text
public/diagnostics/1c-html-shell/index.html
public/diagnostics/1c-html-shell/diagnostic.css
public/diagnostics/1c-html-shell/diagnostic.legacy.js
```

Split-assets variant разрешен только после того, как single-file diagnostics показывает, что ресурсные тесты `resource.loading.css` и `resource.loading.js` проходят в целевой среде.

## 2.1. Human Text Language

Весь человеко-видимый текст страницы должен быть на русском языке. Текст должен быть понятен владельцу бизнеса, техническому специалисту клиента, 1С-программисту и человеку без web-разработческого контекста.

В интерфейсе использовать русские формулировки:

| Технический термин | Текст на странице |
|---|---|
| Runtime Profile | Профиль среды запуска |
| Safe Bootloader | Безопасный пошаговый запуск |
| Bridge | Обмен HTML <-> 1С / диагностический мост обмена |
| FrontShell | Покупательская HTML-оболочка |
| Backend collector | Сохранение отчета на сервере |
| Report | Отчет |
| Status | Статус |

Internal JSON fields, protocol names and route names may stay English.

## 3. Verdict Scope / Page Modes

`verdictScope` defines how far the result can be trusted.

| verdictScope | How detected | Human-facing explanation |
|---|---|---|
| `browser_only` | обычный browser, no 1C loader | Этот отчет получен в обычном браузере. Он не доказывает, что страница так же работает внутри 1С. |
| `one_c_html_field_unconnected` | manual mode/query or 1C markers, no loader response | Этот отчет получен внутри Поля HTML-документа 1С, но обмен HTML <-> 1С еще не подключен. |
| `one_c_html_field_with_loader` | loader sends handshake/metadata | Этот отчет получен внутри 1С с подключенным диагностическим обменом HTML <-> 1С. |
| `saved_report` | `/report/{runId}` | Пользователь смотрит ранее сохраненный отчет. |
| `unknown` | detection inconclusive | Среду запуска определить нельзя. |

Auto-detection cannot be trusted as proof of 1С. The page should let the 1C specialist manually set `terminalLabel` and should record explicit loader metadata when provided.

Обычный запуск в браузере никогда не должен интерпретироваться как пригодность 1С-среды.

## 3.1. Cache / Freshness Strategy

Requirements:

- diagnostic page must visibly show `diagnosticBuildId`;
- URL supports `build` or `v`;
- URL supports `runId`;
- actual `pageUrl` and `diagnosticBuildId` are saved into JSON;
- 1C specialist instructions must say: for repeated checks, open the URL with a new `runId`;
- diagnostic URL should be served with no-cache headers when deployment allows it;
- if no-cache headers are not implemented yet, visible `diagnosticBuildId` is mandatory.

Example:

```text
/diagnostics/1c-html-shell?runId=test-001&v=2026-05-19-01
```

Recommended headers for the single-file diagnostic HTML:

```text
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

## 4. Safe Boot Phases

### Phase 0: Static HTML Boot

Purpose: show Russian human-readable text even if JS fails. Phase 0 must work from the single-file HTML without external CSS/JS.

Tests:

- static legend visible;
- manual instructions visible;
- static "JavaScript еще не запустился" state visible.

Success: HTML rendered enough to read the page.
Fail: cannot be detected by JS; user will see broken/blank page.
Continue: no JS dependency.

### Phase 1: Safe JS Bootstrap

Purpose: start minimal classic JS and create partial report.

Bootstrap JavaScript must not rely on:

- Promise;
- async/await;
- fetch;
- performance.now;
- CSS.supports;
- const/let;
- arrow functions;
- optional chaining;
- class syntax;
- modules;
- eval;
- external libraries.

Allowed baseline:

- `var`;
- `function`;
- `try/catch`;
- `setTimeout`;
- `Date`;
- simple objects and arrays;
- `document.getElementById`;
- safe `textContent` and tightly controlled `innerHTML`;
- `onclick` fallback.

Tests:

- classic script executed;
- `window.DiagnosticHarness` created;
- `try/catch` works;
- basic DOM write works;
- `Date` and simple string/array/object operations work.

Success: initial `boot.jsStarted = true`.
Fail: static page remains with "JS failed" instructions.
Timeout: 2000 ms for visible bootstrap progress.
Continue: if failed, later phases cannot run; static manual instructions remain.

### Phase 2: Environment Probe

Purpose: capture browser/WebView/terminal shape.

Tests:

- `navigator.userAgent`;
- `navigator.language`;
- `location.href`;
- viewport width/height;
- `screen.width/height`;
- `devicePixelRatio`;
- timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone` if available;
- `matchMedia`;
- pointer/touch signals: `ontouchstart`, `navigator.maxTouchPoints`, pointer events.

Success: core environment fields populated.
Fail: individual fields become `unknown`; phase can still pass partially.
Timeout: 1000 ms.
Continue: always.

Additional first-version metadata:

- `diagnosticVersion`;
- `reportSchemaVersion`;
- `testPackVersion`;
- `diagnosticBuildId`;
- `buildTimestamp`;
- `runId`;
- `verdictScope`;
- `terminalLabel` if provided manually or via query.

### Phase 3: CSS Capability Probe

Purpose: determine visual baseline for future FrontShell.

Tests:

- `CSS.supports` availability;
- flex layout measured via hidden test element;
- grid layout measured via hidden test element;
- CSS variables applied to computed style;
- transitions property accepted and short transition callback if practical;
- transforms computed style;
- box-shadow computed style;
- border-radius computed style;
- media query result;
- overflow/scroll container behavior;
- fixed/sticky support if measurable.
- external CSS loading as separate optional test `resource.loading.css`.

Success: each capability gets a status.
Fail: failed capability recorded; do not fail phase globally unless DOM style testing is impossible.
Timeout: 3000 ms.
Continue: always.

### Phase 4: SVG / Visual Probe

Purpose: verify risky visual features separately from baseline HTML/CSS.

Tests:

- inline SVG element renders measurable bounding box;
- SVG icon shape visible by DOM/bounding box heuristic;
- basic SVG animation element can be inserted;
- CSS animation on simple element starts;
- static image data URI or local asset if included;
- visual card grid render of 50, then optionally 100, cards;
- paint/layout duration via `performance.now` if available.
- external JS loading as separate optional test `resource.loading.js`.

Success: static render and measured duration recorded.
Fail: SVG animation failure does not affect HTML baseline.
Timeout: 5000 ms.
Continue: always.

### Phase 5: UX / Touch / Input Probe

Purpose: evaluate buyer-facing interaction basics.

Tests:

- click event on large button;
- double click / duplicate click debounce sample;
- pointerdown/pointerup if supported;
- touchstart/touchend if supported or `not_applicable`;
- focus on input;
- text input change;
- virtual keyboard cannot be reliably detected, record `unknown`;
- scroll container responds to programmatic scroll and manual test prompt;
- large button hit area dimensions.

Success: interaction events are captured or marked not applicable.
Fail: event missing after synthetic/manual prompt timeout.
Timeout: 10000 ms for manual interaction section.
Continue: always.

### Phase 6: Network / Report Probe

Purpose: determine if local report export and optional automatic report sending are possible. Automatic server sending is vNext and not required for Slice 1.

Tests:

- `fetch` existence;
- optional `fetch POST` to collector endpoint if enabled;
- XHR existence;
- optional XHR POST fallback;
- Blob/download support;
- anchor `download` support if detectable;
- clipboard API;
- manual textarea JSON copy fallback.

Success: at least visible JSON and manual copy fallback are available after JS bootstrap.
Fail: network send failure recorded; report remains local.
Timeout: 5000 ms per network request.
Continue: always.

### Phase 7: Bridge Probe

Purpose: test HTML <-> 1С only when 1С Diagnostic Loader is connected.

Diagnostic protocol `diag.*` is not the production cashier bridge. It must not call or imitate production commands such as `cart.addProduct`, `payment.startCard` or `receipt.getStatus`.

Tests:

- loader handshake;
- HTML -> 1С href/navigation transport;
- HTML -> 1С DOM mailbox transport;
- 1С -> HTML direct JS call;
- 1С -> HTML DOM mailbox update;
- requestId echo;
- round-trip latency;
- payload size thresholds;
- duplicate command/idempotency behavior.

Success: per-transport capability statuses recorded.
Fail: if loader absent, all bridge tests become `not_connected`; if loader present and a transport fails, that transport becomes `failed`.
Timeout: 3000 ms per bridge command unless configured by loader.
Continue: always.

### Phase 8: RMK Adapter Status

Purpose: explicitly prevent false production readiness.

Tests:

- no live RMK tests in this page;
- set `rmkAdapter.status = "not_tested"`;
- list out-of-scope capabilities: receipt, cart mutation, payment, KKT, fiscalization, marking.

Success: default status is visible and included in JSON.
Fail: not applicable.
Continue: final report.

## 5. Test Runner

Each test is a small object:

```js
{
  id: "css.flex.measure",
  phase: "css",
  label: "CSS Flex measured layout",
  risk: "baseline",
  timeoutMs: 2000,
  dependsOn: ["boot.domWrite"],
  run: function (ctx) {},
  onFail: "record_and_continue"
}
```

Rules:

- every test runs inside `try/catch`;
- every test has a timeout wrapper implemented with `setTimeout`, not Promise;
- a thrown error becomes `failed`;
- a timeout becomes `timeout`;
- missing dependency becomes `not_tested`;
- unsupported by environment becomes `not_applicable`;
- optional external dependency absent becomes `not_connected`;
- results are written immediately;
- JSON report is refreshed after every phase;
- partial report is always available after Phase 1;
- the runner never uses `eval`.
- the boot runner does not require Promise, fetch, modules, arrow functions or modern syntax.

Minimal result object:

```json
{
  "id": "css.grid.measure",
  "phase": "css",
  "status": "supported",
  "durationMs": 4,
  "value": true,
  "error": null,
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

Status labels for human UI:

| Internal status | Russian UI label |
|---|---|
| `supported` | Поддерживается |
| `partially_supported` | Работает частично |
| `failed` | Проверка завершилась ошибкой |
| `timeout` | Нет ответа за отведенное время |
| `unknown` | Не удалось определить |
| `not_tested` | Не проверялось |
| `not_applicable` | Не относится к этому режиму |
| `not_connected` | Не подключено |

The UI must show text labels, not color alone.

## 6. Runtime Profile JSON Schema

Top-level schema:

```json
{
  "diagnosticVersion": "0.1",
  "reportSchemaVersion": "0.2",
  "testPackVersion": "0.2",
  "diagnosticBuildId": "diag-2026-05-19-01",
  "buildTimestamp": "2026-05-19T00:00:00.000Z",
  "runId": "diag-20260519-uuid",
  "timestamp": "2026-05-19T00:00:00.000Z",
  "pageUrl": "https://kassa.speechbattle.com/diagnostics/1c-html-shell",
  "mode": "one_c_html_field_unconnected",
  "verdictScope": "one_c_html_field_unconnected",
  "boot": {},
  "phases": [],
  "environment": {},
  "css": {},
  "js": {},
  "ux": {},
  "performance": {},
  "network": {},
  "bridge": {},
  "rmkAdapter": {},
  "warnings": [],
  "recommendations": [],
  "humanNotes": {},
  "manualObservations": {},
  "rawTestResults": []
}
```

Field details:

| Field | Required | Description |
|---|---:|---|
| `diagnosticVersion` | yes | Schema/test version. |
| `reportSchemaVersion` | yes | JSON report schema version. |
| `testPackVersion` | yes | Version of the diagnostic test set. |
| `diagnosticBuildId` | yes | Build id visible on the page. |
| `buildTimestamp` | no | Build timestamp if available. |
| `runId` | yes | Client-generated id; backend may reuse it or assign canonical id. |
| `timestamp` | yes | First successful JS boot timestamp. |
| `pageUrl` | yes | Current page URL without secrets. |
| `mode` | yes | Runtime mode. |
| `verdictScope` | yes | Scope where the verdict is valid. |
| `boot` | yes | Static/JS boot status and errors. |
| `phases` | yes | Phase status summaries. |
| `environment` | yes | UA, viewport, screen, language, timezone, touch/pointer. |
| `css` | yes | CSS capability statuses. |
| `js` | yes | JS capability statuses. |
| `ux` | yes | Interaction statuses. |
| `performance` | yes | Visual grid timing and rough thresholds. |
| `network` | yes | fetch/XHR/report/copy/download statuses. |
| `bridge` | yes | Loader status and transport results. |
| `rmkAdapter` | yes | Always `not_tested` unless a separate RMK diagnostic exists. |
| `warnings` | yes | Human-readable warnings. |
| `recommendations` | yes | Derived recommendations. |
| `humanNotes` | yes | Optional manually entered terminal label/notes. |
| `manualObservations` | yes | Human observations from the actual terminal. |
| `rawTestResults` | yes | Full test result list. |

Manual observations schema:

```json
{
  "manualObservations": {
    "visualOpenedCorrectly": "yes|no|partially",
    "blankScreenOrArtifacts": "string",
    "manualScroll": "yes|no|partially|not_tested",
    "manualTouch": "yes|no|partially|not_tested",
    "inputFocus": "yes|no|partially|not_tested",
    "virtualKeyboard": "yes|no|partially|not_tested",
    "visibleLag": "yes|no|partially",
    "screenshotTaken": "yes|no",
    "specialistComment": "string",
    "observerComment": "string"
  }
}
```

Sanitization:

- remove query params that look like tokens/secrets;
- do not include cookies;
- do not include localStorage values;
- do not include clipboard content;
- do not include product/check/payment/fiscal data.

## 7. Bridge Diagnostic Contract

This contract is diagnostic only. It is not the production `1C_HTML_SHELL_BRIDGE` contract for the future cashier shell.

Do not mix:

- diagnostic commands: `diag.ready`, `diag.ping`, `diag.hrefTransport`, `diag.domMailbox`;
- production commands: `cart.addProduct`, `payment.startCard`, `receipt.getStatus`, etc.

Production bridge commands remain in `1C_HTML_SHELL_BRIDGE_MANIFEST.md`.

The diagnostic page exposes:

```js
window.DiagnosticHarness = {
  receiveFrom1C: function (message) {},
  receiveBridgeAck: function (message) {},
  receiveStateFrom1C: function (state) {},
  getCurrentReport: function () {},
  renderReport: function (report) {}
};
```

Methods:

| Method | Called by | Purpose |
|---|---|---|
| `receiveFrom1C(message)` | 1С loader | Generic inbound diagnostic message. |
| `receiveBridgeAck(message)` | 1С loader | Echo/ack for requestId and latency measurement. |
| `receiveStateFrom1C(state)` | 1С loader | Optional 1С environment metadata, not cashier state. |
| `getCurrentReport()` | 1С loader/human console | Return current sanitized report object. |
| `renderReport(report)` | page/report viewer | Render report from object. |

Diagnostic commands:

| Command | Direction | Meaning |
|---|---|---|
| `diag.ready` | HTML -> 1С | Page booted and ready for bridge probe. |
| `diag.ping` | HTML -> 1С -> HTML | Basic round-trip. |
| `diag.hrefTransport` | HTML -> 1С | Test custom href/navigation receiver. |
| `diag.domMailbox` | HTML -> 1С | Test hidden mailbox receiver. |
| `diag.directJsCall` | 1С -> HTML | Test direct JS call into `DiagnosticHarness`. |
| `diag.payloadSize` | both | Test small/medium payload limits. |
| `diag.roundTrip` | both | Measure latency with requestId echo. |
| `diag.getEnvironmentFrom1C` | HTML -> 1С | Ask loader to send explicit 1С metadata. |

Transport: href/navigation

```text
oneshell://diag?payload=<encoded-json>
```

Transport: DOM mailbox

```html
<textarea id="diagnostic-command-mailbox" hidden></textarea>
<button id="diagnostic-command-trigger" data-diagnostic-command="" hidden></button>
```

Command envelope:

```json
{
  "diagnosticVersion": "0.1",
  "requestId": "diag-req-001",
  "command": "diag.ping",
  "payload": {},
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

1C response envelope:

```json
{
  "diagnosticVersion": "0.1",
  "requestId": "diag-req-001",
  "ok": true,
  "source": "1c-diagnostic-loader",
  "payload": {
    "echo": true
  },
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

Loader metadata payload may include only explicitly safe values:

```json
{
  "platformVersion": "8.3.x",
  "clientType": "thin|thick|web|unknown",
  "configurationName": "Retail|UNF|UT|custom|unknown",
  "configurationVersion": "string-or-null",
  "compatibilityMode": "string-or-null",
  "terminalLabel": "manual label"
}
```

## 8. UI Blueprint

Baseline UI must work without modern CSS. Use semantic HTML sections, simple tables and lists. Enhanced cards, status pills, sticky nav and grid are progressive only.

All visible labels and explanations must be Russian. English may appear only in technical field names, URLs, JSON keys and protocol command examples.

Sections:

1. **Заголовок / легенда**
   Название, цель, предупреждение, что это не проверка готовности кассы, короткое объяснение покупательской HTML-оболочки.

2. **Безопасный пошаговый запуск**
   Список фаз, статус, текущая фаза, последняя ошибка.

3. **Общий вывод**
   Общий вердикт, `verdictScope`, `runId`, время, `diagnosticBuildId`, действия с отчетом.

4. **Профиль среды запуска**
   User agent, viewport, screen, DPR, language, timezone, touch/pointer.

5. **HTML/CSS**
   Flex/grid/variables/transitions/transforms/shadows/border-radius/media/scroll/fixed/sticky/SVG.

6. **JavaScript**
   Classic script, JSON, timers, Promise, fetch, XHR, storage, DOM events, clipboard.

7. **Ввод, касания и прокрутка**
   Автоматические и ручные проверки, крупная кнопка, фокус, ввод, прокрутка.

8. **Визуальная производительность**
   50/100 карточек, время отрисовки, пороговый результат, рекомендации.

9. **Отчет и сеть**
   Fetch/XHR/send/copy/download statuses; человек видит русские подписи.

10. **Обмен HTML <-> 1С**
   Статус loader, transports, latency, payload size, duplicate command behavior.

11. **RMK Adapter**
   Always clear: `not_tested` by this page. Lists what remains out of scope.

12. **Ручные наблюдения**
   Поля: визуально открылась корректно, артефакты, ручная прокрутка, касания, фокус, экранная клавиатура, задержки, скриншот, комментарий 1С-специалиста, комментарий наблюдателя.

13. **Рекомендации**
   Derived next actions, shown in Russian.

14. **JSON-отчет**
   Read-only textarea/pre, Copy JSON, Download JSON, optional Send Report.

15. **Инструкция для 1С-специалиста**
   Какой URL открыть, где открыть URL в 1С, какие query-параметры можно передать, что такое `runId`, что такое `terminalLabel`, что скопировать после теста, как скачать JSON, что значит "обмен HTML <-> 1С не подключен", что нужно сделать для проверки диагностического обмена, чего нельзя отправлять в отчете, почему этот тест не проверяет РМК, оплату и ККТ.

Status display:

- use text labels, not color alone;
- every status has a short explanation;
- warning banner for `RMK adapter not_tested`;
- copy/download controls remain visible even when network send fails.

Recommended visible scope messages:

- `browser_only`: "Этот отчет получен в обычном браузере. Он не доказывает, что страница так же работает внутри 1С."
- `one_c_html_field_unconnected`: "Этот отчет получен внутри Поля HTML-документа 1С, но обмен HTML <-> 1С еще не подключен."
- `one_c_html_field_with_loader`: "Этот отчет получен внутри 1С с подключенным диагностическим обменом HTML <-> 1С."

## 9. Human Report Page

This page is optional vNext. Slice 1 does not require saved reports.

If backend collector exists, `/diagnostics/1c-html-shell/report/{runId}`:

- fetches saved sanitized Runtime Profile;
- renders overview and matrix in normal browser;
- shows JSON;
- shows recommendations and warnings;
- does not require opening inside 1С;
- may use the main app stack if clearly separated from legacy diagnostic runtime.

Report page must not mutate diagnostic data. It is a viewer.

## 10. Backend Collector

Backend collector is strict optional vNext. First implementation is successful without it if the page opens, runs local diagnostics, shows a report, and lets a human copy or download JSON.

Optional endpoint:

```text
POST /api/diagnostics/1c-html-shell/reports
```

Request:

```json
{
  "diagnosticVersion": "0.1",
  "runId": "diag-...",
  "report": {}
}
```

Response:

```json
{
  "ok": true,
  "runId": "diag-...",
  "reportUrl": "https://kassa.speechbattle.com/diagnostics/1c-html-shell/report/diag-..."
}
```

Requirements:

- accept only diagnostic JSON;
- validate `diagnosticVersion`;
- validate `reportSchemaVersion`;
- enforce payload size limit, recommended initial cap 256 KB;
- reject obvious secrets fields: password, token, cookie, card, fiscal payload;
- do not log full raw report by default;
- log runId, schema version, high-level statuses and technical errors;
- return safe error messages;
- CORS policy should be explicit if external 1С clients need to POST;
- collector is optional vNext, not required for field diagnosis.
- report contains technical environment data, not cashier data.

Access and storage policy:

- `reportId` must be hard to guess;
- prefer accessToken or unguessable report URL;
- define TTL for stored reports;
- do not store reports indefinitely without a specific reason;
- provide report deletion path or admin deletion procedure;
- do not log raw report fully by default;
- strip fields that look like passwords, tokens, cookies, card numbers or secrets;
- enforce payload size before persistence.

Mandatory fallback when collector absent:

- JSON visible in textarea/pre;
- Copy JSON via clipboard if possible;
- manual select/copy instructions;
- Download JSON if Blob/download is supported.

## 11. Recommendations Engine

Recommendations are deterministic rules over statuses. Human-facing recommendation text must be Russian.

Examples:

| Condition | Recommendation |
|---|---|
| CSS grid `failed` / `timeout` | Не использовать CSS Grid в базовой покупательской HTML-оболочке; использовать block/flex fallback. |
| CSS variables `failed` | Заранее собирать theme tokens в статические CSS-значения. |
| SVG render `failed` | Использовать PNG/text/icon fallback. |
| SVG animation `failed` / `timeout` | Не использовать SVG-анимацию. |
| transitions/transforms `failed` | Не использовать анимированные переходы экранов; применять мгновенную смену состояния. |
| fetch `failed`, XHR `supported` | Для отправки отчета использовать XHR fallback; не полагаться на fetch. |
| fetch and XHR fail | Использовать только ручное копирование/скачивание JSON. |
| clipboard `failed` | Показать ручную инструкцию "выделить и скопировать JSON". |
| bridge `not_connected` | Нужен 1С Diagnostic Loader перед выводами об обмене HTML <-> 1С. |
| direct JS call `failed`, DOM mailbox `supported` | Для 1С -> HTML использовать DOM mailbox fallback. |
| href transport `failed`, DOM mailbox `supported` | Для HTML -> 1С предпочесть DOM mailbox. |
| touch/click unstable | Не переходить к production UI без отдельного touch spike на терминале. |
| visual grid slow | Делать экраны плотных списков легче; избегать тяжелых теней, картинок и анимаций. |
| RMK adapter `not_tested` | Не делать вывод о готовности кассы. |
| `resource.loading.css` failed | Оставить первый 1С diagnostic и baseline shell single-file; загрузку внешних ресурсов исследовать отдельно. |
| `resource.loading.js` failed | Не зависеть от внешних JS bundles внутри 1С, пока загрузка ресурсов не исправлена. |
| `verdictScope = browser_only` | Считать результат только браузерной диагностикой; перед решениями по FrontShell запустить страницу внутри 1С. |

Verdict derivation should be conservative. A successful browser run should not imply 1С readiness.

## 12. Acceptance Criteria

Implementation is ready when:

- first diagnostic runtime is available as single-file HTML with inline CSS and inline classic JS;
- `/diagnostics/1c-html-shell` opens in a normal browser;
- the same URL can be opened inside 1С HTML field by a 1С specialist;
- static legend is visible before JS;
- diagnostics starts with minimal boot;
- failure of one test does not break later tests;
- every test result is `supported`, `partially_supported`, `failed`, `timeout`, `unknown`, `not_tested`, `not_applicable` or `not_connected`;
- human report is readable;
- JSON is formed after JS bootstrap;
- JSON can be manually copied;
- JSON can be downloaded when Blob/download works;
- optional send report failure does not lose local report;
- backend collector is not required for Slice 1 acceptance;
- bridge tests show `not_connected` without 1С loader;
- RMK adapter defaults to `not_tested`;
- `verdictScope` is visible and stored in JSON;
- `manualObservations` are visible and stored in JSON;
- `diagnosticBuildId` is visible and stored in JSON;
- instructions for 1C specialist are visible or linked;
- report explains what is and is not checked;
- no real 1С/backend/payment/SBP/KKT/fiscalization integration is added.

## 13. Risks / Blind Spots

- Successful URL loading does not prove cashier readiness.
- Successful browser-only run does not prove 1C HTML field readiness.
- Successful HTML-render does not prove RMK access.
- Successful bridge does not prove payment, KKT, fiscalization or marking access.
- External URL is convenient for diagnosis; production delivery/update strategy is separate.
- HTML-render may differ between thick, thin and web clients.
- OS and platform version may change WebKit/WebView behavior.
- Touch/focus/input may differ on the actual terminal.
- Synthetic tests do not fully replace manual terminal observation.
- Report payload itself can be distorted if JSON/string APIs are broken; keep raw test results and visible warnings.
- Backend collector availability must not become a prerequisite for diagnosis.
- Split assets may fail even when single-file HTML works; resource loading must be tested separately.

Treat results as evidence, not guarantee.

## 14. Handoff To Implementation

Create documentation:

- `docs/integrations/1c-html-shell/PRD_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`;
- `docs/integrations/1c-html-shell/BLUEPRINT_1C_HTML_SHELL_DIAGNOSTIC_HARNESS.md`;
- `docs/integrations/1c-html-shell/1C_HTML_SHELL_DIAGNOSTIC_GUIDE_FOR_1C_SPECIALIST.md` or a prominent runtime page section.

Create static runtime:

- route or static path `/diagnostics/1c-html-shell`;
- single-file legacy-safe `index.html` with inline CSS and inline classic JS;
- no external CSS/JS as a startup dependency;
- optional tests `resource.loading.css` and `resource.loading.js`;
- no React/Vite requirement inside diagnostic runtime.

Implemented Slice 1 artifact:

```text
public/diagnostics/1c-html-shell/index.html
```

Implemented cache route:

```text
nginx.conf
```

`/diagnostics/1c-html-shell` and `/diagnostics/1c-html-shell/` are served with no-cache headers. The diagnostic page itself remains single-file and does not use external CSS/JS as a startup dependency.

Optional vNext:

- `POST /api/diagnostics/1c-html-shell/reports`;
- `/diagnostics/1c-html-shell/report/{runId}`;
- saved report viewer.
- TTL/delete policy;
- comparing multiple reports.

Test scenarios:

1. Normal desktop browser.
2. Android Chrome on target tablet if available.
3. 1С HTML field without Diagnostic Loader.
4. 1С HTML field with minimal Diagnostic Loader.
5. Network blocked / collector unavailable.
6. Clipboard unavailable.
7. Slow render simulation with heavy visual grid.

Next stage input:

- attach Runtime Profile JSON from normal browser;
- attach Runtime Profile JSON from 1С HTML field;
- attach bridge probe report if loader is connected;
- separately run RMK Adapter spike before any cashier readiness conclusion.

## 15. Recommended Implementation Slices

### Slice 1

- single-file diagnostic HTML;
- русская легенда;
- safe boot phases 0-6;
- визуальный отчет;
- JSON report;
- Copy JSON;
- manual copy fallback;
- Download JSON, если поддерживается;
- bridge = `not_connected`;
- RMK adapter = `not_tested`;
- без backend collector;
- без 1С loader;
- без React/Vite runtime внутри диагностической страницы.

### Slice 2

- минимальный 1С Diagnostic Loader;
- `diag.ping`;
- href/navigation transport;
- DOM mailbox transport;
- direct JS call test;
- bridge JSON update.

### Slice 3 / vNext

- backend collector;
- saved report page;
- reportUrl;
- TTL/delete policy;
- сравнение нескольких отчетов.

## 16. Summary v0.2

Готово к реализации:

- single-file baseline;
- русскоязычный человеко-понятный интерфейс;
- conservative boot JavaScript;
- versioned JSON report;
- `verdictScope`;
- manual observations;
- cache/freshness strategy;
- strict optional backend collector;
- separation of diagnostic `diag.*` from production bridge commands.

Не является блокером:

- backend collector;
- saved report page;
- 1С Diagnostic Loader;
- RMK Adapter spike;
- split-assets variant.

Первым implementation slice должен быть Slice 1 из раздела выше.

## 17. Changelog v0.2

Что изменено:

- single-file diagnostic HTML стал обязательным baseline первой версии;
- добавлены `resource.loading.css` и `resource.loading.js`;
- добавлен `verdictScope` с человеко-видимыми предупреждениями;
- добавлены `reportSchemaVersion`, `testPackVersion`, `diagnosticBuildId`, `buildTimestamp`;
- добавлена Cache / Freshness Strategy;
- добавлен guide для 1С-специалиста;
- добавлен `manualObservations`;
- загрузочный JavaScript сделан еще более консервативным;
- backend collector переведен в strict optional vNext;
- добавлены требования доступа/TTL/delete для сохраненных отчетов;
- диагностический `diag.*` отделен от production bridge;
- добавлены русские labels статусов и требования к русскому интерфейсу;
- добавлены recommended implementation slices.

Почему изменено:

- чтобы первый срез диагностики не зависел от внешних CSS/JS;
- чтобы отчет понимали не только web-разработчики;
- чтобы браузерные результаты не смешивались с результатами внутри 1С;
- чтобы старые и новые отчеты можно было сравнивать;
- чтобы серверное сохранение не стало блокером первой проверки.

Optional / vNext:

- backend collector;
- saved report page;
- reportUrl;
- TTL/delete implementation;
- сравнение отчетов;
- 1С Diagnostic Loader;
- RMK Adapter spike.

## 18. Sources

- 1С, HTML-документы: https://v8.1c.ru/platforma/html-dokumenty/
- 1С, JSON: https://v8.1c.ru/platforma/json/
- Стандарт 1С по ограничению HTML-поля: https://v8std.ru/std/730/
- Yellow ERP reference, `HTMLDocumentField`: https://yellow-erp.com/help/sh/objects/catalog56/catalog86/HTMLDocumentField.html/
- Habr, практическое использование поля HTML-документа и события `ПриНажатии`: https://habr.com/ru/companies/lad_/articles/813177/
