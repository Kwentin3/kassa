# BOLARS Preview and Layered Architecture Refine Report

Дата: 2026-05-23
Статус: completed
Задача: refine/refactor документации BOLARS MVP — Preview Mode + Layered Architecture + Adapter Factory.

## 1. Что Изменено

Документационный пакет дополнен архитектурной картой слоёв, контрактом выбора runtime adapter и контрактом служебного preview mode.

Главная цель изменений: implementation agent должен реализовывать BOLARS MVP как один snapshot-driven runtime pipeline, где UI не знает про 1С, mock, preview или конкретный adapter.

## 2. Созданные Документы

- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/reports/2026-05-23/BOLARS_PREVIEW_AND_LAYERED_ARCHITECTURE_REFINE.report.md`

## 3. Обновлённые Документы

- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`

## 4. Почему Нужен Preview Mode

Строгий customer flow полезен для продукта, но неудобен для разработки и визуальной приёмки. Чтобы открыть `paymentError`, `finalSuccess`, `quantityNumpad`, empty cart, many items, timeout warning или text scale variants, разработчику не нужно каждый раз проходить весь scan-first сценарий.

Preview Mode решает эту проблему как служебный режим:

- быстро открывает отдельный screen/state;
- помогает делать visual smoke screenshots;
- помогает дизайнеру и приёмщику проверять редкие состояния;
- не становится customer workflow;
- не становится production admin.

## 5. Почему Preview Идёт Через PreviewAdapter

Preview Mode через `PreviewAdapter` сохраняет архитектурную честность.

Правильная схема:

```text
Preview control
  -> PreviewAdapter
  -> SelfCheckoutRuntimePort
  -> authoritative preview snapshot
  -> UI renders snapshot
```

Это означает, что UI рендерит тот же state contract, что mock и 1С. Компоненты не получают отдельный preview-only путь и не начинают напрямую монтировать screens.

Запрещённый путь:

```text
Preview button
  -> directly render PaymentError component bypassing RuntimePort
```

Такой путь быстро ломает продуктовую архитектуру: screen начинает жить отдельно от RuntimePort, а bugs в snapshot mapping остаются незамеченными.

## 6. Почему Нужна RuntimeAdapterFactory

`RuntimeAdapterFactory` нужна, чтобы UI не выбирал runtime source.

Без factory есть риск, что screens/components начнут импортировать `MockAdapter`, `PreviewAdapter` или `OneCInterfaceAdapter` напрямую. Тогда при переходе от mock к 1С придётся переписывать UI, а debug/preview начнут расходиться с real flow.

Factory централизует выбор:

- local/dev -> `MockAdapter`;
- `debug=1&preview=1` -> `PreviewAdapter`;
- allowed 1С shell context -> `OneCInterfaceAdapter`.

Adapter choice виден в debug panel, но customer UI не получает adapter switcher.

## 7. Почему Один RuntimePort Лучше Нескольких Путей

Один `SelfCheckoutRuntimePort` фиксирует единый язык между UI и runtime:

- typed commands;
- authoritative state snapshot;
- `dispatch/getState/subscribe`;
- same adapter contract for mock, preview and 1С.

Это снижает риск, что UI начнёт:

- считать цены;
- мутировать корзину;
- угадывать тип штрих-кода;
- напрямую вызывать 1С;
- напрямую рендерить preview screens.

## 8. Как Это Помогает Debug и Сопровождению

Debug panel теперь может показывать:

- `adapterKind`: `mock`, `preview`, `onec`, `unknown`;
- `previewMode`;
- selected preview screen/scenario;
- preview snapshot version;
- outbound commands mode;
- command queue lifecycle;
- command/snapshot correlation;
- apply status.

Это делает debug полезным не только для 1С handshake, но и для визуальной приёмки: можно проверить, что preview screen рендерится тем же snapshot pipeline.

## 9. Как Это Помогает 1С-Специалисту

1С-специалисту не нужно понимать React component tree.

Граница остаётся простой:

- в реальном контуре работает `OneCInterfaceAdapter`;
- HTML гарантирует `window.BolarsSelfCheckout`;
- Web отдаёт typed commands;
- 1С возвращает authoritative snapshots;
- debug показывает adapter kind, queue, snapshot apply and correlation.

Preview mode при этом явно маркируется как `adapterKind=preview` и не отправляет команды в 1С.

## 10. First Slice Updates

Первый implementation slice теперь включает:

- `RuntimeAdapterFactory`;
- `MockAdapter`;
- `PreviewAdapter`;
- `OneCInterfaceAdapter` shell;
- preview route `/bolars/self-checkout-mvp?debug=1&preview=1`;
- preview panel/selector;
- preview scenarios for main screens/states;
- debug observer for adapter/preview state.

## 11. vNext

Остаётся за пределами первого среза:

- full production hardening of 1C/RMK rollout beyond first interface adapter handshake;
- real payment adapter hardening;
- KKT/fiscalization/OFD;
- Честный знак / marked product workflow;
- media delivery;
- production theme admin;
- production terminal deployment hardening.

## 12. Что Намеренно Не Делали

- Не писали frontend-код.
- Не меняли product scope.
- Не проектировали media delivery.
- Не проектировали Честный знак.
- Не проектировали KKT/fiscalization/OFD.
- Не проектировали real payment internals.
- Не делали production theme admin.
- Не возвращали старый showcase как source of truth.
- Не добавляли manual JSON import.
- Не создавали обходной UI path для preview.

## 13. Готовность

Пакет готов к implementation planning, если следующий агент начинает с:

1. RuntimePort types/state model.
2. RuntimeAdapterFactory.
3. MockAdapter.
4. PreviewAdapter.
5. OneCInterfaceAdapter shell.
6. Screens rendering snapshots.
7. Debug panel observing runtime/adapter state.

Такой порядок сохраняет scan-first product flow и не смешивает UI с mock, preview или 1С.
