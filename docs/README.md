# Documentation Index: BOLARS Self-Checkout

Дата: 2026-05-23
Назначение: карта документации и порядок чтения для product, design и runtime-документов BOLARS Self-Checkout.

## 0. Agent Start Here

Implementation agent должен сначала открыть `docs/AGENT_START_HERE.md`. Этот handoff не меняет source-of-truth hierarchy, а коротко фиксирует первый implementation slice, запреты и порядок работы.

BOLARS MVP не является старой каталоговой showcase-витриной. Старый frontend/showcase-контекст полезен как опыт HTML-shell, V8WebKit, тем, visual contract и mock-данных, но не является source of truth для нового BOLARS flow.

Новый BOLARS flow:

- adaptive scan-first UI: portrait `1080x1920` is the reference viewport, landscape tablet/WebView is handled through compact profiles;
- scan-first;
- cart-first после первого товара;
- manual search только fallback;
- без product detail modal;
- без каталога как главного экрана;
- с бизнес-истиной за `SelfCheckoutRuntimePort`.

Canonical MVP route: `https://kassa.speechbattle.com/bolars/self-checkout-mvp`.

Debug route: `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1`.

Preview route: `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1`.

Старый showcase остаётся отдельным контуром и не переносится на этот route.

## 1. Product Layer

| Документ | Роль |
| --- | --- |
| `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` | Каноническое ТЗ. Самый детальный upstream requirement source. |
| `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` | PRD MVP. Продуктовая рамка, пользователи, scope, non-goals, acceptance criteria. |

## 2. Design Layer

| Документ | Роль |
| --- | --- |
| `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` | Визуальная система, kiosk/scan-first инварианты, композиция, visual language. |
| `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` | Theme profiles, semantic/adaptive tokens, правила отсутствия hardcoded colors/sizes в UI. |
| `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` | Покадровая спецификация экранов, overlay/state compositions и landscapeCompact profile. |
| `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` | Чек-лист визуальной и runtime-boundary приёмки реализации. |

## 3. Contracts Layer

| Документ | Роль |
| --- | --- |
| `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` | Единая граница frontend с runtime/backend/1C/payment/scanner/search через typed commands и authoritative state snapshot. |
| `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` | Контракт выбора runtime adapter: mock, preview или onec. |
| `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md` | Контракт служебного preview mode через PreviewAdapter и snapshots. |
| `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` | Контракт реального Web ↔ 1С interface adapter, route, `window.BolarsSelfCheckout`, command delivery и snapshot apply. |
| `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` | Контракт `debug=1` панели: outbound commands, inbound snapshots, apply status, adapter diagnostics. |

## 3.1 Integration Handoff

| Документ | Роль |
| --- | --- |
| `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md` | Короткая инструкция для 1С-разработчика: как открыть Web, получить `window.BolarsSelfCheckout`, читать команды Web и отдавать snapshots обратно. |

## 4. Architecture Layer

| Документ | Роль |
| --- | --- |
| `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md` | Послойная архитектура: Presentation, Application, RuntimePort, AdapterFactory, adapters, external systems. |

## 5. Implementation Layer

| Документ | Роль |
| --- | --- |
| `docs/implementation/BOLARS_MVP_IMPLEMENTATION_ROADMAP.md` | Практический порядок реализации BOLARS MVP: delivery slices, gates, evidence и anti-errors. |

## 5.1 Implementation Evidence

| Документ | Роль |
| --- | --- |
| `docs/reports/2026-05-23/BOLARS_MVP_IMPLEMENTATION.report.md` | Фактический implementation report: выполненные slices, проверки, Web API, adapters, debug/preview, evidence и deployment notes. |
| `docs/reports/2026-05-23/bolars-implementation-evidence/` | Visual smoke screenshots для start/cart/payment/debug/preview состояний. |
| `docs/reports/2026-05-23/BOLARS_ADAPTIVE_VISUAL_CONTRACT_REFINE.report.md` | Уточнение adaptive viewport contract после landscape audit. |
| `docs/reports/2026-05-23/BOLARS_ADAPTIVE_LAYOUT_REFACTOR.report.md` | Фактический отчёт по landscapeCompact CSS/layout refactor и viewport metrics. |

## 6. Recommended Reading Order

Для implementation handoff сначала прочитать `docs/AGENT_START_HERE.md`, затем canonical порядок:

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
11. `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
12. `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
13. `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 7. Source-of-Truth Hierarchy

| Уровень | Документ | Что определяет |
| --- | --- | --- |
| 1 | ТЗ | Детальные upstream requirements, сценарии, инварианты, запреты, открытые вопросы. |
| 2 | PRD | Продуктовая рамка, MVP boundaries, target users, non-goals, acceptance criteria. |
| 3 | Visual Contract | Визуальная система, composition model, kiosk/scan-first визуальные правила. |
| 4 | Theme/Tokens | Дизайн-токены, theme profiles, конфигурируемость бренда и states. |
| 5 | Layered Architecture | Слои, dependency rules, adapter ownership, debug/preview boundaries. |
| 6 | Runtime Port | Граница frontend/backend/1C, typed commands, authoritative snapshot, mock/preview/onec subset. |
| 7 | Adapter Factory / Preview | Adapter selection rules and preview scenario mode. |
| 8 | Web ↔ 1C Interface Adapter | Route, `window.BolarsSelfCheckout`, command channel, snapshot apply, debug boundary. |
| 9 | Screen Composition | Экранные спецификации, zones, CTAs, states, runtime bindings. |
| 10 | Acceptance Checklist | Критерии приёмки implementation agent. |
| 11 | Implementation Roadmap | Порядок delivery slices, gates и required evidence; не заменяет upstream requirements. |

## 8. Non-Negotiable Product Invariants

- Это scan-first касса самообслуживания, не интернет-магазин.
- Корзина становится главным рабочим экраном после первого scan.
- Найденный через scan или search товар сразу добавляется в корзину.
- Отдельной карточки товара или modal описания товара нет.
- Повторное сканирование существующего товара увеличивает quantity.
- Frontend не считает цены, скидки и итоги.
- UI не определяет тип scanned code.
- UI-компоненты не ходят напрямую в 1C, backend, scanner-router, search service, payment adapter или theme source.
- Все внешние действия идут через `SelfCheckoutRuntimePort`.
- `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` реализуют один RuntimePort contract.
- RuntimeAdapterFactory выбирает adapter; UI не выбирает и не создаёт adapters.
- Preview mode работает через `PreviewAdapter` и snapshots, не через direct component render.
- Реальный 1С-контур идёт через `OneCInterfaceAdapter`.
- HTML гарантирует namespace `window.BolarsSelfCheckout`; `window.Showcase` для BOLARS MVP не используется.
- Manual JSON import, textarea paste и file upload для runtime data запрещены.
- Цвета, тексты, размеры, профили и workflow-параметры не хардкодятся в компонентах; BOLARS layout sizes должны идти через adaptive tokens/CSS variables.
- Честный знак и ККТ/фискализация не закрыты этим MVP без отдельного решения.
- 1С/search, лояльность и эквайринг являются внешними runtime/adapter контурами; UI-компоненты не вызывают их напрямую.

## 9. Existing Repository Context

В репозитории также есть более ранние документы текущего frontend-only MVP, showcase/catalog flow и интеграционных исследований. Они остаются полезным контекстом, но не являются source of truth для BOLARS portrait scan-first flow. Для нового BOLARS MVP порядок чтения начинается с `docs/AGENT_START_HERE.md`, затем с product layer выше.

Implementation agent не должен переносить из старой витрины модель "каталог товаров как главный экран". BOLARS MVP строится вокруг scan/search -> immediate cart add -> payment flow.

Ключевой текущий контекст:

- `docs/infra-ops/STICKY_CONTEXT.md`
- `docs/product-ux/self-checkout-terminal-mvp-prd.v0.2.md`
- `docs/product-ux/VISUAL_CONTRACTS.md`
- `docs/SELF_CHECKOUT_FRONTEND_BLUEPRINT.md`
- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`
