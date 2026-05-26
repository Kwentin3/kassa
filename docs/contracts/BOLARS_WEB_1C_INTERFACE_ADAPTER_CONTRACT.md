# BOLARS MVP: Контракт интерфейсного адаптера Web ↔ 1С

Статус: draft 0.2
Дата: 2026-05-26
Аудитория: frontend/runtime-разработчик, 1С-разработчик, интегратор.

## 1. Назначение

Документ описывает, как HTML-экран BOLARS Self-Checkout MVP подключается к 1С через `window.BolarsSelfCheckout`.

Главная идея:

```text
Покупатель действует на Web-экране
  -> Web кладёт команду в очередь
  -> 1С читает очередь
  -> 1С применяет бизнес-логику
  -> 1С возвращает полный snapshot
  -> Web рисует экран по snapshot
```

Web не вызывает 1С напрямую и не считает бизнес-логику. 1С не обращается к React-компонентам. Единственный внешний API страницы - `window.BolarsSelfCheckout`.

Рабочий JSON-формат команд и snapshot описан отдельно: `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`.

Внутренний runtime-port для frontend-команды описан в `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`. Для 1С это справочный, а не основной рабочий документ.

## 2. Связанные Документы

- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md` - короткая инструкция для 1С-разработчика.
- `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md` - JSON-команды, snapshot, enum-значения и apply-правила.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - внутренний TypeScript/runtime boundary.
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md` - выбор adapter: `mock`, `preview`, `onec`.
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md` - debug-панель, очередь команд и apply status.

## 3. Режимы И URL

| Режим | URL | Назначение |
| --- | --- | --- |
| Customer mock/demo | `https://kassa.speechbattle.com/bolars/self-checkout-mvp` | Обычная демонстрация без live 1С-bridge. |
| Debug mock | `https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1` | Проверка Web/runtime без 1С. |
| 1С HTML artifact | `https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1` | Проверка 1С-совместимой HTML-версии в mock-режиме. |
| 1С bridge smoke | `https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01` | Основной режим первого обмена Web -> 1С -> Web. |
| Preview | `https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&preview=1&scenario=cartManyItems` | Фиксированные состояния для проверки UI, не 1С-обмен. |

Текущая реализация выбирает `OneCInterfaceAdapter` только в debug-контексте: `debug=1&adapter=onec` или `debug=1&runId=onec-*`.

Customer URL без `debug=1` сейчас остаётся demo/mock. Production-запуск live 1С-bridge без debug-панели должен быть отдельным согласованным срезом.

В URL нельзя передавать секреты, токены, ФИО, телефоны, внутренние ссылки 1С и коммерческие данные клиента.

## 4. Adapter Topology

```text
HTML UI
  -> SelfCheckoutRuntimePort
  -> RuntimeAdapterFactory
  -> MockAdapter / PreviewAdapter / OneCInterfaceAdapter
  -> внешние контуры 1С / поиск / лояльность / оплата
```

Правила:

- UI знает только runtime-port и snapshot.
- UI не импортирует `OneCInterfaceAdapter`.
- UI не вызывает 1С, оплату, поиск, scanner-router или theme source напрямую.
- `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` дают UI один и тот же snapshot-формат.
- Preview не отправляет команды в 1С.
- Старый `window.Showcase` не используется для BOLARS MVP.

## 5. Доступ Из 1С

1С открывает HTML в `Поле HTML-документа` и получает API страницы:

```text
Поле HTML-документа
  -> Документ
  -> window/defaultView
  -> window.BolarsSelfCheckout
```

Методы `window.BolarsSelfCheckout` - это методы HTML-страницы. Это не штатные методы платформы 1С.

Рекомендуемый путь для 1С - методы, которые возвращают JSON-строку:

- `getRuntimeInfoJson()`
- `peekOutboundStatusJson()`
- `drainOutboundCommandsJson()`
- `getLastApplyStatusJson()`
- `getDebugStateJson()`

Метод `receiveStateSnapshot(snapshotJsonString)` принимает JSON-строку.

## 6. Экспортируемый API

Список сверён с `src/bolars/runtime/webApi.ts`.

| Метод | Текущий статус | Смысл |
| --- | --- | --- |
| `getRuntimeInfo()` | есть | Возвращает JS object. Для 1С лучше использовать JSON-версию. |
| `getRuntimeInfoJson()` | есть | Готовность, build, route, `adapterKind`, версия snapshot. |
| `drainOutboundCommandsJson()` | есть | Забрать команды Web -> 1С. |
| `peekOutboundStatusJson()` | есть | Посмотреть очередь без чтения команд. |
| `receiveStateSnapshot(snapshotJsonString)` | есть | Передать Web полный snapshot от 1С. |
| `getLastApplyStatusJson()` | есть | Узнать результат последнего apply snapshot. |
| `getDebugStateJson()` | есть | Получить debug-состояние runtime/adapter. |
| `receiveRuntimeConfig(configJsonString)` | зарезервировано | Сейчас возвращает warning и не меняет покупку. |
| `receiveCatalog(catalogJsonString)` | зарезервировано | Сейчас возвращает warning и не меняет корзину, поиск или оплату. |

Методов `ackOutboundCommandsJson()` и `failOutboundCommandsJson()` в текущей реализации нет. Завершение команды фиксируется через snapshot с `lastProcessedCommandId` и `lastCommandResult`.

## 7. Обмен Командами

Команда появляется в очереди, когда покупатель нажал кнопку, ввёл поиск, выбрал товар, начал оплату или сделал другое действие на Web-экране.

1С читает очередь по таймеру:

```text
peekOutboundStatusJson()
  -> если pendingCount > 0
drainOutboundCommandsJson()
  -> обработать commands[]
receiveStateSnapshot(...)
```

Рекомендуемый интервал для активной покупки: `100-300 ms`, если конкретная версия платформы и нагрузка это позволяют. На стартовом экране можно опрашивать реже.

`drainOutboundCommandsJson()` только переводит команду из `queued` в `drainedByOneC`. Это не подтверждение бизнес-успеха.

Команда считается завершённой, когда пришёл snapshot с тем же `commandId`:

```json
{
  "lastProcessedCommandId": "cmd-lx001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-lx001"
  }
}
```

Если команда прочитана, но snapshot не пришёл, debug-панель должна показывать незавершённую команду.

## 8. Snapshot Apply

1С передаёт snapshot так:

```text
window.BolarsSelfCheckout.receiveStateSnapshot(snapshotJsonString)
```

Текущая реализация:

- парсит JSON;
- проверяет базовую форму;
- отклоняет старый `snapshotVersion`;
- проверяет `runId` и `terminalLabel`, если они есть и в URL, и в snapshot;
- сохраняет `adapterKind` текущего Web-режима;
- перерисовывает экран по принятому snapshot;
- сохраняет apply status.

Базовая apply-валидация намеренно не заменяет полноценный контракт. 1С должна возвращать полный snapshot по `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`, иначе UI может получить неполные данные для конкретного экрана.

## 9. Правила Навигации

Web не хранит доверенную историю экранов покупки.

Если покупатель нажал назад:

- Web отправляет команду `returnToPurchase`;
- 1С решает, что должно быть следующим экраном;
- 1С возвращает полный snapshot.

Для возврата из `paymentSetup` в корзину:

- `currentScreen` должен стать `cart`;
- чек не очищается;
- `cartLines`, `cart`, `totals`, `discount`, `manager`, `paymentState` и остальные поля остаются актуальными.

Если открыта модалка, `returnToPurchase` должен только закрыть её:

```json
{
  "modalState": { "type": "none" }
}
```

Очистка покупки относится к `cancelPurchaseRequest` / `confirmCancelPurchase`, а не к кнопке назад.

## 10. Mapping Основных Действий

| Действие покупателя | Команда Web | Что делает 1С | Что возвращает snapshot |
| --- | --- | --- | --- |
| Начать покупку | `startPurchase` | Открыть сессию покупки | `currentScreen="cart"` |
| Скан товара | `scanCode` | Определить тип кода, найти товар, добавить или увеличить строку | обновлённые `cartLines`, `cart`, `totals` |
| Поиск `4+` символа | `searchProducts` | Искать в 1С по имени, артикулу, цифрам штрихкода | `searchState.query`, `status`, `candidates` |
| Выбор кандидата | `selectSearchCandidate` | Добавить найденный товар в чек | обновлённая корзина |
| Плюс/минус | `incrementQuantity` / `decrementQuantity` | Изменить количество и пересчитать суммы | обновлённые строки и итоги |
| Удалить строку | `removeCartLine` | Удалить любую removable строку: товар, пакет, служебную строку | обновлённая корзина и итоги |
| Добавить пакет | `addPackage` | Добавить пакет как строку чека | обновлённая корзина |
| Скидка по телефону | `applyDiscountByPhone` | Проверить лояльность | `discount`, `totals` |
| Оплата | `startPayment` | Запустить оплату | `paymentWaiting`, `paymentError` или `finalSuccess` |
| Повторить оплату | `retryPayment` | Повторить оплату по правилам 1С/эквайринга | новое payment-состояние |
| Сброс | `resetToStart` | Завершить/сбросить текущую сессию | `currentScreen="start"` |

## 11. Очередь И Backpressure

Текущий `OneCInterfaceAdapter` хранит команды в памяти HTML-страницы.

Фактические правила из `src/bolars/runtime/onecInterfaceAdapter.ts`:

- максимум незавершённых команд: `20`;
- при переполнении новая команда получает ошибку `queueOverflow`;
- повторный `startPayment` блокируется, если предыдущая payment-команда ещё pending;
- незавершённые команды старше 30 секунд переводятся в `timeout`;
- после snapshot с `lastProcessedCommandId` запись получает `snapshotReceived` или `failed`.

Это debug/smoke-механика первого среза, а не финальный production SLA.

## 12. Debug Panel

`debug=1` включает служебную панель. Она нужна для интеграции и диагностики, покупателю её показывать нельзя.

Панель должна помогать увидеть:

- активный `adapterKind`;
- runtime/build/route;
- очередь команд Web -> 1С;
- последнюю команду;
- последний inbound snapshot;
- apply status;
- ошибки формы snapshot;
- связь `commandId` с `lastProcessedCommandId`.

Подробный контракт панели: `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`.

## 13. Безопасность

Запрещено передавать в URL, команды, snapshot и debug:

- секреты;
- токены;
- пароли;
- внутренние ссылки и объекты 1С;
- ФИО;
- персональные телефоны в сыром виде для debug;
- номера банковских карт;
- коммерческие данные клиента, не нужные экрану покупателя.

Для скидки Web может отправить телефон в `applyDiscountByPhone.payload.phone`. В snapshot/debug используйте маски вроде `discount.phoneMasked`.

## 14. Что Не Входит В Первый Контур

В этот contract не входят без отдельной задачи:

- production-запуск live 1С-bridge без debug-панели;
- real backend/CMS/update-flow;
- ККТ, фискализация, ОФД;
- Честный знак;
- production payment internals;
- media delivery из 1С;
- ручной JSON import через textarea или файл;
- использование `window.Showcase` для BOLARS MVP.

## 15. Критерий Готовности Первого Интеграционного Шага

Интеграционный шаг считается рабочим, если:

- 1С открывает 1С HTML artifact с `debug=1&adapter=onec`;
- `getRuntimeInfoJson()` возвращает `ready=true` и `adapterKind="onec"`;
- после действия покупателя команда появляется в очереди;
- 1С забирает команду через `drainOutboundCommandsJson()`;
- 1С возвращает полный snapshot через `receiveStateSnapshot(...)`;
- `getLastApplyStatusJson()` возвращает `ok=true`;
- debug-панель показывает связь команды и snapshot по `commandId`.
