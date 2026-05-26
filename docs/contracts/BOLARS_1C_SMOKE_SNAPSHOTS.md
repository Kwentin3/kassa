# BOLARS MVP: Smoke Payload JSON Для 1С

Статус: draft 0.1
Дата: 2026-05-26
Аудитория: 1С-разработчик и интегратор.

## Назначение

Этот файл содержит готовые snapshot payload JSON, которые можно передать в `window.BolarsSelfCheckout.receiveStateSnapshot(snapshotJsonString)` для проверки Web ↔ 1С канала.

Это не нормативный контракт. Нормативные правила полей, enum-значений, версий и apply-валидации находятся в `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`.

## Как Использовать

1. Откройте 1С bridge smoke URL из handoff: `self-checkout-mvp-1c.html?debug=1&adapter=onec&runId=onec-smoke-001&terminalLabel=kiosk-01`.
2. Получите `window.BolarsSelfCheckout`.
3. Скопируйте один JSON из этого файла.
4. Передайте его строкой в `API.receiveStateSnapshot(SnapshotJSON)`.
5. Проверьте `API.getLastApplyStatusJson()`: ожидается `ok=true`.

Если snapshot отправляется как ответ на команду из `drainOutboundCommandsJson()`, замените `lastProcessedCommandId` и `lastCommandResult.commandId` на фактический `commandId` команды. Для ручной проверки без команды эти два поля можно удалить.

## Быстрые Ссылки

| Payload | Проверяемый экран/состояние |
| --- | --- |
| [startIdle](#startidle) | Start: свободный терминал |
| [cartFilledThreeItems](#cartfilledthreeitems) | Cart: корзина с тремя товарами |
| [cartSearchFound](#cartsearchfound) | Cart: результаты поиска |
| [paymentSetup](#paymentsetup) | PaymentSetup: подготовка оплаты |
| [paymentWaiting](#paymentwaiting) | PaymentWaiting: ожидание оплаты |
| [paymentError](#paymenterror) | PaymentError: ошибка оплаты |
| [finalSuccess](#finalsuccess) | FinalSuccess: успешная оплата |
| [cancelPurchaseConfirm](#cancelpurchaseconfirm) | Modal: подтверждение отмены покупки |

## startIdle

Проверить, что Web принимает snapshot стартового экрана.

```json
{
  "snapshotVersion": 10,
  "sessionId": "session-start-idle-smoke-001",
  "terminalStatus": "terminalFree",
  "currentScreen": "start",
  "cart": {
    "id": "cart-empty-001",
    "status": "empty",
    "lineCount": 0,
    "itemCount": 0,
    "isEmpty": true,
    "canGoToPayment": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [],
  "totals": {
    "goodsSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "idle",
    "amount": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-start-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-start-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## cartFilledThreeItems

Открыть экран корзины: 3 строки, товары 100/200/300 ₽, итог 600 ₽.

```json
{
  "snapshotVersion": 11,
  "sessionId": "session-cart-filled-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "cart",
  "cart": {
    "id": "cart-smoke-001",
    "status": "active",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": true,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "idle",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "alerts": [
    {
      "id": "alert-cart-smoke",
      "kind": "success",
      "title": "Тестовая корзина загружена"
    }
  ],
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-cart-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-cart-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## cartSearchFound

Проверить вывод кандидатов поиска на экране корзины.

```json
{
  "snapshotVersion": 12,
  "sessionId": "session-cart-search-found-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "cart",
  "cart": {
    "id": "cart-smoke-001",
    "status": "active",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": true,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "query": "тест",
    "minQueryLength": 4,
    "source": "oneC",
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "found",
    "candidates": [
      {
        "candidateId": "candidate-test-product-001",
        "productId": "test-product-001",
        "name": "Тестовый товар 1",
        "article": "ТЕСТ-001",
        "barcodeMasked": "200****11",
        "identifierLabel": "ТЕСТ-001 · 200****11",
        "price": {
          "amount": 100,
          "currency": "RUB",
          "formatted": "100 ₽"
        },
        "actionLabel": "Добавить"
      },
      {
        "candidateId": "candidate-test-product-002",
        "productId": "test-product-002",
        "name": "Тестовый товар 2",
        "article": "ТЕСТ-002",
        "barcodeMasked": "200****28",
        "identifierLabel": "ТЕСТ-002 · 200****28",
        "price": {
          "amount": 200,
          "currency": "RUB",
          "formatted": "200 ₽"
        },
        "actionLabel": "Добавить"
      }
    ]
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "idle",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-search-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-search-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## paymentSetup

Проверить экран состава покупки, пакетов, скидки и кнопки оплаты.

```json
{
  "snapshotVersion": 13,
  "sessionId": "session-payment-setup-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "paymentSetup",
  "cart": {
    "id": "cart-smoke-001",
    "status": "active",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": true,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "idle",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-payment-setup-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-payment-setup-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## paymentWaiting

Проверить экран ожидания банковского терминала.

```json
{
  "snapshotVersion": 14,
  "sessionId": "session-payment-waiting-smoke-001",
  "terminalStatus": "paymentInProgress",
  "currentScreen": "paymentWaiting",
  "cart": {
    "id": "cart-smoke-001",
    "status": "lockedForPayment",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "waitingForCard",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "card",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z",
    "orderNumber": "ORDER-001",
    "message": "Ожидаем оплату...",
    "startedAt": "2026-05-26T09:10:00.000Z"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-start-payment-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-start-payment-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## paymentError

Проверить экран ошибки с повтором оплаты и возвратом к подготовке.

```json
{
  "snapshotVersion": 15,
  "sessionId": "session-payment-error-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "paymentError",
  "cart": {
    "id": "cart-smoke-001",
    "status": "active",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": true,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "failed",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "card",
    "canRetry": true,
    "canReturnToPaymentSetup": true,
    "updatedAt": "2026-05-26T09:10:00.000Z",
    "paymentId": "pay-smoke-001",
    "orderNumber": "ORDER-001",
    "message": "Оплата не прошла",
    "failureReason": "declined"
  },
  "alerts": [
    {
      "id": "alert-payment-error-smoke",
      "kind": "error",
      "title": "Оплата не прошла",
      "message": "Попробуйте ещё раз или обратитесь к сотруднику"
    }
  ],
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-payment-error-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-payment-error-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## finalSuccess

Проверить финальный экран, чек и countdown до возврата на старт.

```json
{
  "snapshotVersion": 16,
  "sessionId": "session-final-success-smoke-001",
  "terminalStatus": "purchaseCompleted",
  "currentScreen": "finalSuccess",
  "cart": {
    "id": "cart-smoke-001",
    "status": "completed",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "success",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "card",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z",
    "paymentId": "pay-smoke-001",
    "orderNumber": "ORDER-001",
    "message": "Оплата прошла успешно"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-final-success-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-final-success-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```

## cancelPurchaseConfirm

Проверить overlay отмены покупки поверх корзины.

```json
{
  "snapshotVersion": 17,
  "sessionId": "session-cancel-confirm-smoke-001",
  "terminalStatus": "purchaseStarted",
  "currentScreen": "cart",
  "cart": {
    "id": "cart-smoke-001",
    "status": "active",
    "lineCount": 3,
    "itemCount": 3,
    "isEmpty": false,
    "canGoToPayment": true,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "cartLines": [
    {
      "lineId": "line-test-001",
      "positionNumber": 1,
      "productId": "test-product-001",
      "sku": "TEST-001",
      "barcode": "2000000000011",
      "name": "Тестовый товар 1",
      "article": "ТЕСТ-001",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "lineTotal": {
        "amount": 100,
        "currency": "RUB",
        "formatted": "100 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      },
      "lastChange": {
        "kind": "added",
        "occurredAt": "2026-05-26T09:10:00.000Z",
        "message": "Товар добавлен"
      }
    },
    {
      "lineId": "line-test-002",
      "positionNumber": 2,
      "productId": "test-product-002",
      "sku": "TEST-002",
      "barcode": "2000000000028",
      "name": "Тестовый товар 2",
      "article": "ТЕСТ-002",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "lineTotal": {
        "amount": 200,
        "currency": "RUB",
        "formatted": "200 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    },
    {
      "lineId": "line-test-003",
      "positionNumber": 3,
      "productId": "test-product-003",
      "sku": "TEST-003",
      "barcode": "2000000000035",
      "name": "Тестовый товар 3",
      "article": "ТЕСТ-003",
      "quantity": 1,
      "quantityMode": "integer",
      "unitLabel": "шт",
      "unitPrice": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "lineTotal": {
        "amount": 300,
        "currency": "RUB",
        "formatted": "300 ₽"
      },
      "isRemovable": true,
      "quantityControls": {
        "canIncrement": true,
        "canDecrement": false,
        "canOpenNumpad": true
      }
    }
  ],
  "totals": {
    "goodsSubtotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "packageSubtotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "discountTotal": {
      "amount": 0,
      "currency": "RUB",
      "formatted": "0 ₽"
    },
    "payableTotal": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "lines": [
      {
        "id": "goods",
        "label": "Товары",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "goods"
      },
      {
        "id": "packages",
        "label": "Пакеты",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "package"
      },
      {
        "id": "discount",
        "label": "Скидка",
        "value": {
          "amount": 0,
          "currency": "RUB",
          "formatted": "0 ₽"
        },
        "kind": "discount"
      },
      {
        "id": "total",
        "label": "Итого",
        "value": {
          "amount": 600,
          "currency": "RUB",
          "formatted": "600 ₽"
        },
        "kind": "total"
      }
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
    "fields": [
      "name",
      "article",
      "barcodeDigits"
    ],
    "maxCandidates": 6,
    "candidateDisplayFormatId": "name-article-price",
    "status": "idle",
    "candidates": []
  },
  "scannerState": {
    "status": "idle",
    "canScan": true,
    "fallbackActions": [
      "search",
      "help"
    ]
  },
  "paymentState": {
    "status": "idle",
    "amount": {
      "amount": 600,
      "currency": "RUB",
      "formatted": "600 ₽"
    },
    "method": "unknown",
    "canRetry": false,
    "canReturnToPaymentSetup": false,
    "updatedAt": "2026-05-26T09:10:00.000Z"
  },
  "alerts": [],
  "modalState": {
    "type": "cancelPurchaseConfirm",
    "title": "Отменить покупку и очистить корзину?",
    "message": "Корзина будет очищена.",
    "confirmLabel": "Да, отменить",
    "returnLabel": "Вернуться к покупке"
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
    "searchFields": [
      "name",
      "article",
      "barcodeDigits"
    ],
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
      {
        "packageCode": "PKG-S",
        "label": "Маленький пакет"
      },
      {
        "packageCode": "PKG-M",
        "label": "Средний пакет"
      },
      {
        "packageCode": "PKG-L",
        "label": "Большой пакет"
      }
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
  "lastProcessedCommandId": "cmd-smoke-cancel-request-001",
  "lastCommandResult": {
    "ok": true,
    "commandId": "cmd-smoke-cancel-request-001",
    "processedAt": "2026-05-26T09:10:00.000Z"
  },
  "updatedAt": "2026-05-26T09:10:00.000Z"
}
```
