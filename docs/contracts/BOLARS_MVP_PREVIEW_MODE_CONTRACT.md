# BOLARS MVP Preview Mode Contract

Статус: draft 0.1
Дата: 2026-05-23
Назначение: контракт служебного preview mode для BOLARS Self-Checkout MVP.

## 1. Purpose

Preview Mode нужен для разработки, визуальной приёмки и отладки отдельных экранов/states без прохождения всего пользовательского flow.

Preview Mode не является customer flow, production admin или отдельной UI-архитектурой.

## 2. Route

Canonical preview route:

```text
/bolars/self-checkout-mvp?debug=1&preview=1
```

Full URL:

```text
https://kassa.speechbattle.com/bolars/self-checkout-mvp?debug=1&preview=1
```

Optional query params:

- `screen=start|cart|paymentSetup|paymentWaiting|paymentError|finalSuccess`
- `scenario=emptyCart|fullCart|searchFound|searchNotFound|quantityNumpad|paymentFailed|successCountdown`
- `textScale=normal|large|extraLarge`
- `theme=bolars-light-default|bolars-light-contrast|bolars-light-clean|bolars-light-promo`
- `themeProfile=bolars-light-default|bolars-light-contrast|bolars-light-clean|bolars-light-promo`

Rules:

- `preview=1` requires `debug=1`.
- Preview controls are hidden without `debug=1`.
- Preview route must not affect normal customer route behavior.
- Preview theme selector changes the route theme override; it must not bypass `PreviewAdapter` or directly render screens.

## 3. Architecture

Correct scheme:

```text
Preview control
  -> PreviewAdapter
  -> SelfCheckoutRuntimePort
  -> authoritative preview snapshot
  -> UI renders snapshot
```

Forbidden scheme:

```text
Preview button
  -> directly render PaymentError component bypassing RuntimePort
```

`PreviewAdapter` implements `SelfCheckoutRuntimePort` and returns deterministic snapshots for selected screen/scenario.

## 4. Required Scenarios

- start idle;
- cart empty;
- cart 1 item;
- cart many items;
- cart with manager;
- search below min length;
- search found;
- search not found;
- quantity numpad open;
- cancel confirmation;
- payment setup with packages;
- discount applied;
- discount not found;
- payment waiting;
- payment error;
- final success countdown;
- inactivity timeout warning;
- text scale `normal`;
- text scale `large`;
- text scale `extraLarge`;
- theme loaded;
- theme default profile;
- theme error if supported by current snapshot.

## 5. Preview Controls

Allowed controls:

- screen selector;
- scenario selector;
- text scale selector;
- theme profile selector if safe;
- reset preview;
- next/previous scenario optional.

Preview controls dispatch preview-safe commands or scenario selection intents to `PreviewAdapter`.

Theme profile selection is URL-driven for acceptance/debug convenience. The active profile still enters UI as `snapshot.themeProfile`, and UI applies semantic CSS tokens from that snapshot.

## 6. Snapshot Markers

Preview snapshots must be identifiable.

Recommended metadata:

```json
{
  "adapterKind": "preview",
  "previewMode": true,
  "previewScenarioId": "paymentFailed",
  "snapshotVersion": 101
}
```

If these fields are not placed at root snapshot level, equivalent metadata must be available through runtime/debug state.

## 7. Prohibitions

- No direct screen rendering bypass.
- No direct component mounting from preview controls.
- No commands to `OneCInterfaceAdapter`.
- No outbound queue writes to 1С.
- No real payment.
- No KKT/fiscalization.
- No Честный знак.
- No manual JSON import.
- No textarea paste.
- No file upload.
- No production admin behavior.
- No cart/totals business logic in UI.

## 8. Debug Integration

Debug must show:

- `adapterKind=preview`;
- `previewMode=true`;
- selected preview screen;
- selected preview scenario;
- preview snapshot version;
- outbound commands mode: `disabled` or `local`;
- warning: `Preview mode does not call 1С and does not perform business operations.`

## 9. Acceptance Criteria

- `debug=1&preview=1` opens preview controls.
- `preview=1` without `debug=1` is rejected or ignored safely.
- Each preview scenario renders through `SelfCheckoutRuntimePort`.
- UI renders preview snapshots through the normal screen pipeline.
- Preview does not enqueue commands to `OneCInterfaceAdapter`.
- Preview does not call 1С.
- Preview scenario appears in debug state.
- Visual screenshots can be produced from preview scenarios.
- Preview does not change customer route behavior.
