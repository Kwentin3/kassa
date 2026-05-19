# Diagnostic Protocol `diag.*`

Дата: 2026-05-19
Статус: Slice 2 draft

Этот протокол нужен только для проверки обмена HTML ↔ 1С. Он не является боевым bridge-протоколом кассы и не должен вызывать РМК, чек, оплату, ККТ, фискализацию или маркировку.

## Разрешенные команды

| Команда | Назначение |
|---|---|
| `diag.ready` | HTML сообщает, что страница загрузилась и готова к диагностике обмена. |
| `diag.ping` | Проверка round-trip HTML → 1С → HTML с тем же `requestId`. |
| `diag.hrefTransport` | Проверка транспорта через `oneshell://diag?payload=...`. |
| `diag.domMailbox` | Проверка транспорта через скрытый DOM mailbox. |
| `diag.directJsCall` | Проверка прямого вызова `window.DiagnosticHarness.*` из 1С. |
| `diag.payloadSize` | Проверка допустимого размера payload. |
| `diag.roundTrip` | Измерение примерной задержки обмена. |
| `diag.getEnvironmentFrom1C` | Получение безопасных metadata 1С. |

## Запрещенные команды

В этой обработке запрещено выполнять любые production-команды, включая:

- `cart.addProduct`;
- `cart.addByBarcode`;
- `payment.startCard`;
- `receipt.getStatus`;
- `receipt.print`;
- `session.start`;
- `session.cancel`.

Если команда не начинается с `diag.`, loader должен отклонить ее или проигнорировать и записать событие в журнал.

## Command envelope

```json
{
  "diagnosticVersion": "0.1",
  "requestId": "diag-req-001",
  "command": "diag.ping",
  "payload": {},
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

## Response envelope

```json
{
  "diagnosticVersion": "0.1",
  "requestId": "diag-req-001",
  "ok": true,
  "source": "1c-diagnostic-loader",
  "payload": {
    "echo": true
  },
  "timestamp": "2026-05-19T00:00:00.000Z"
}
```

Ключевое правило: `requestId` в ответе должен совпадать с `requestId` входящей команды.

## Безопасные metadata 1С

```json
{
  "platformVersion": "8.3.x",
  "clientType": "thin|thick|web|unknown",
  "configurationName": "Retail|UNF|UT|custom|unknown",
  "configurationVersion": "string-or-null",
  "compatibilityMode": "string-or-null",
  "terminalLabel": "manual label"
}
```

## Запрещенные данные

Не передавать в HTML и JSON-отчет:

- логины, пароли, токены;
- строки подключения;
- имена пользователей;
- персональные данные;
- товары, чеки, суммы;
- фискальные данные;
- данные карт;
- внутренние ссылки на объекты 1С;
- коммерческие данные клиента;
- содержимое cookies, localStorage или clipboard.

## TODO

- TODO: проверить href/navigation transport на целевой версии 1С.
- TODO: проверить DOM mailbox transport на целевой версии 1С.
- TODO: проверить direct JS call на целевой версии 1С.
- TODO: проверить толстый/тонкий/web-клиент отдельно.
- TODO: не смешивать `diag.*` с production bridge commands.
