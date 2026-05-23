# PRD: BOLARS Self-Checkout MVP

Статус: draft 0.1
Дата: 2026-05-23
Основание: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
Product: BOLARS Self-Checkout

## 1. Product Summary

BOLARS Self-Checkout - терминал кассы самообслуживания для сенсорного экрана в магазине строительных материалов.

MVP строится вокруг scan-first workflow: покупатель сканирует товар, сразу видит его в корзине, проверяет состав покупки, добавляет нужные опции и оплачивает заказ.

Frontend является визуальным слоем. Он отображает authoritative state snapshot и отправляет typed user-intent commands через `SelfCheckoutRuntimePort`. Frontend не является владельцем бизнес-логики корзины, цен, скидок, итогов, менеджера, поиска, сканера или оплаты.

Брендовая тема БОЛАРС должна быть управляемой через theme/tokens contract, а не через хардкод в компонентах.

## 2. Problem / Opportunity

Покупателю нужно быстро и понятно отсканировать строительные товары, проверить корзину и оплатить без кассира.

Для такого сценария интерфейс должен:

- быть крупным и читаемым с расстояния;
- быть понятным неподготовленному человеку;
- сохранять scan-first сценарий даже при наличии ручного поиска;
- давать явные состояния ошибки, ожидания, успеха и отмены;
- не превращаться в интернет-магазин или каталог;
- позволять управляемое брендирование без риска сломать UX.

Для команды проекта нужна документация, которая разделяет product source of truth, PRD, visual contracts и runtime boundary.

## 3. Target Users

- Покупатель: сканирует товары, меняет количество, оплачивает заказ.
- Сотрудник/менеджер: помогает покупателю, может привязать продажу к себе через карту менеджера.
- Администратор/владелец торговой точки: будущий пользователь настроек темы, пакетов, таймаутов, текстов и feature flags.
- Implementation/support team: использует документацию как карту требований, границ и acceptance criteria.

## 4. Operating Context

- Основной форм-фактор нового BOLARS flow: portrait kiosk viewport `1080x1920`.
- `1080x1920` является базовым design target, а не единственным допустимым размером и не поводом жёстко прибивать layout к абсолютным пикселям.
- Реализация должна использовать stage/layout contract, tokens и responsive constraints; root viewport не должен получать horizontal scroll, а sticky CTA/help не должны пропадать в HTML-shell/WebView.
- Сейчас этап прототипа MVP: frontend должен демонстрировать полный пользовательский flow и быть готовым к runtime/adapter boundary.
- Внешние контуры продукта: 1С/search, scanner-router, система лояльности, эквайринг, theme config и будущие ККТ/фискальные контуры.
- В текущем frontend prototype эти контуры могут воспроизводиться через `MockAdapter`, но mock не должен заменять product contract.
- Intended real MVP contour использует `OneCInterfaceAdapter` behind `SelfCheckoutRuntimePort`.
- Canonical route: `https://kassa.speechbattle.com/bolars/self-checkout-mvp`.
- Debug route: `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1`.
- Preview route for service/dev/acceptance work: `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1`.
- Старый showcase остаётся отдельным контуром и не переносится на BOLARS MVP route.
- Возможна работа внутри HTML-оболочки, встроенного браузера или 1C-контекста, поэтому visual effects должны иметь fallback.
- Демо-домен проекта: `https://kassa.speechbattle.com`.

## 5. Product Principles

- Scan-first: первый и главный сценарий - сканирование штрих-кода.
- Cart-first after scan: после первого товара пользователь работает с корзиной, а не с каталогом.
- Immediate add: найденный товар сразу добавляется в корзину.
- No product detail: отдельной карточки товара или описательного modal нет.
- Отдельной карточки товара нет.
- Runtime-owned business logic: UI не считает и не решает бизнес-логику.
- Theme-driven UI: цвета, размеры, тексты и профили задаются конфигурацией.
- Kiosk readability: крупные тексты, крупные суммы, крупные touch targets.
- Recoverable errors: ошибки должны объяснять следующее действие, а не выглядеть как crash.

BOLARS MVP не является старой showcase-витриной или mock-каталогом. Старый frontend/showcase-контекст полезен как опыт HTML-shell, V8WebKit, тем, visual contract и mock-данных, но продуктовый flow здесь другой: scan-first, cart-first, search fallback, immediate add to cart и runtime-owned business truth.

## 6. MVP Scope

В MVP входят:

- стартовый экран;
- открытие корзины по касанию стартового экрана;
- корзина / `Ваши покупки`;
- ручной поиск товара;
- поиск после `4+` символов;
- выбор кандидата поиска с немедленным добавлением в корзину;
- изменение количества через `+`, `-` и нумпад;
- удаление товара;
- добавление пакета;
- применение скидки по карте или телефону;
- привязка менеджера;
- переход к оплате;
- подготовка к оплате;
- ожидание оплаты;
- ошибка оплаты;
- успешная оплата;
- финальный экран благодарности;
- автоматический возврат на стартовый экран;
- таймаут неактивности;
- управляемые темы и цветовые профили;
- text scale `normal`, `large`, `extraLarge`;
- prototype/mock mode для воспроизведения основных состояний без прямых вызовов из UI.

### Recommended First Implementation Slice

Минимальный первый срез для implementation agent:

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
- `bolars-light-default` theme tokens;
- canonical route `/bolars/self-checkout-mvp`;
- `window.BolarsSelfCheckout` Web API;
- `RuntimeAdapterFactory`;
- `OneCInterfaceAdapter` / `MockAdapter` behind one `SelfCheckoutRuntimePort`;
- `PreviewAdapter` behind one `SelfCheckoutRuntimePort`;
- preview scenarios for main screens/states;
- `debug=1` panel with command/snapshot/apply status;
- text scale `normal`, `large`, `extraLarge`;
- visual acceptance screenshots `1080x1920`.

Сначала реализовать runtime/mock state model и `SelfCheckoutRuntimePort`, затем screens/overlays, затем visual polish. Не начинать первый срез с CSS-красоты без state model.

### vNext / Out of First Slice

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

### Preview Mode Scope

Preview Mode входит в служебный/dev/acceptance scope, но не входит в customer flow.

Preview Mode нужен для визуальной приёмки и отладки экранов/states, которые трудно быстро получить через полный scan-first сценарий: `paymentError`, `finalSuccess`, empty cart, many items, timeout warning, text scale variants.

Rules:

- preview работает только через `PreviewAdapter`;
- `PreviewAdapter` реализует `SelfCheckoutRuntimePort`;
- preview отдаёт deterministic snapshots;
- UI renders snapshots normally;
- preview не выполняет кассовые операции;
- preview не подключает 1С, оплату, ККТ или Честный знак;
- preview не является production admin.

## 7. Non-Goals

Не делаем в рамках MVP:

- полноценный интернет-магазин;
- каталог как основной сценарий;
- отдельную карточку товара;
- модальное окно описания товара;
- frontend как владельца корзины, цен, скидок, итогов или payment outcome;
- прямые вызовы 1C, backend, эквайринга, scanner-router или search service из UI-компонентов;
- прямую интеграцию UI-компонентов с 1С, системой лояльности, эквайрингом или theme source;
- Честный знак / маркированные товары до отдельного решения;
- обещание реальной ККТ/фискализации без отдельного legal/integration scope;
- хардкод цветов, текстов, размеров и workflow-параметров;
- production admin/theme editor;
- декоративные анимации, которые мешают кассовому сценарию.

## 8. Core User Journey

1. Покупатель подходит к терминалу.
2. Видит стартовый scan-first экран.
3. Сканирует товар.
4. Открывается `Ваши покупки`.
5. Товар сразу добавляется в корзину.
6. Покупатель сканирует остальные товары.
7. При необходимости вводит `4+` символа в ручной поиск.
8. Выбирает кандидата поиска, и товар сразу добавляется в корзину.
9. Если товар уже есть в корзине, runtime увеличивает количество существующей строки.
10. Покупатель меняет количество через `+`, `-` или нумпад.
11. При необходимости удаляет строку.
12. Нажимает `Перейти к оплате`.
13. Проверяет состав покупки.
14. При необходимости добавляет пакет.
15. При необходимости применяет скидочную карту или телефон.
16. При необходимости менеджер сканирует карту для привязки продажи.
17. Покупатель нажимает `Оплатить`.
18. Система показывает ожидание оплаты.
19. Покупатель прикладывает карту к платёжному терминалу.
20. Система показывает успех или ошибку оплаты.
21. При успехе показывается финальный экран благодарности.
22. Терминал автоматически возвращается на стартовый экран.

## 9. Screen Map

| Screen | Назначение | Downstream spec |
| --- | --- | --- |
| `start` | Стартовая scan-first инструкция | `VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`, `SCREEN_COMPOSITION_SPEC_BOLARS.md` |
| `cart` | Основная рабочая корзина | `SCREEN_COMPOSITION_SPEC_BOLARS.md` |
| `paymentSetup` | Проверка заказа, пакеты, скидка, менеджер | `SCREEN_COMPOSITION_SPEC_BOLARS.md` |
| `paymentWaiting` | Ожидание оплаты на терминале | `SCREEN_COMPOSITION_SPEC_BOLARS.md` |
| `paymentError` | Recovery после failed/timeout/cancelled/unknown | `SCREEN_COMPOSITION_SPEC_BOLARS.md` |
| `finalSuccess` | Благодарность и авто-reset | `SCREEN_COMPOSITION_SPEC_BOLARS.md` |

Overlay/states:

- search candidates as cart state;
- quantity numpad;
- cancel purchase confirmation;
- inactivity timeout/reset state;
- alerts/notifications.

## 10. Functional Requirements Summary

- Сканирование кода отправляет `scanCode(code)`.
- Касание стартового экрана отправляет `startPurchase()` и открывает корзину без добавленного товара.
- Runtime определяет тип кода: товар, скидка, менеджер, unknown, marked product branch.
- Первый найденный товар открывает cart screen и добавляется в корзину.
- Повторный товар увеличивает quantity существующей строки.
- Ручной поиск запускается после `4+` символов.
- Поиск выполняется через runtime/search adapter; product target для источника поиска - 1С.
- Поиск использует наименование, артикул и цифры штрих-кода.
- Выбор search candidate вызывает `selectSearchCandidate(candidateId)`.
- Quantity меняется через runtime commands, UI не пересчитывает line total.
- Для MVP quantity является целым числом, если отдельно не принято решение о весовых или дробных товарах.
- Удаление строки выполняется через `removeCartLine(lineId)`.
- Переход к оплате выполняется через `goToPaymentSetup()`.
- Пакет добавляется через `addPackage(packageCode)`.
- Скидка по телефону применяется через `applyDiscountByPhone(phone)`.
- Оплата запускается через `startPayment()`.
- Retry оплаты выполняется через `retryPayment()`.
- Reset выполняется через `resetToStart(reason)`.

## 11. UX Principles

- Главная инструкция должна быть очевидной.
- Основная CTA должна быть визуально доминирующей.
- Сумма к оплате должна быть крупной и быстро считываемой.
- Product rows должны быть крупными, не табличными.
- Ошибки должны быть recoverable.
- Успех должен быть однозначным.
- Help должен быть доступен на ключевых экранах.
- Cancel purchase для непустой корзины требует подтверждения.
- UI должен поддерживать visible focus, disabled, busy и pressed states.

## 12. Theme / Branding Principles

- Бренд БОЛАРС должен быть узнаваем, но не должен мешать покупке.
- Стартовый экран может быть более брендовым и промо-визуальным.
- Рабочие экраны должны быть спокойнее.
- Magenta используется как brand/accent.
- Cyan используется для scanner/search/payment hints.
- Green используется для успешных и payment CTA states.
- Все значения идут через theme tokens.
- Официальный брендбук БОЛАРС, когда появится, заменяет значения темы, а не компонентную логику.

## 13. Runtime / 1C Boundary

Frontend общается с внешним миром через `SelfCheckoutRuntimePort`.

Real MVP contour:

```text
HTML UI
  -> SelfCheckoutRuntimePort
  -> OneCInterfaceAdapter
  -> 1С / РМК / search / scanner-router / loyalty / payment / future KKT
```

Prototype/test contour:

```text
HTML UI
  -> SelfCheckoutRuntimePort
  -> MockAdapter
```

Preview/service contour:

```text
HTML UI
  -> SelfCheckoutRuntimePort
  -> PreviewAdapter
```

All adapters use one contract. UI does not have separate paths for mock, preview or real.

Frontend отправляет typed commands:

- scan/search/select candidate;
- quantity changes;
- remove line;
- cancel/return;
- go to payment setup;
- add package;
- apply discount;
- start/retry payment;
- bind manager;
- text scale;
- reset.

Runtime возвращает authoritative state snapshot:

- current screen;
- cart/cart lines;
- totals;
- discount;
- manager;
- search/scanner/payment states;
- alerts;
- modal state;
- text scale;
- theme profile;
- UI config;
- feature flags.

Владельцы бизнес-логики:

- 1C/backend/runtime - поиск, товарные данные, цены, корзина, скидки, менеджер, итоги;
- scanner-router/runtime - классификация scanned code;
- payment adapter/runtime - payment status и outcome;
- theme config/runtime - активный theme profile.

UI-компоненты не должны импортировать или вызывать эти адаптеры напрямую.

Implementation rule: `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` используют тот же `SelfCheckoutRuntimePort` API. Mock/preview возвращают deterministic snapshots, но не становятся отдельной UI-архитектурой.

`OneCInterfaceAdapter` является concrete real adapter implementation для 1С-контура. Web ↔ 1С delivery details, `window.BolarsSelfCheckout` API и route/debug правила описаны в `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`.

`RuntimeAdapterFactory` выбирает adapter по runtime mode/query/environment. UI не импортирует adapters и не выбирает adapter напрямую.

Запрещено в UI:

- напрямую мутировать cart;
- считать `payableTotal`, line total, скидки или taxes;
- решать repeated scan;
- определять тип barcode;
- решать payment outcome;
- импортировать 1C/payment/search/scanner/theme adapters.

Разрешено в UI:

- держать локальный draft input state;
- отправлять typed commands;
- отображать authoritative snapshot;
- показывать visual feedback, если он следует из snapshot/event.

## 14. Configurability Requirements

Должны настраиваться через theme/config/runtime snapshot:

- темы;
- цветовые профили;
- логотип и брендовая зона;
- тексты и словарь интерфейса;
- размеры текста `normal`, `large`, `extraLarge`;
- пакеты;
- таймауты;
- timeout default `5 минут`;
- список activity events для сброса inactivity timer;
- зона скидки;
- ручной поиск;
- minimum search length;
- search fields;
- max search candidates;
- candidate display format;
- package labels and package product codes;
- order of payment setup blocks;
- payment retry/return behavior;
- acquiring response wait time;
- финальный countdown;
- product image mode;
- feature flags;
- reduced motion profile;
- high contrast profile.

Default RU copy from the source TZ must be present in dictionary/config and remain overrideable:

| State | Default text |
| --- | --- |
| Start instruction | `Поднесите штрих-код товара к сканеру` |
| Discount hint | `Для применения скидки отсканируйте карту или введите номер телефона` |
| Discount not found | `Скидка не найдена` |
| Unknown code | `Код не распознан. Обратитесь к сотруднику.` |
| Payment waiting instruction | `Приложите карту к терминалу оплаты` |
| Payment waiting status | `Ожидаем оплату...` |
| Payment success | `Оплата прошла успешно` |
| Payment failed | `Оплата не прошла` |
| Payment failure hint | `Попробуйте ещё раз или обратитесь к сотруднику` |
| Final title | `Спасибо за покупку!` |
| Final subtitle | `До новых встреч` |
| Cancel confirm title | `Отменить покупку и очистить корзину?` |
| Cancel confirm | `Да, отменить` |
| Cancel return | `Вернуться к покупке` |

## 15. Error and Edge States

MVP должен явно покрывать:

- пустую корзину;
- терминал свободен;
- покупка начата;
- товар добавлен;
- повторный scan увеличил количество;
- товар удалён;
- количество изменено;
- открыт нумпад;
- поиск выполняется;
- кандидаты найдены;
- кандидаты не найдены;
- товар не найден по штрих-коду;
- скидка применена;
- скидка не найдена;
- менеджер привязан;
- код не распознан;
- ожидание оплаты;
- успешная оплата;
- ошибка оплаты;
- покупка отменена;
- подтверждение отмены покупки;
- таймаут неактивности;
- маркированный товар / Честный знак как unresolved branch;
- активная тема загружена;
- тема не загружена или загружена с ошибкой;
- используется цветовой профиль по умолчанию.

Ошибка оплаты не очищает корзину. Unknown code не должен заставлять UI самостоятельно угадывать тип кода. Таймаут неактивности не должен ломать процесс оплаты, если транзакция уже отправлена в эквайринг.

## 16. Prototype / Integration Assumptions

Frontend prototype MVP должен быть готов к runtime/adapter boundary. В текущем repo-контексте допускается `MockAdapter`, но mock не заменяет продуктовые требования к 1С/search, scanner-router, лояльности и эквайрингу.

Для рабочего MVP-контура `MockAdapter` остаётся test/prototype implementation. Product target для интеграции с 1С - `OneCInterfaceAdapter`, реализующий тот же `SelfCheckoutRuntimePort`.

HTML в 1С должен открываться по canonical route `/bolars/self-checkout-mvp`. `debug=1` предназначен только для 1С-специалиста, интегратора и implementation team.

Допустимо:

- mock product data;
- mock search;
- mock scanner inputs;
- mock discount states;
- mock manager binding;
- mock payment waiting/success/failure;
- mock final receipt preview;
- deterministic scenarios for tests and visual acceptance.
- preview scenarios for visual acceptance through `PreviewAdapter`.

Не допустимо без отдельной задачи:

- прямые 1C/backend calls из UI-компонентов;
- прямые payment provider calls из UI-компонентов;
- real SBP QR без отдельного payment scope;
- real KKT/fiscalization/OFD без legal/integration scope;
- production CMS;
- production update flow.
- manual JSON import, textarea paste или file upload для runtime data.
- preview direct screen/component render bypassing `SelfCheckoutRuntimePort`.

## 17. Acceptance Criteria

MVP считается product-compliant, если:

- стартовый экран scan-first;
- касание стартового экрана открывает корзину;
- первый scan приводит к cart screen;
- найденный товар сразу добавляется в корзину;
- поиск работает после `4+` символов;
- выбор кандидата сразу добавляет товар в корзину;
- отдельной карточки товара нет;
- повторный scan увеличивает quantity;
- quantity можно менять через `+`, `-`, нумпад;
- удаление строки работает через runtime;
- payment setup содержит review, пакеты и скидку/телефон;
- manager badge показывается только если runtime вернул привязанного менеджера;
- waiting payment screen показывает сумму и инструкцию;
- payment error не очищает cart;
- inactivity timeout имеет default `5 минут`, activity list и payment guard;
- final success screen возвращает терминал на start;
- UI общается наружу только через `SelfCheckoutRuntimePort`;
- BOLARS MVP открывается на `/bolars/self-checkout-mvp` отдельно от старого showcase;
- `debug=1` показывает route/build, outbound queue lifecycle, command/snapshot correlation, last outbound command, last inbound snapshot и apply status;
- `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` реализуют один RuntimePort contract;
- `preview=1` требует `debug=1` и рендерит preview scenarios через RuntimePort snapshot;
- все цвета и размеры идут через tokens/config;
- prototype/mock mode воспроизводит основные happy/error/edge states.
- implementation evidence включает visual smoke screenshots, runtime/mock transition evidence, проверку отсутствия hardcoded HEX и проверку отсутствия direct 1C/payment/search/scanner/theme adapter imports из UI layer.

## 18. Open Questions

Не закрыто этим PRD:

- маркированные товары / Честный знак;
- официальный брендбук БОЛАРС;
- финальный способ интеграции с 1С;
- реальный платёжный адаптер;
- требования к ККТ, фискализации, ОФД и legal receipt flow;
- production admin для тем и workflow-конфигурации;
- целевое production-железо и браузер/WebView.

## 19. Related Documents

- `docs/AGENT_START_HERE.md` - короткий implementation handoff.
- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - каноническое upstream ТЗ.
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md` - Web ↔ 1С adapter, route и JS API.
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` - debug=1 panel contract.
- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md` - слои и adapter boundaries.
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` - выбор RuntimePort adapter.
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md` - preview mode через PreviewAdapter/snapshots.
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` - визуальная система и инварианты.
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` - theme profiles и tokens.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - runtime/frontend boundary.
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` - экранные спецификации.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - критерии визуальной приёмки.
- `docs/README.md` - карта документации и порядок чтения.
