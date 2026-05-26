# BOLARS MVP: JSON-контракт обмена с 1С

Статус: draft 0.1
Дата: 2026-05-26
Аудитория: 1С-разработчик и интегратор Web-экрана в `Поле HTML-документа`.

## 1. Назначение

Этот документ описывает именно JSON-обмен между 1С и HTML-страницей BOLARS Self-Checkout MVP.

Коротко:

- Web кладёт действия покупателя в очередь команд.
- 1С забирает команды через `drainOutboundCommandsJson()`.
- 1С обрабатывает команду у себя.
- 1С возвращает полный snapshot через `receiveStateSnapshot(snapshotJsonString)`.
- Web только рисует экран по snapshot и не считает цены, скидки, поиск или оплату сам.

Для пошаговой инструкции используйте `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`.

Внутренний TypeScript/runtime-контракт живёт в `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`. Для 1С он не является основным рабочим документом.

## 2. Канал Обмена

1С получает API страницы через:

```text
Поле HTML-документа -> Документ -> window/defaultView -> window.BolarsSelfCheckout
```

Текущий рабочий URL для smoke-интеграции:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01
```

В этом режиме:

- `adapterKind` должен быть `onec`;
- Web не меняет экран сам после клика;
- команда появляется в outbound queue;
- экран меняется только после нового snapshot от 1С.

## 3. Методы API

Текущая реализация экспортирует:

| Метод | Кто вызывает | Назначение |
| --- | --- | --- |
| `getRuntimeInfoJson()` | 1С | Проверить, что HTML готов и открыт в нужном режиме. |
| `peekOutboundStatusJson()` | 1С | Посмотреть состояние очереди команд без чтения команд. |
| `drainOutboundCommandsJson()` | 1С | Забрать новые команды Web -> 1С. |
| `receiveStateSnapshot(snapshotJsonString)` | 1С | Передать Web полный snapshot состояния покупки. |
| `getLastApplyStatusJson()` | 1С | Узнать, применился ли последний snapshot. |
| `getDebugStateJson()` | 1С/debug | Получить диагностику adapter, очереди и последнего snapshot. |
| `receiveRuntimeConfig(configJsonString)` | зарезервировано | Сейчас возвращает warning и не управляет покупкой. |
| `receiveCatalog(catalogJsonString)` | зарезервировано | Сейчас возвращает warning и не управляет корзиной. |

`getRuntimeInfo()` тоже есть, но для 1С безопаснее использовать JSON string helper `getRuntimeInfoJson()`.

## 4. Проверка Готовности

Вызов:

```bsl
ИнфоJSON = API.getRuntimeInfoJson();
Инфо = ПрочитатьJSON(ИнфоJSON);
```

Ожидаемый смысл ответа:

```json
{
  "apiVersion": "0.1",
  "ready": true,
  "mode": "bolars-self-checkout-mvp",
  "debug": true,
  "route": "/bolars/self-checkout-mvp",
  "buildId": "local-dev",
  "runtimePortStatus": "ready",
  "adapterKind": "onec",
  "themeProfileId": "bolars-light-default",
  "lastSnapshotVersion": 1
}
```

Если `adapterKind` не равен `onec`, это не текущий режим обмена с 1С.

## 5. Команды Web -> 1С

1С читает очередь:

```bsl
ПакетJSON = API.drainOutboundCommandsJson();
Пакет = ПрочитатьJSON(ПакетJSON);
```

Формат ответа:

```json
{
  "ok": true,
  "commands": [
    {
      "type": "scanCode",
      "commandId": "cmd-lx001",
      "issuedAt": "2026-05-26T09:00:00.000Z",
      "source": "scanner",
      "payload": {
        "code": "4600001000011"
      }
    }
  ],
  "drainedAt": "2026-05-26T09:00:00.100Z"
}
```

Правило: `drainOutboundCommandsJson()` означает только "1С прочитала команду". Это ещё не значит, что команда выполнена.

Команда считается обработанной для Web, когда 1С вернула snapshot с:

```json
{
  "lastProcessedCommandId": "cmd-lx001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-lx001",
    "processedAt": "2026-05-26T09:00:00.300Z"
  }
}
```

## 6. Envelope Команды

Каждая команда содержит:

| Поле | Тип | Обязательность | Смысл |
| --- | --- | --- | --- |
| `type` | string | да | Тип действия покупателя. |
| `commandId` | string | да | Уникальный id команды. По нему связывается ответный snapshot. |
| `issuedAt` | string | да | ISO-время создания команды на стороне Web. |
| `source` | string | да | Источник: `scanner`, `touch`, `keyboard`, `system`, `mock`. |
| `payload` | object | зависит от команды | Данные команды. Для команд без данных поле может отсутствовать в JSON. |

## 7. Список Команд

Список сверён с `src/bolars/runtime/types.ts` и `src/bolars/runtime/commands.ts`.

| Команда | Payload |
| --- | --- |
| `startPurchase` | нет |
| `scanCode` | `{ "code": "4600001000011" }` |
| `searchProducts` | `{ "query": "дрель" }` |
| `selectSearchCandidate` | `{ "candidateId": "candidate-001" }` |
| `changeQuantity` | `{ "lineId": "line-001", "quantity": 2 }` |
| `incrementQuantity` | `{ "lineId": "line-001" }` |
| `decrementQuantity` | `{ "lineId": "line-001" }` |
| `openQuantityNumpad` | `{ "lineId": "line-001" }` |
| `confirmQuantityInput` | `{ "lineId": "line-001", "quantity": 3 }` |
| `removeCartLine` | `{ "lineId": "line-001" }` |
| `cancelPurchaseRequest` | нет |
| `confirmCancelPurchase` | нет |
| `returnToPurchase` | нет |
| `goToPaymentSetup` | нет |
| `addPackage` | `{ "packageCode": "PKG-M" }` |
| `applyDiscountByPhone` | `{ "phone": "+7 900 123 45 67" }` |
| `startPayment` | нет |
| `retryPayment` | нет |
| `returnToPaymentSetup` | нет |
| `bindManager` | `{ "code": "manager-card-code" }` |
| `setTextScale` | `{ "scale": "normal" }` |
| `resetToStart` | `{ "reason": "finalCountdown" }` |

Допустимые `scale`: `normal`, `large`, `extraLarge`.

Допустимые `reason`: `finalCountdown`, `cancelConfirmed`, `emptyCartCancel`, `inactivityTimeout`, `staffReset`, `runtimeRecovery`, `mockScenarioReset`.

## 8. Snapshot 1С -> Web

Snapshot - это полный снимок состояния покупки. 1С должна прислать всё, что нужно Web для отрисовки экрана.

Вызов:

```bsl
РезультатJSON = API.receiveStateSnapshot(ЗаписатьJSON(Snapshot));
Результат = ПрочитатьJSON(РезультатJSON);
```

После вызова проверьте:

```bsl
ApplyJSON = API.getLastApplyStatusJson();
Apply = ПрочитатьJSON(ApplyJSON);
```

Если `Apply.ok = Ложь`, Web не применил snapshot и оставил последний валидный экран.

## 9. Минимальный Полный Snapshot

Пример ниже можно использовать как форму для первого smoke после `startPurchase`. Значения должны приходить из 1С, а не из Web.

```json
{
  "snapshotVersion": 2,
  "sessionId": "session-onec-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "cart",
  "cart": {
    "id": "cart-001",
    "status": "empty",
    "lineCount": 0,
    "itemCount": 0,
    "isEmpty": true,
    "canGoToPayment": false,
    "updatedAt": "2026-05-26T09:00:00.300Z"
  },
  "cartLines": [],
  "totals": {
    "goodsSubtotal": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" },
    "packageSubtotal": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" },
    "discountTotal": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" },
    "payableTotal": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" },
    "lines": [
      { "id": "goods", "label": "Товары", "value": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" }, "kind": "goods" },
      { "id": "packages", "label": "Пакеты", "value": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" }, "kind": "package" },
      { "id": "discount", "label": "Скидка", "value": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" }, "kind": "discount" },
      { "id": "total", "label": "Итого", "value": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" }, "kind": "total" }
    ]
  },
  "discount": {
    "status": "waitingForScanOrPhone",
    "message": "Для применения скидки отсканируйте карту или введите номер телефона"
  },
  "manager": {
    "status": "none"
  },
  "searchState": {
    "query": "",
    "minQueryLength": 4,
    "source": "oneC",
    "fields": ["name", "article", "barcodeDigits"],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": ["search", "help"]
  },
  "paymentState": {
    "status": "idle",
    "amount": { "amount": 0, "currency": "RUB", "formatted": "0 ₽" },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:00:00.300Z"
  },
  "alerts": [],
  "modalState": {
    "type": "none"
  },
  "textScale": "normal",
  "themeProfile": {
    "id": "bolars-light-default",
    "status": "loaded",
    "version": "0.1",
    "tokenSetId": "bolars-light-default",
    "highContrast": false
  },
  "uiConfig": {
    "viewportProfile": "embeddedOneC",
    "language": "ru",
    "showClock": true,
    "showManagerBadge": true,
    "showHelpAction": true,
    "searchMinLength": 4,
    "searchFields": ["name", "article", "barcodeDigits"],
    "searchMaxCandidates": 6,
    "searchCandidateDisplayFormatId": "name-article-price",
    "finalAutoResetSeconds": 4,
    "inactivityTimeoutSeconds": 300,
    "inactivityWarningSeconds": 30,
    "productImageMode": "fallbackInitials",
    "motionProfile": "normal",
    "paymentProviderLabel": "банковский терминал",
    "paymentResponseTimeoutSeconds": 60,
    "packageButtons": [
      { "packageCode": "PKG-S", "label": "Маленький пакет" },
      { "packageCode": "PKG-M", "label": "Средний пакет" },
      { "packageCode": "PKG-L", "label": "Большой пакет" }
    ],
    "texts": {}
  },
  "featureFlags": {
    "mockMode": false,
    "manualSearchEnabled": true,
    "quantityNumpadEnabled": true,
    "packagesEnabled": true,
    "discountByPhoneEnabled": true,
    "managerBindingEnabled": true,
    "paymentRetryEnabled": true,
    "finalReceiptPreviewEnabled": false,
    "previewModeEnabled": false
  },
  "adapterKind": "onec",
  "lastProcessedCommandId": "cmd-lx001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-lx001",
    "processedAt": "2026-05-26T09:00:00.300Z"
  },
  "updatedAt": "2026-05-26T09:00:00.300Z"
}
```

`uiConfig.texts` должен быть объектом. Если 1С не переопределяет тексты, можно передавать пустой объект `{}`; Web возьмёт свои дефолтные тексты.

## 10. Готовые Smoke Payload JSON

Готовые copy-paste JSON payload для проверки экранов вынесены в `docs/contracts/BOLARS_1C_SMOKE_SNAPSHOTS.md`.

| Payload | Для чего |
| --- | --- |
| [startIdle](BOLARS_1C_SMOKE_SNAPSHOTS.md#startidle) | стартовый экран свободного терминала |
| [cartFilledThreeItems](BOLARS_1C_SMOKE_SNAPSHOTS.md#cartfilledthreeitems) | корзина с товарами 100/200/300 ₽ и итогом 600 ₽ |
| [cartSearchFound](BOLARS_1C_SMOKE_SNAPSHOTS.md#cartsearchfound) | корзина с результатами поиска |
| [paymentSetup](BOLARS_1C_SMOKE_SNAPSHOTS.md#paymentsetup) | подготовка оплаты |
| [paymentWaiting](BOLARS_1C_SMOKE_SNAPSHOTS.md#paymentwaiting) | ожидание оплаты |
| [paymentError](BOLARS_1C_SMOKE_SNAPSHOTS.md#paymenterror) | ошибка оплаты |
| [finalSuccess](BOLARS_1C_SMOKE_SNAPSHOTS.md#finalsuccess) | успешная оплата и чек |
| [cancelPurchaseConfirm](BOLARS_1C_SMOKE_SNAPSHOTS.md#cancelpurchaseconfirm) | модалка отмены покупки |

Эти payload не заменяют контракт. Они нужны, чтобы быстро проверить канал `receiveStateSnapshot(...)` и увидеть конкретный экран.

## 11. Строка Корзины

Если в корзине есть товар, элемент `cartLines[]` выглядит так:

```json
{
  "lineId": "line-001",
  "positionNumber": 1,
  "productId": "bolars-glue-standard",
  "sku": "BL-GLUE-25",
  "barcode": "4600001000011",
  "name": "Клей плиточный БОЛАРС Стандарт, 25 кг",
  "article": "БЛ-001",
  "packageLabel": "мешок 25 кг",
  "quantity": 2,
  "quantityMode": "integer",
  "unitLabel": "шт",
  "unitPrice": { "amount": 480, "currency": "RUB", "formatted": "480 ₽" },
  "lineTotal": { "amount": 960, "currency": "RUB", "formatted": "960 ₽" },
  "isRemovable": true,
  "quantityControls": {
    "canIncrement": true,
    "canDecrement": true,
    "canOpenNumpad": true
  },
  "lastChange": {
    "kind": "quantityIncreased",
    "occurredAt": "2026-05-26T09:00:02.000Z",
    "highlightUntil": "2026-05-26T09:00:03.400Z",
    "message": "Количество увеличено"
  }
}
```

`positionNumber` - видимый номер строки. Web не пересортировывает строки сам.

`lineTotal`, `totals`, скидки и сумма оплаты должны быть уже рассчитаны 1С.

## 12. Поиск

После команды:

```json
{
  "type": "searchProducts",
  "commandId": "cmd-search-001",
  "issuedAt": "2026-05-26T09:00:10.000Z",
  "source": "keyboard",
  "payload": {
    "query": "клей"
  }
}
```

1С должна вернуть snapshot, где `searchState.query` равен `payload.query`:

```json
{
  "searchState": {
    "query": "клей",
    "minQueryLength": 4,
    "source": "oneC",
    "fields": ["name", "article", "barcodeDigits"],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "found",
    "candidates": [
      {
        "candidateId": "candidate-bolars-glue-standard",
        "productId": "bolars-glue-standard",
        "name": "Клей плиточный БОЛАРС Стандарт, 25 кг",
        "article": "БЛ-001",
        "barcodeMasked": "460****11",
        "identifierLabel": "БЛ-001 · 460****11",
        "packageLabel": "мешок 25 кг",
        "price": { "amount": 480, "currency": "RUB", "formatted": "480 ₽" },
        "actionLabel": "Добавить"
      }
    ]
  }
}
```

`candidateId` должен оставаться стабильным до выбора. Когда Web отправит `selectSearchCandidate`, он передаст именно этот `candidateId`.

## 13. Допустимые Значения

`currentScreen`:

- `start`
- `cart`
- `paymentSetup`
- `paymentWaiting`
- `paymentError`
- `finalSuccess`

`terminalStatus`:

- `terminalFree`
- `purchaseStarted`
- `paymentInProgress`
- `purchaseCompleted`
- `purchaseCancelled`
- `inactivityTimedOut`

`cart.status`:

- `empty`
- `active`
- `lockedForPayment`
- `completed`
- `cancelled`

`paymentState.status`:

- `idle`
- `preparing`
- `waitingForCard`
- `processing`
- `success`
- `failed`
- `cancelled`
- `timeout`
- `unknown`

`paymentState.method`:

- `card`
- `sbp`
- `unknown`

`discount.status`:

- `none`
- `waitingForScanOrPhone`
- `checking`
- `applied`
- `notFound`
- `error`

`manager.status`:

- `none`
- `binding`
- `bound`
- `rejected`
- `error`

`searchState.status`:

- `idle`
- `belowMinLength`
- `searching`
- `found`
- `notFound`
- `error`

`scannerState.status`:

- `idle`
- `scanning`
- `productDetected`
- `discountDetected`
- `managerDetected`
- `unknownCode`
- `markedProductPendingDecision`
- `error`

`modalState.type`:

- `none`
- `quantityNumpad`
- `cancelPurchaseConfirm`
- `timeoutWarning`
- `alertDetails`

`textScale`:

- `normal`
- `large`
- `extraLarge`

`adapterKind`:

- `mock`
- `preview`
- `onec`
- `unknown`

В snapshot от 1С можно передавать `adapterKind="onec"`, но текущая Web-реализация всё равно отрисует свой активный adapter kind.

`uiConfig.viewportProfile`:

- `portrait1080`
- `portraitCompact`
- `landscapeKiosk`
- `landscapeCompact`
- `landscapeFallback`
- `embeddedOneC`
- `microFallback`

Для HTML внутри 1С обычно используйте `embeddedOneC`.

## 14. Правила Версий И Привязки

- `snapshotVersion` должен быть числом.
- Новый snapshot должен иметь версию не ниже текущей.
- Snapshot с версией меньше текущей Web отклонит как `staleSnapshotRejected`.
- Snapshot с той же версией считается повтором и не должен ломать UI.
- `sessionId` обязателен как строка, но текущая реализация не сравнивает его с URL.
- Если snapshot содержит `runId`, и в URL тоже есть `runId`, они должны совпадать.
- Если snapshot содержит `terminalLabel`, и в URL тоже есть `terminalLabel`, они должны совпадать.
- Если `currentScreen` неизвестен, Web отклонит snapshot.

## 15. Что Текущий Web Валидирует При Apply

Фактическая проверка в `src/bolars/runtime/baseAdapter.ts` сейчас минимальная:

- snapshot должен быть объектом;
- `snapshotVersion` должен быть number;
- `sessionId` должен быть string;
- `currentScreen` должен быть одним из известных экранов;
- должны существовать поля `cart`, `cartLines`, `totals`, `paymentState`, `searchState`, `scannerState`, `uiConfig`, `themeProfile`;
- `cartLines` должен быть массивом;
- старый `snapshotVersion` отклоняется;
- `runId` и `terminalLabel` проверяются только если они есть и в URL, и в snapshot.

Практическое правило строже: отправляйте полный snapshot из раздела 9. Минимальная apply-валидация не означает, что Web сможет красиво отрисовать неполный объект.

## 16. Статус Apply

Успешный ответ:

```json
{
  "ok": true,
  "kind": "snapshot",
  "snapshotVersion": 2,
  "errors": [],
  "warnings": [],
  "renderedScreen": "cart",
  "lastValidSnapshotVersion": 2,
  "updatedAt": "2026-05-26T09:00:00.350Z"
}
```

Отклонённый snapshot:

```json
{
  "ok": false,
  "kind": "snapshot",
  "errors": ["currentScreen is unsupported"],
  "warnings": [],
  "rejectedReason": "invalidSnapshotShape",
  "lastValidSnapshotVersion": 2,
  "updatedAt": "2026-05-26T09:00:01.000Z"
}
```

## 17. Очередь Команд

`peekOutboundStatusJson()` возвращает состояние очереди:

```json
{
  "ok": true,
  "pendingCount": 1,
  "queuedCount": 0,
  "drainedCount": 1,
  "processingCount": 0,
  "failedCount": 0,
  "timeoutCount": 0,
  "lastUnackedCommandId": "cmd-lx001",
  "oldestPendingAgeMs": 240,
  "queueOverflow": false,
  "lastDrainAt": "2026-05-26T09:00:00.100Z",
  "lastSnapshotCorrelationCommandId": null,
  "updatedAt": "2026-05-26T09:00:00.200Z"
}
```

Статусы доставки:

- `queued` - Web положил команду в очередь.
- `drainedByOneC` - 1С прочитала команду.
- `processing` - зарезервировано под будущий явный статус обработки.
- `snapshotReceived` - пришёл snapshot с `lastProcessedCommandId`.
- `acknowledged` - зарезервировано.
- `failed` - команда завершилась ошибкой.
- `timeout` - Web не дождался обработки за текущий таймаут.
- `unknown` - неизвестный статус.

Текущий лимит незавершённых команд в `OneCInterfaceAdapter` - 20. Если очередь заполнена, новая команда получает `queueOverflow`.

Незавершённые команды старше 30 секунд переводятся в `timeout`.

## 18. Что Нельзя Передавать

Не передавайте в URL, команды, snapshot и debug:

- токены;
- пароли;
- внутренние ссылки и объекты 1С;
- персональные данные покупателя;
- полные номера карт;
- сырые телефоны в debug-логах;
- коммерческие данные клиента, не нужные для экрана покупателя.

Телефон для скидки в payload сейчас приходит как строка вида `+7 900 123 45 67`. В snapshot/debug лучше хранить только маску в `discount.phoneMasked`.

## 19. Не Входит В Этот Контракт

В этот MVP-контур не входят без отдельной задачи:

- реальная ККТ/фискализация/ОФД;
- Честный знак;
- production payment internals;
- real backend/CMS/update-flow;
- отдельный catalog import через файл или textarea;
- использование `window.Showcase` для BOLARS MVP.
