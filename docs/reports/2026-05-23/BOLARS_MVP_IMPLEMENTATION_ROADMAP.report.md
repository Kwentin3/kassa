# BOLARS MVP Implementation Roadmap Report

Дата: 2026-05-23
Статус: completed

## 1. Что Создано

Создан документ:

- `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md`

Документ задаёт практический порядок реализации первого BOLARS Self-Checkout MVP через delivery slices, gates, acceptance criteria и required evidence.

## 2. Что Обновлено

Обновлены ссылочные документы:

- `docs/AGENT_START_HERE.md`
- `docs/README.md`

В них добавлена ссылка на roadmap и уточнён порядок чтения для implementation agent.

## 3. Какие Slices Определены

Roadmap фиксирует 11 delivery slices:

1. Slice 0 - Repo / Current State Audit.
2. Slice 1 - Route + BOLARS Shell Foundation.
3. Slice 2 - RuntimePort Types + State Model.
4. Slice 3 - RuntimeAdapterFactory.
5. Slice 4 - MockAdapter Core Flow.
6. Slice 5 - PreviewAdapter + Preview Scenario Registry.
7. Slice 6 - OneCInterfaceAdapter Shell + Web API.
8. Slice 7 - Debug Panel.
9. Slice 8 - UI Screens Rendering From Snapshots.
10. Slice 9 - Theme / Tokens / Visual Contract.
11. Slice 10 - Integration Smoke + Deployment.

Порядок намеренно идёт от runtime/adapter foundation к screens и visual polish. Это снижает риск, что UI начнёт владеть cart, totals, scan routing или payment outcomes.

## 4. Какие Gates Добавлены

Добавлены четыре delivery gates:

- Gate A - Foundation Gate: route, typed RuntimePort, AdapterFactory.
- Gate B - Runtime Gate: MockAdapter, PreviewAdapter, OneCInterfaceAdapter shell, queue lifecycle, snapshot apply.
- Gate C - UI Gate: screens render snapshots, theme tokens, preview evidence, no direct adapter imports.
- Gate D - Deployment Gate: public normal/debug/preview URLs, evidence, old showcase intact.

## 5. Какие Риски Закрывает Roadmap

Roadmap явно закрывает типовые ошибки:

- старт с CSS/screens до RuntimePort;
- preview bypasses RuntimePort;
- debug превращается в admin;
- UI импортирует `OneCInterfaceAdapter`;
- mock становится отдельным UI path;
- `drainOutboundCommandsJson()` трактуется как успех;
- stale snapshot откатывает UI;
- search превращается в catalog;
- `receiveCatalog` становится cart path;
- HEX хардкодится в компонентах;
- ломается старый showcase route;
- случайно добавляются real payment, KKT/fiscalization, media delivery или Честный знак.

## 6. Что Оставлено За Пределами

В roadmap явно исключены:

- media delivery;
- Честный знак / marked product workflow;
- KKT/fiscalization/OFD;
- real payment internals;
- production terminal hardening;
- production theme admin;
- full 1C/RMK production rollout hardening;
- official brandbook update.

## 7. Источники

Roadmap опирается на:

- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 8. Итог

Roadmap готов к передаче implementation agent. Он объясняет, с чего начинать, почему RuntimePort/adapters идут раньше screens, какие gates пройти и какие evidence приложить перед deployment.
