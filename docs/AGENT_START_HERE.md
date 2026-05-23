# Agent Start Here: BOLARS Self-Checkout MVP

Статус: implementation handoff
Дата: 2026-05-23
Назначение: короткая точка входа для агента, который будет реализовывать BOLARS Self-Checkout MVP.

## 1. Что Строим

BOLARS Self-Checkout MVP: adaptive, scan-first касса самообслуживания для сенсорного терминала магазина строительных материалов. Portrait `1080x1920` остаётся reference viewport из эскизов, но рабочий UI обязан поддерживать landscape tablet/WebView через `landscapeCompact` правила.

Это не интернет-магазин, не каталог товаров, не админка и не перенос старой showcase-витрины. Frontend является визуальным слоем: он отправляет typed commands в `SelfCheckoutRuntimePort` и отображает authoritative state snapshot.

Canonical route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp
```

Debug route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1
```

Preview route:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1
```

Theme override examples:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?theme=bolars-light-contrast
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1&theme=bolars-light-promo
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1&theme=bolars-light-magenta-soft
```

Selectable MVP profiles: `bolars-light-default`, `bolars-light-contrast`, `bolars-light-clean`, `bolars-light-promo`, `bolars-light-magenta-soft`. `custom` and `bolars-dark-optional` remain reserved and must not become production theme editor scope.

Старый showcase остаётся отдельным контуром и не переносится на этот URL.

## 2. Что Читать Первым

1. `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
2. `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
3. `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md`
4. `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
5. `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
6. `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
7. `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
8. `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
9. `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
10. `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
11. `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
12. `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
13. `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 3. BOLARS MVP Не Равен Старой Showcase-Витрине

Старый showcase-контекст полезен как опыт HTML-shell, V8WebKit, тем, visual contract и mock-данных. Но BOLARS MVP имеет другой продуктовый фокус:

- scan-first;
- cart-first после первого товара;
- поиск только fallback;
- отдельной карточки товара нет;
- каталог не является главным сценарием;
- товар через scan/search сразу добавляется в корзину;
- `SelfCheckoutRuntimePort` владеет бизнес-истиной.

Implementation agent не должен переносить в BOLARS MVP подход "каталог товаров как главный экран".

## 4. Что Делать Первым

Использовать delivery order из `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md`.

1. RuntimePort types/state model.
2. RuntimeAdapterFactory.
3. MockAdapter.
4. PreviewAdapter.
5. OneCInterfaceAdapter shell.
6. Screens render snapshots.
7. Debug panel observes runtime/adapter state.

Не начинать с CSS-красоты без runtime state model. `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` реализуются через один `SelfCheckoutRuntimePort` API.

Preview mode работает только через `PreviewAdapter` и state snapshots. Запрещён прямой render screen/component в обход RuntimePort.

## 5. Recommended First Implementation Slice

Минимальный первый срез:

- start screen;
- tap start screen -> cart;
- mock scan product -> cart screen;
- repeated mock scan -> quantity increment;
- cart line: position number, name, quantity, plus, minus, delete, line total from snapshot;
- search after `4+` chars;
- candidates found/not found;
- select candidate -> add/increment cart line;
- quantity numpad;
- cancel purchase: empty cart -> start; non-empty cart -> confirmation modal;
- payment setup: review, packages, discount phone/card state, manager badge if snapshot has manager;
- payment waiting;
- payment success;
- payment error;
- final success + countdown reset;
- inactivity timeout default `5 минут` in mock runtime;
- `window.BolarsSelfCheckout` namespace with runtime info, snapshot apply status and outbound command channel;
- `debug=1` panel with last command, last snapshot and apply status;
- `RuntimeAdapterFactory`;
- `PreviewAdapter`;
- `preview=1` panel/selector;
- preview scenarios for main screens/states;
- `bolars-light-default` theme tokens;
- text scale `normal`, `large`, `extraLarge`;
- visual acceptance screenshots `1080x1920`, `1920x1080`, `1366x768`, `1280x800`.

## 6. vNext / Out of First Slice

- Честный знак / маркированные товары;
- full production hardening of 1C/RMK rollout beyond first interface adapter handshake;
- real payment adapter;
- KKT/fiscalization/OFD;
- production admin/theme editor;
- custom theme UI;
- real loyalty system;
- real scanner-router;
- real search adapter;
- production deployment to terminals.

## 7. RuntimePort Boundary

Запрещено:

- UI-компоненты напрямую мутируют cart;
- UI-компоненты сами считают `payableTotal`, line total, скидки или taxes;
- UI-компоненты сами решают repeated scan;
- UI-компоненты сами определяют тип barcode;
- UI-компоненты сами решают payment outcome;
- UI-компоненты импортируют 1C/payment/search/scanner/theme adapters.

Разрешено:

- UI держит только локальный draft input state;
- UI dispatches typed commands;
- UI renders authoritative snapshot;
- `MockAdapter` возвращает deterministic snapshots через тот же runtime port.
- `PreviewAdapter` возвращает deterministic preview snapshots через тот же runtime port.
- `OneCInterfaceAdapter` доставляет те же commands в 1С и принимает те же snapshots.

Canonical Web API for 1С:

```ts
window.BolarsSelfCheckout
```

Методы HTML-страницы не являются штатными методами 1С. 1С вызывает их через `Поле HTML-документа` → `Документ` → `window/defaultView`.

## 8. Theme Scope

MVP required: `bolars-light-default`.

Reserved / architecture: `bolars-light-contrast`, `custom`, `bolars-dark-optional`.

Не делать полноценный theme editor, dark/custom theme UI или расширение mandatory profiles в первом срезе. HEX-значения допустимы только в theme/profile config.

## 9. Не Делать

- не делать интернет-магазин;
- не делать каталог главным экраном;
- не делать product detail modal;
- не считать цены, скидки, итоги в UI;
- не вызывать 1С/payment/scanner/search напрямую из компонентов;
- не подключать Честный знак;
- не подключать ККТ/фискализацию;
- не делать production theme admin;
- не раздувать темы сверх MVP.
- не делать manual JSON import, textarea paste или file upload;
- не использовать `window.Showcase` для нового BOLARS MVP.

## 10. Evidence Expected

Implementation handoff должен включать:

- visual smoke screenshots `1080x1920`: start, cart, payment setup, payment waiting, payment error, final success;
- runtime/mock transition evidence: scan product, repeated scan, search found/not found, quantity change, remove line, discount applied/not found, manager bound, payment success/error, inactivity timeout;
- Web ↔ 1С evidence: canonical route opens separately from old showcase, `window.BolarsSelfCheckout` exists, outbound command channel works, `receiveStateSnapshot` applies snapshot;
- debug evidence: `?debug=1` shows route/build, outbound queue lifecycle, last command, last snapshot, command/snapshot correlation and apply status;
- preview evidence: `?debug=1&preview=1` shows preview controls and renders scenarios through `PreviewAdapter` snapshots;
- проверку отсутствия hardcoded HEX в components/screens;
- проверку отсутствия direct imports adapter/backend/1C/payment/search/scanner/theme из UI layer.

## 11. Actual Implementation Notes

Фактическая реализация BOLARS MVP встроена как отдельная ветка SPA-route, без переноса старого showcase:

- route branch: `src/app/App.tsx`;
- app shell and screens: `src/bolars/BolarsSelfCheckoutApp.tsx`;
- runtime types/default state: `src/bolars/runtime/types.ts`, `src/bolars/runtime/defaults.ts`;
- adapters and factory: `src/bolars/runtime/*Adapter.ts`, `src/bolars/runtime/adapterFactory.ts`;
- Web API namespace: `src/bolars/runtime/webApi.ts`;
- BOLARS theme tokens: `src/bolars/theme/bolarsTheme.ts`;
- BOLARS styles: `src/styles/index.css`.
- adaptive BOLARS layout variables and landscapeCompact rules: `src/styles/index.css`.

RuntimeAdapterFactory в первом implementation slice использует такие правила:

- customer route defaults to `MockAdapter`;
- `debug=1&preview=1` selects `PreviewAdapter`;
- `debug=1&adapter=onec` selects `OneCInterfaceAdapter`;
- `debug=1&runId=onec-*` also selects `OneCInterfaceAdapter` for 1C specialist mini-smoke;
- `preview=1` without `debug=1` is ignored safely;
- customer route has no adapter switcher.

Реализованные `window.BolarsSelfCheckout` methods:

- `getRuntimeInfo()`;
- `getRuntimeInfoJson()`;
- `drainOutboundCommandsJson()`;
- `peekOutboundStatusJson()`;
- `receiveStateSnapshot(snapshotJsonString)`;
- `receiveRuntimeConfig(configJsonString)`;
- `receiveCatalog(catalogJsonString)`;
- `getLastApplyStatusJson()`;
- `getDebugStateJson()`.

Короткий handoff для 1С-разработчика: `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`.

Implementation evidence:

- report: `docs/reports/2026-05-23/BOLARS_MVP_IMPLEMENTATION.report.md`;
- screenshots: `docs/reports/2026-05-23/bolars-implementation-evidence/`.
- adaptive contract refine: `docs/reports/2026-05-23/BOLARS_ADAPTIVE_VISUAL_CONTRACT_REFINE.report.md`;
- adaptive implementation/refactor evidence: `docs/reports/2026-05-23/BOLARS_ADAPTIVE_LAYOUT_REFACTOR.report.md`.
