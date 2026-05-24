# BOLARS 1C Contract Audit Report

Дата: 2026-05-24

Статус: аудит выполнен, расхождения в документации исправлены. Runtime-код не менялся.

## Scope

Проверялся контракт Web <-> 1C для BOLARS self-checkout MVP:

- публичный API `window.BolarsSelfCheckout`;
- outbound commands из Web в 1C;
- authoritative state snapshot из 1C в Web;
- текущая логика поиска через экранную клавиатуру;
- текущая логика телефона через numeric numpad;
- документация для 1C-программиста.

Не проверялись и не добавлялись реальные backend/1C/payment/SBP/KKT/fiscalization/CMS/update-flow интеграции.

## Sources

- `src/bolars/runtime/webApi.ts`
- `src/bolars/runtime/onecInterfaceAdapter.ts`
- `src/bolars/runtime/baseAdapter.ts`
- `src/bolars/runtime/adapterFactory.ts`
- `src/bolars/runtime/types.ts`
- `src/bolars/BolarsSelfCheckoutApp.tsx`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`

## Current Actual Contract

Текущий Web API для 1C:

- `getRuntimeInfo()`
- `getRuntimeInfoJson()`
- `receiveStateSnapshot(snapshotJsonString)`
- `receiveRuntimeConfig(configJsonString)`
- `receiveCatalog(catalogJsonString)`
- `getLastApplyStatusJson()`
- `getDebugStateJson()`
- `drainOutboundCommandsJson()`
- `peekOutboundStatusJson()`

Основной рабочий цикл:

1. Web складывает действия покупателя в outbound queue.
2. 1C забирает команды через `drainOutboundCommandsJson()`.
3. 1C применяет команду у себя.
4. 1C отдаёт полный state snapshot через `receiveStateSnapshot(...)`.
5. Web перерисовывает экран по snapshot.

`receiveRuntimeConfig()` и `receiveCatalog()` сейчас зарезервированы. Они возвращают безопасный warning/status, но не обновляют корзину, поиск, оплату или экран.

`ackOutboundCommandsJson()` и `failOutboundCommandsJson()` в текущем API не exposed. Завершение команды сейчас коррелируется через snapshot: `lastProcessedCommandId` и `lastCommandResult`.

## Findings

### 1. Production 1C Mode Is Not Yet a Customer Route

Фактическое состояние: customer route без `debug=1` выбирает mock/demo adapter и игнорирует `adapter=`.

Для текущих integration/smoke проверок 1C нужно использовать `debug=1&adapter=onec` или `debug=1&runId=onec-*`.

Риск: если 1C-программист откроет чистый customer URL и будет ждать live bridge, он увидит demo/mock поведение.

Документация уточнена. Рекомендация: отдельным срезом согласовать production launch mode без debug-панели.

### 2. Старый Snapshot Example Был Опасен

В handoff-документе был укороченный JSON-пример, который не соответствовал текущим runtime types:

- `modalState.kind` вместо текущего `modalState.type`;
- старые feature flag имена вроде `manualSearch`, `discount`, `managerBinding`;
- старые `uiConfig.packages` / `uiConfig.timeouts`;
- неполный набор обязательных полей snapshot.

Исправлено: пример заменён на список обязательных текущих полей и критичные имена, которые нельзя путать.

### 3. Ack/Fail Helpers Были Описаны Недостаточно Жёстко

В контракте были упомянуты optional `ackOutboundCommandsJson` / `failOutboundCommandsJson`.

Фактическое состояние: текущая реализация их не exposes.

Исправлено: документация теперь явно говорит, что это vNext/reserved, а сейчас результат команды возвращается через authoritative snapshot.

### 4. Runtime Config и Catalog Могли Быть Прочитаны Как Рабочий Путь

`receiveRuntimeConfig()` и `receiveCatalog()` есть в API, но сейчас не являются рабочим способом менять состояние витрины.

Исправлено: документация теперь говорит, что они reserved helpers и не обновляют cart/search/payment state.

### 5. UiConfig Был Over-Declared

В runtime port contract были поля/значения, которых нет в текущих TypeScript types:

- `uiConfig.inactivityActivityEvents`;
- детальные `viewportProfile` значения `landscapeKiosk`, `landscapeCompact`, `microFallback`.

Исправлено: контракт приведён к текущему runtime. Детальные viewport profiles оставлены как локальная presentation-деривация Web, а не как обязанность 1C.

### 6. Search Contract Нуждался В Уточнении

После UI-рефакторинга поиск вводится через Web-owned экранную клавиатуру. 1C видит только `searchProducts(query)` после `searchMinLength=4`.

Критично: в ответном snapshot 1C должна вернуть `searchState.query`, равный query из команды. Иначе Web считает, что кандидаты относятся не к текущему вводу.

Также `selectSearchCandidate(candidateId)` должен ссылаться на `candidateId`, который 1C ранее вернула в `searchState.candidates`.

Документация уточнена.

### 7. Phone Contract Нуждался В Уточнении

Телефон вводится через Web-owned numeric numpad. 1C получает только команду `applyDiscountByPhone(phone)`.

Фактический формат payload: `+7 900 123 45 67`.

Документация уточнена, чтобы 1C не ожидала телефон без `+7`.

### 8. Sticky Context Был Устаревшим

Sticky context ссылался на старый deployed commit.

Исправлено: актуальный deployment marker обновлён на `bed18da`.

## What Is Now Aligned

- Список текущих exposed API methods в контракте совпадает с runtime.
- Handoff для 1C больше не содержит старый invalid snapshot sample.
- Runtime port contract больше не требует от 1C несуществующие `uiConfig` поля.
- Search/phone поведение после UI-рефакторинга описано как Web-owned input с командами в 1C.
- Командная модель остаётся простой: Web отдаёт user actions, 1C возвращает полный snapshot.

## Recommendations

1. Сделать отдельный production 1C launch mode без debug-панели.

   Сейчас это главный продуктово-технический gap. Нужно явно решить, как 1C включает live bridge в боевом WebView, не смешивая demo, preview и smoke режимы.

2. Добавить machine-readable schema для 1C.

   Хороший следующий шаг: JSON Schema или сгенерированные из TypeScript contract fixtures для `SelfCheckoutStateSnapshot` и outbound commands. Это снизит риск ручных ошибок в 1C.

3. Добавить 1C smoke fixture.

   Минимальный fixture: Web отдаёт `searchProducts`, тестовая 1C-сторона возвращает snapshot с тем же `searchState.query`, candidates и `lastProcessedCommandId`.

4. Решить судьбу ack/fail helpers.

   Для MVP текущая snapshot-корреляция достаточна. Если 1C нужно отдельное подтверждение доставки, тогда helper-методы надо реализовать и протестировать, а не оставлять только как идею.

5. Не использовать `receiveCatalog()` как путь управления корзиной.

   Пока все изменения корзины должны идти через команды и новый authoritative snapshot. Catalog preload лучше делать отдельным срезом, если он реально понадобится.

6. Перед реальной 1C-нагрузкой рассмотреть debounce поиска.

   Сейчас поиск отправляется после 4+ символов. Для touch keyboard это нормально для MVP, но реальная 1C может потребовать debounce/throttle, чтобы не дергать поиск на каждый символ.

## Documentation Changes Made

- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`
- `docs/infra-ops/STICKY_CONTEXT.md`

## Bottom Line

Архитектурная идея здравая: Web остаётся интерфейсом покупателя, а 1C остаётся источником данных и решений. Основное, что нужно удержать дальше: не превращать Web в скрытый источник бизнес-истины. Web должен отправлять typed user commands и показывать authoritative snapshot от 1C.
