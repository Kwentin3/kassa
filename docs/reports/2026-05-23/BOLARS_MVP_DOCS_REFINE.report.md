# BOLARS MVP Docs Refine Report

Дата: 2026-05-23
Статус: completed
Задача: refine документационного пакета BOLARS Self-Checkout MVP перед реализацией.

## 1. Изменённые Файлы

- `docs/AGENT_START_HERE.md` - создан короткий implementation handoff.
- `docs/README.md` - добавлен entrypoint для implementation agent и явное разделение BOLARS MVP от старой showcase-витрины.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - добавлены first implementation slice, vNext/out-of-slice, viewport guardrails и RuntimePort/mock boundary.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - усилен запрет отдельного mock-only UI пути; добавлены mock/first-slice guardrails.
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` - уточнено, что `1080x1920` не является pixel lock, и запрещён перенос старой showcase/catalog модели.
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` - уточнён theme scope первого среза: только `bolars-light-default` обязателен.
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` - добавлены screen-level guardrails по old showcase, viewport fallback, Честному знаку и default RU copy.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - усилены критерии по default copy, RuntimePort, MockAdapter, theme scope, evidence и отсутствию direct imports.

## 2. Как Разведены BOLARS MVP и Старый Showcase

Документы теперь явно фиксируют:

- BOLARS MVP - portrait-first scan-first касса самообслуживания;
- старый showcase/catalog flow полезен только как технический опыт HTML-shell, V8WebKit, тем и mock-данных;
- старые frontend/showcase документы не являются source of truth для BOLARS flow;
- каталог товаров не является главным экраном;
- search является fallback, а не полноценной витриной;
- scan/search сразу добавляют товар в корзину через runtime snapshot.

## 3. Первый Implementation Slice

Зафиксирован минимальный первый срез:

- start -> cart через tap;
- mock scan product -> cart;
- repeated mock scan -> quantity increment;
- cart line с position number, name, quantity, plus/minus/delete и line total из snapshot;
- search после `4+` символов, found/not found, select candidate -> add/increment;
- quantity numpad;
- cancel empty/non-empty cart;
- payment setup с review, packages, discount phone/card state и manager badge из snapshot;
- payment waiting, success, error;
- final success + countdown reset;
- inactivity timeout default `5 минут`;
- `bolars-light-default`;
- text scale `normal`, `large`, `extraLarge`;
- visual smoke screenshots `1080x1920`.

## 4. RuntimePort Boundary

Усилено:

- сначала реализуется runtime/mock state model и `SelfCheckoutRuntimePort`;
- `MockAdapter` использует тот же API, что будущий runtime/1C mode;
- mock возвращает deterministic snapshots и не создаёт отдельный UI path;
- UI держит только draft input state, dispatches typed commands и renders authoritative snapshot.

Запрещено:

- прямое cart mutation в UI;
- расчёт payable total, line total, скидок или taxes в UI;
- UI-решение repeated scan;
- UI-определение типа barcode;
- UI-решение payment outcome;
- direct imports 1C/payment/search/scanner/theme adapters из screens/components.

## 5. vNext / Out of First Slice

Оставлено за пределами первого среза:

- Честный знак / маркированные товары;
- real 1C bridge;
- real payment adapter;
- KKT/fiscalization/OFD;
- production admin/theme editor;
- custom theme UI;
- real loyalty system;
- real scanner-router;
- real search adapter;
- production deployment to terminals.

## 6. Theme Scope

MVP required:

- `bolars-light-default`.

Reserved / architecture:

- `bolars-light-contrast`;
- `custom`;
- `bolars-dark-optional`.

Theme editor, dark/custom UI и расширение mandatory profiles не входят в первый срез.

## 7. Implementation Evidence

Acceptance checklist теперь требует:

- visual smoke screenshots `1080x1920`: start, cart, payment setup, payment waiting, payment error, final success;
- runtime/mock transition evidence: scan product, repeated scan, search found/not found, quantity change, remove line, discount applied/not found, manager bound, payment success/error, inactivity timeout;
- проверку отсутствия hardcoded HEX в components/screens;
- проверку отсутствия direct imports adapter/backend/1C/payment/search/scanner/theme из UI layer.

## 8. Что Не Менялось

- Frontend-код не изменялся.
- Runtime types в коде не изменялись.
- Mock runtime в коде не изменялся.
- Реальные 1С/payment/scanner/search/KKT/fiscalization интеграции не проектировались и не подключались.
- Продуктовый scope не расширялся.

## 9. Открытые Вопросы

- Честный знак / маркированные товары.
- Официальный брендбук БОЛАРС.
- Финальная интеграция с 1С.
- Реальный payment adapter.
- ККТ, фискализация, ОФД и legal receipt flow.
- Production hardware/WebView constraints.

## 10. Ready For Implementation

Пакет готов к implementation planning. Следующий агент должен начинать с `docs/AGENT_START_HERE.md`, затем читать ТЗ/PRD и RuntimePort contract, после чего реализовывать первый срез через mock/runtime state model.
