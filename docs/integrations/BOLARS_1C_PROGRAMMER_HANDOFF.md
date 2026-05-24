# BOLARS MVP: Инструкция Для 1С-Специалиста

Дата: 2026-05-24
Статус: рабочая инструкция после contract audit

## 1. Что Открывать

Используйте режим по задаче. Самый важный режим для 1С-интеграции - **"1С bridge / adapter=onec"**.

| Режим | Ссылка | Для чего нужен | Что будет происходить |
| --- | --- | --- | --- |
| Диагностика браузера 1С | [Открыть диагностику](https://kassa.speechbattle.com/diagnostics/1c-html-shell) | Проверить возможности `Поле HTML-документа` 1С: JavaScript, CSS, viewport, ввод, JSON-отчёт. | Это не касса. Страница только диагностирует среду и содержит ссылки на витрины. |
| UI-проверка 1C HTML без 1С | [Открыть 1C HTML в mock-режиме](https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1) | Проверить, что в 1С-совместимой HTML-версии работают клики, переходы экранов, скролл и верстка. | Web сам меняет состояние через mock-runtime. 1С не нужна. |
| 1С bridge / adapter=onec | [Открыть 1C HTML для интеграции](https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01) | Основной режим для программиста 1С: проверить обмен `Web -> 1С -> Web`. | Web **не меняет экран сам**. Кнопки кладут команды в очередь. Экран изменится только после того, как 1С заберёт команду и вернёт `snapshot`. |
| Preview фиксированных состояний | [Открыть cartManyItems](https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&preview=1&scenario=cartManyItems) | Быстро посмотреть конкретное состояние без кликов и без 1С. Полезно для верстки. | Runtime показывает заранее собранный snapshot. Команды покупателя не являются целью этого режима. |
| Обычная web-демо витрина | [Открыть web demo](https://kassa.speechbattle.com/bolars/self-checkout-mvp) | Проверить браузерную demo/mock-витрину вне 1С. | Это не live 1С-bridge. Для интеграции с 1С этот URL не использовать как основной. |

Допустимые preview-сценарии: `startIdle`, `cartEmpty`, `cartOneItem`, `cartManyItems`, `textScaleExtraLarge`, `paymentSetup`, `paymentWaiting`, `paymentError`, `finalSuccess`.

Ключевое правило для `adapter=onec`: если нажали кнопку, а экран не поменялся, это нормально до тех пор, пока 1С не вернула новый `snapshot`. В debug panel при этом должна появиться команда в outbound queue.

`debug=1` включает служебную панель сверху. Это не режим покупателя. Панель нужна, чтобы видеть команды, snapshots и ошибки обмена.

`adapter=onec` включает текущий тестовый канал Web <-> 1С. Без `debug=1` этот параметр сейчас игнорируется.

В URL нельзя класть секреты, телефоны, ФИО, токены, внутренние ссылки 1С и коммерческие данные.

## 2. Главная Идея

Web-страница живёт внутри 1С как экран покупателя. 1С остаётся главным источником данных и решений.

Простая схема:

```text
Покупатель нажал кнопку / отсканировал товар
  -> Web положил команду в очередь
  -> 1С забрала команду
  -> 1С пересчитала покупку у себя
  -> 1С вернула Web полный snapshot
  -> Web показал новый экран
```

Web не вызывает 1С напрямую. Он только складывает действия покупателя в очередь.

1С не лезет в React-компоненты. React-компоненты - это внутренняя веб-реализация экрана. Для 1С они не являются API.

Обмен идёт через HTML API:

```text
window.BolarsSelfCheckout
```

HTML API - это набор JavaScript-методов внутри HTML-страницы. 1С вызывает эти методы через `Поле HTML-документа -> Документ -> window/defaultView`.

Web отдаёт в 1С typed commands. Простыми словами: это JSON-команды с типом действия, например `scanCode`, `searchProducts`, `startPayment`.

1С отдаёт в Web authoritative state snapshot. Простыми словами: это полный снимок состояния покупки, которому Web доверяет и по которому рисует экран.

Важно про текущий контур:

- Для интеграции и smoke сейчас используйте `self-checkout-mvp-1c.html?debug=1&adapter=onec`.
- Для ручной проверки UI без 1С используйте `self-checkout-mvp-1c.html?debug=1`.
- Чистый customer URL без `debug=1` сейчас работает как mock/demo и не является live 1С-bridge.
- Production-запуск без debug-панели нужно согласовать отдельным срезом, чтобы не смешивать демо, smoke и реальный режим.

## 2.1. Мини-Словарь Терминов

| Термин | Простое объяснение для 1С |
| --- | --- |
| Web / HTML-страница | Экран покупателя, который открыт внутри 1С в `Поле HTML-документа`. |
| `window` | Объект HTML-страницы, через который 1С получает доступ к методам страницы. |
| HTML API | Набор методов страницы, которые можно вызвать из 1С. В нашем случае это `window.BolarsSelfCheckout.*`. |
| command | Команда от Web в 1С: "покупатель сделал действие". |
| payload | Данные внутри команды. Например, штрихкод, строка поиска или телефон. |
| outbound queue | Очередь команд Web -> 1С. Простыми словами: ящик, куда Web кладёт действия покупателя, а 1С периодически забирает. |
| drain | Забрать команды из очереди. Это значит "1С прочитала", но ещё не значит "команда успешно выполнена". |
| snapshot | Полный снимок состояния покупки от 1С в Web: экран, корзина, итоги, поиск, оплата, ошибки. |
| authoritative | Авторитетный, главный. Если 1С прислала snapshot, Web показывает именно его и не пересчитывает бизнес-логику сам. |
| adapter | Режим подключения runtime. Для 1С нужен `onec`; для демо есть `mock`; для проверки состояний есть `preview`. |
| debug panel | Служебная панель сверху. Нужна для интеграции и диагностики, покупателю не показывается. |

## 3. Как Получить API Из 1С

Вызывать API нужно после загрузки HTML-документа. В разных версиях 1С это может быть событие вроде "документ сформирован/загружен".

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

`API = Неопределено` обычно означает одно из трёх: страница ещё грузится, открыт не BOLARS route, либо 1С не получила доступ к `window/defaultView` в вашей версии платформы.

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

Если `adapterKind` не равен `onec`, значит страница открыта не в текущем 1С-интеграционном режиме.

Для сравнения:

- в `self-checkout-mvp-1c.html?debug=1` без `adapter=onec` ожидается `adapterKind="mock"`;
- в `self-checkout-mvp-1c.html?debug=1&preview=1&scenario=...` ожидается `adapterKind="preview"`;
- в `self-checkout-mvp-1c.html?debug=1&adapter=onec` ожидается `adapterKind="onec"`.

## 4. Как Забрать События Из Web

Web складывает команды пользователя в outbound queue. Это не файл, не textarea и не ручной обмен JSON. Это программная очередь внутри HTML-страницы.

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

Если 1С забрала команду, но не вернула snapshot, Web продолжит считать команду незавершённой. Это будет видно в debug panel.

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

Поля команды:

- `type` - что сделал покупатель;
- `commandId` - уникальный номер команды, по нему связываем команду и ответный snapshot;
- `issuedAt` - время создания команды на стороне Web;
- `source` - откуда пришло действие: сканер, клавиатура, кнопка;
- `payload` - данные команды.

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

После последнего UI-среза:

- Поиск вводится покупателем через экранную клавиатуру Web. 1С видит только команду `searchProducts` после `4+` символов.
- В ответе на `searchProducts` верните `searchState.query` равным `Команда.payload.query`; иначе Web не покажет кандидатов как результат текущего ввода.
- `candidateId` в `selectSearchCandidate` должен совпадать с `candidateId`, который 1С ранее вернула в `searchState.candidates`.
- Телефон вводится через центральный numeric numpad Web. 1С получает `applyDiscountByPhone` с `payload.phone` в формате `+7 900 123 45 67`.

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

    ИначеЕсли Команда.type = "selectSearchCandidate" Тогда
        // candidateId должен быть тем же, который 1С ранее отдала в searchState.candidates.
        Состояние = ДобавитьНайденныйТоварВПокупку(Команда.payload.candidateId);

    ИначеЕсли Команда.type = "applyDiscountByPhone" Тогда
        // Телефон приходит уже с +7, например "+7 900 123 45 67".
        Состояние = ПроверитьСкидкуПоТелефону(Команда.payload.phone);

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

`receiveRuntimeConfig()` и `receiveCatalog()` сейчас не используйте как рабочий путь. Они есть в API как reserved helpers, но не меняют корзину, поиск или оплату.

## 8. Snapshot: Что Обязательно Отдавать

Snapshot - это полный снимок состояния покупки. Web не должен догадываться, какие цены, скидки, товары или экран теперь правильные. 1С должна прислать всё нужное для показа.

Не копируйте старые укороченные JSON-примеры как готовый payload. Web принимает полный `SelfCheckoutStateSnapshot` по контракту `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`.

Минимально проверьте, что в каждом snapshot есть актуальные имена полей:

```text
snapshotVersion, sessionId, terminalStatus, currentScreen,
cart, cartLines, totals, discount, manager,
searchState, scannerState, paymentState,
alerts, modalState, textScale, themeProfile,
uiConfig, featureFlags, adapterKind, updatedAt
```

Критичные детали текущего контракта:

- `modalState` использует поле `type`, например `{ "type": "none" }`, не `kind`.
- `featureFlags` использует имена `manualSearchEnabled`, `quantityNumpadEnabled`, `packagesEnabled`, `discountByPhoneEnabled`, `managerBindingEnabled`, `paymentRetryEnabled`, `finalReceiptPreviewEnabled`.
- `uiConfig` использует `packageButtons`, `searchMinLength`, `searchFields`, `searchMaxCandidates`, `finalAutoResetSeconds`, `inactivityTimeoutSeconds`, `inactivityWarningSeconds`; старые поля `packages` / `timeouts` не являются текущим контрактом.
- `cart` должен содержать `id`, `status`, `lineCount`, `itemCount`, `isEmpty`, `canGoToPayment`, `updatedAt`.
- Каждая строка `cartLines` должна содержать `positionNumber`, `sku`, `quantityMode`, `unitLabel`, `unitPrice`, `lineTotal`, `isRemovable`, `quantityControls`.
- `searchState.candidates[].candidateId` должен быть стабильным до выбора кандидата.
- `adapterKind` в присланном snapshot может быть передан, но Web всё равно отрисует свой текущий adapter kind.

Практический смысл: если поле есть в контракте и влияет на экран, лучше отдавать его всегда. Не рассчитывайте, что Web сам подставит бизнес-значение.

## 9. Правила Snapshot

- `snapshotVersion` должен расти.
- Старый `snapshotVersion` Web отклонит.
- Snapshot с чужим `sessionId` / `runId` может быть отклонён.
- `currentScreen` должен быть известным: `start`, `cart`, `paymentSetup`, `paymentWaiting`, `paymentError`, `finalSuccess`.
- После каждой принятой команды желательно возвращать `lastProcessedCommandId`.
- UI не чинит бизнес-поля молча. Если snapshot invalid, он сохраняет последний валидный экран.

`snapshotVersion` - это номер версии снимка. Увеличивайте его при каждом новом ответе 1С. Это защищает экран от старых ответов, которые пришли позже новых.

`lastProcessedCommandId` - это связь ответа с командой. Если Web отправил `cmd-001`, то после обработки этой команды snapshot должен содержать `lastProcessedCommandId = "cmd-001"`.

## 10. Мини-Smoke Для 1С

1. Открыть:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01
```

2. Получить `window.BolarsSelfCheckout`.

3. Вызвать:

```bsl
API.getRuntimeInfoJson()
```

4. На экране нажать действие, например старт покупки.

Важно: после нажатия в этом режиме экран может остаться на месте. Это нормально: Web только создал команду для 1С. Следующий экран появится после `receiveStateSnapshot(SnapshotJSON)`.

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

Минимальный успешный результат: 1С забрала хотя бы одну команду Web и вернула snapshot, который Web принял без ошибки.

## 11. Что Нельзя Делать

- Не использовать `window.Showcase` для BOLARS MVP.
- Не вставлять JSON руками в textarea.
- Не загружать JSON файлом.
- Не считать цены, скидки и итоги в Web.
- Не передавать секреты в URL.
- Не отправлять в debug сырые телефоны, карты, токены, внутренние ссылки 1С.
- Не использовать `receiveCatalog()` как путь управления корзиной.
- Не ждать `ackOutboundCommandsJson()` / `failOutboundCommandsJson()` - в текущем API этих методов нет.
- Не делать Честный знак, ККТ/фискализацию и production payment internals в этом контуре без отдельной задачи.

## 12. Что Считать Готовностью Интеграции

Для первого интеграционного шага достаточно:

- 1С открывает debug URL в `Поле HTML-документа`;
- 1С получает `window.BolarsSelfCheckout`;
- `getRuntimeInfoJson()` возвращает `ready=true` и `adapterKind=onec`;
- 1С забирает команды через `drainOutboundCommandsJson()`;
- 1С отдаёт полный snapshot через `receiveStateSnapshot(...)`;
- `getLastApplyStatusJson()` возвращает `ok=true`;
- debug panel показывает связь команды и snapshot по `commandId`.
