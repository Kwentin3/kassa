# BOLARS Runtime Adapter Factory Contract

Статус: draft 0.1
Дата: 2026-05-23
Назначение: контракт выбора runtime adapter для `SelfCheckoutRuntimePort`.

## 1. Purpose

`RuntimeAdapterFactory` выбирает concrete implementation для `SelfCheckoutRuntimePort`.

Factory нужна, чтобы UI не знал, откуда пришёл runtime state: mock, preview или 1С.

## 2. Related Documents

- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/contracts/BOLARS_1C_JSON_EXCHANGE_CONTRACT.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`

## 3. Supported Adapters

- `MockAdapter`
- `PreviewAdapter`
- `OneCInterfaceAdapter`

All adapters implement the same `SelfCheckoutRuntimePort`.

## 4. Selection Inputs

Query params:

- `debug=1`
- `preview=1`
- `adapter=mock|preview|onec` only if explicitly allowed in dev/debug context
- `theme` / `themeProfile` for safe initial theme profile override; this does not select adapter

Environment:

- `development`
- `production-like`
- 1С shell context

Other inputs:

- feature flags;
- build config;
- detected `window.BolarsSelfCheckout` / shell capabilities;
- safe local developer settings.

## 5. Selection Rules

- `preview=1` requires `debug=1`.
- `preview=1` selects `PreviewAdapter`.
- `adapter=preview` is allowed only with `debug=1`.
- `adapter=mock` is allowed for local/dev or explicitly configured prototype mode.
- `adapter=onec` selects `OneCInterfaceAdapter` only in allowed environment.
- In the first implementation slice, `debug=1&runId=onec-*` may also select `OneCInterfaceAdapter` for the 1C specialist mini-smoke route.
- Default local/dev can use `MockAdapter`.
- Customer route without `debug=1` must not expose adapter switcher.
- No user/customer control over production adapter.
- Adapter choice must be visible in debug panel.
- If adapter selection is invalid, factory should fall back to a safe configured default and expose a debug warning.

Current implementation note:

- customer route defaults to `MockAdapter`;
- `debug=1&preview=1` has priority over other adapter hints;
- `debug=1&adapter=onec` selects `OneCInterfaceAdapter`;
- `debug=1&runId=onec-smoke-001` selects `OneCInterfaceAdapter` for documented smoke checks;
- `adapter=` on customer route is ignored and does not expose a customer switcher.

## 6. AdapterKind

Canonical values:

```ts
type AdapterKind = 'mock' | 'preview' | 'onec' | 'unknown';
```

`adapterKind` must appear in runtime/debug metadata. Preview snapshots must be marked as `adapterKind='preview'` or equivalent `previewMode=true` metadata.

## 7. Factory Output

The factory returns a `SelfCheckoutRuntimePort` implementation plus safe metadata:

```ts
interface RuntimeAdapterFactoryResult {
  runtime: SelfCheckoutRuntimePort;
  adapterKind: AdapterKind;
  previewMode: boolean;
  debugMode: boolean;
  warnings: string[];
}
```

Implementation can choose a different internal shape, but the same facts must be visible to debug.

## 8. Prohibitions

- UI components must not instantiate adapters directly.
- UI components must not import `OneCInterfaceAdapter`.
- UI components must not branch on adapter internals.
- Debug panel must not switch production adapter for customer.
- PreviewAdapter must not call 1С.
- MockAdapter must not become a separate UI path.
- Adapter Factory must not expose secrets through query params.
- Customer route must not allow arbitrary `adapter=` override.

## 9. Acceptance Criteria

- Factory selects `PreviewAdapter` only when `debug=1&preview=1`.
- Factory can select `MockAdapter` for local/dev prototype.
- Factory can select `OneCInterfaceAdapter` for allowed 1С shell context.
- Screens/components import only RuntimePort/types, not adapters.
- Debug shows selected adapter kind and selection warnings.
- Invalid adapter query does not crash customer flow.
- `debug=1&runId=onec-smoke-001` can be used for 1C mini-smoke without changing customer route behavior.
- `theme` / `themeProfile` may change initial `snapshot.themeProfile`, but must not create a separate UI path or adapter path.
