# BOLARS MVP: 1C Programmer Handoff

Дата: 2026-05-23
Статус: короткая рабочая инструкция

## 1. Что Открывать

Основной URL:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp
```

Для проверки интеграции включайте debug:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01
```

В URL нельзя класть секреты, телефоны, ФИО, токены, внутренние ссылки 1С и коммерческие данные.

## 2. Главная Идея

Web не вызывает 1С напрямую.

1С не лезет в React-компоненты.

Обмен только через HTML API:

```text
window.BolarsSelfCheckout
```

Web отдаёт в 1С typed commands: что сделал пользователь.

1С отдаёт в Web полный authoritative state snapshot: что теперь нужно показать на экране.

## 3. Как Получить API Из 1С

Псевдокод:

```bsl
ДокументHTML = ПолеHTMLДокумента.Документ;
ОкноHTML = ДокументHTML.defaultView; // или аналогичный доступ к window в вашей версии платформы

API = ОкноHTML.BolarsSelfCheckout;

Если API = Неопределено Тогда
    // HTML ещё не загрузился или открыт не тот route
    Возврат;
КонецЕсли;
```

Проверка готовности:

```bsl
ИнфоJSON = API.getRuntimeInfoJson();
Инфо = ПрочитатьJSON(ИнфоJSON);

Если Не Инфо.ready Тогда
    Возврат;
КонецЕсли;
```

Ожидаемо:

```json
{
  "apiVersion": "0.1",
  "ready": true,
  "mode": "bolars-self-checkout-mvp",
  "adapterKind": "onec",
  "runtimePortStatus": "ready"
}
```

## 4. Как Забрать События Из Web

Web складывает команды пользователя в outbound queue.

1С читает очередь по таймеру, например каждые `100-300 ms` во время активной покупки.

Псевдокод:

```bsl
Процедура ТаймерОбменаСWeb()
    СтатусJSON = API.peekOutboundStatusJson();
    Статус = ПрочитатьJSON(СтатусJSON);

    Если Статус.pendingCount = 0 Тогда
        Возврат;
    КонецЕсли;

    ПакетJSON = API.drainOutboundCommandsJson();
    Пакет = ПрочитатьJSON(ПакетJSON);

    Для Каждого Команда Из Пакет.commands Цикл
        ОбработатьКомандуWeb(Команда);
    КонецЦикла;
КонецПроцедуры
```

Важно: `drainOutboundCommandsJson()` означает только "1С прочитала команду". Это ещё не успех.

Команда считается завершённой, когда 1С вернула snapshot с тем же `commandId` в `lastProcessedCommandId` / `lastCommandResult`.

## 5. Пример Команды Из Web

```json
{
  "type": "scanCode",
  "commandId": "cmd-001",
  "issuedAt": "2026-05-23T12:00:00.000Z",
  "source": "scanner",
  "payload": {
    "code": "4601234567890"
  }
}
```

Типовые команды:

- `startPurchase`
- `scanCode`
- `searchProducts`
- `selectSearchCandidate`
- `incrementQuantity`
- `decrementQuantity`
- `confirmQuantityInput`
- `removeCartLine`
- `goToPaymentSetup`
- `addPackage`
- `applyDiscountByPhone`
- `startPayment`
- `retryPayment`
- `resetToStart`

Полный список команд: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`.

## 6. Что Делает 1С После Команды

Псевдокод:

```bsl
Процедура ОбработатьКомандуWeb(Команда)
    Если Команда.type = "scanCode" Тогда
        // 1С определяет тип кода: товар, скидка, менеджер, неизвестный код.
        // UI сам этого не решает.
        Состояние = ОбработатьСканирование(Команда.payload.code);

    ИначеЕсли Команда.type = "searchProducts" Тогда
        Состояние = НайтиТоварыВ1С(Команда.payload.query);

    ИначеЕсли Команда.type = "startPayment" Тогда
        Состояние = НачатьОплатуЧерезЭквайринг();

    Иначе
        Состояние = ПрименитьКомандуКПокупке(Команда);
    КонецЕсли;

    Snapshot = СобратьПолныйSnapshot(Состояние, Команда.commandId);
    API.receiveStateSnapshot(ЗаписатьJSON(Snapshot));
КонецПроцедуры
```

1С владеет бизнес-истиной:

- корзина;
- цены;
- скидки;
- итоги;
- поиск;
- тип scanned code;
- менеджер;
- оплата.

## 7. Как Отдать Данные В Web

1С вызывает:

```bsl
РезультатJSON = API.receiveStateSnapshot(SnapshotJSON);
Результат = ПрочитатьJSON(РезультатJSON);
```

После этого можно проверить:

```bsl
ApplyJSON = API.getLastApplyStatusJson();
Apply = ПрочитатьJSON(ApplyJSON);

Если Не Apply.ok Тогда
    // Snapshot не применился: stale version, другой sessionId, неизвестный screen или invalid shape.
    СообщитьВЛог(Apply.rejectedReason);
КонецЕсли;
```

## 8. Минимальный Snapshot

Это упрощённый пример. В реальной интеграции отдавайте полный snapshot по контракту.

```json
{
  "snapshotVersion": 15,
  "sessionId": "sale-001",
  "currentScreen": "cart",
  "lastProcessedCommandId": "cmd-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-001"
  },
  "cart": {
    "status": "active",
    "lineCount": 1
  },
  "cartLines": [
    {
      "lineId": "line-001",
      "position": 1,
      "productId": "product-001",
      "name": "Клей плиточный БОЛАРС",
      "quantity": 1,
      "lineTotal": {
        "amount": 52000,
        "currency": "RUB",
        "formatted": "520 ₽"
      }
    }
  ],
  "totals": {
    "payableTotal": {
      "amount": 52000,
      "currency": "RUB",
      "formatted": "520 ₽"
    }
  },
  "searchState": {
    "status": "idle",
    "query": "",
    "candidates": []
  },
  "paymentState": {
    "status": "idle"
  },
  "scannerState": {
    "status": "productDetected"
  },
  "discount": {
    "status": "none"
  },
  "manager": {
    "status": "none"
  },
  "modalState": {
    "kind": "none"
  },
  "textScale": "normal",
  "themeProfile": {
    "id": "bolars-light-default",
    "status": "loaded",
    "version": "0.1",
    "tokenSetId": "bolars-light-default"
  },
  "uiConfig": {
    "texts": {},
    "packages": [],
    "timeouts": {
      "inactivityMs": 300000,
      "finalScreenMs": 5000
    }
  },
  "featureFlags": {
    "manualSearch": true,
    "discount": true,
    "managerBinding": true
  },
  "alerts": [],
  "updatedAt": "2026-05-23T12:00:01.000Z"
}
```

## 9. Правила Snapshot

- `snapshotVersion` должен расти.
- Старый `snapshotVersion` Web отклонит.
- Snapshot с чужим `sessionId` / `runId` может быть отклонён.
- `currentScreen` должен быть известным: `start`, `cart`, `paymentSetup`, `paymentWaiting`, `paymentError`, `finalSuccess`.
- После каждой принятой команды желательно возвращать `lastProcessedCommandId`.
- UI не чинит бизнес-поля молча. Если snapshot invalid, он сохраняет последний валидный экран.

## 10. Мини-Smoke Для 1С

1. Открыть:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01
```

2. Получить `window.BolarsSelfCheckout`.

3. Вызвать:

```bsl
API.getRuntimeInfoJson()
```

4. На экране нажать действие, например старт покупки.

5. Вызвать:

```bsl
API.peekOutboundStatusJson()
API.drainOutboundCommandsJson()
```

6. Обработать команду и вызвать:

```bsl
API.receiveStateSnapshot(SnapshotJSON)
```

7. Проверить:

```bsl
API.getLastApplyStatusJson()
API.getDebugStateJson()
```

8. В debug panel должно быть видно:

- команда появилась;
- команда считана 1С;
- snapshot применён;
- `commandId` связан со snapshot;
- apply status `ok`.

## 11. Что Нельзя Делать

- Не использовать `window.Showcase` для BOLARS MVP.
- Не вставлять JSON руками в textarea.
- Не загружать JSON файлом.
- Не считать цены, скидки и итоги в Web.
- Не передавать секреты в URL.
- Не отправлять в debug сырые телефоны, карты, токены, внутренние ссылки 1С.
- Не использовать `receiveCatalog()` как путь управления корзиной.
- Не делать Честный знак, ККТ/фискализацию и production payment internals в этом контуре без отдельной задачи.
