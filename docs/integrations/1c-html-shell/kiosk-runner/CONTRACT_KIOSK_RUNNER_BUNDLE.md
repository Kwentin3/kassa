# Contract: KioskRunner Bundle

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

`bundle.zip` is the immutable static HTML showcase artifact installed by KioskRunner.

Bundle is a UI shell only. It must not contain 1С business data, secrets, payment data, fiscal data or customer personal data.

## 2. Zip Structure

Minimum expected structure after extraction:

```text
index.html
assets\
  *.js
  *.css
  *.png
  *.svg
  *.webp
  *.woff2
```

Single-file HTML artifact is also acceptable if `index.html` is self-contained and compatible with the target 1С runtime profile.

## 3. Required Files

| Path | Rule |
| --- | --- |
| `index.html` | Required in bundle root. Must be non-empty and valid enough for static serving. |
| `assets/` or equivalent | Required unless `index.html` is intentionally self-contained. |

## 4. Forbidden Content

Bundle must not contain:

- `.env`, `.env.deploy`, `.env.local`;
- private keys, certificates, tokens, passwords;
- `config.json` for KioskRunner;
- `state.json`, runner logs or update metadata;
- internal 1С object references;
- real customer catalog/business data;
- carts, payments, receipt/fiscal data;
- manual JSON upload/import fixtures intended for production use;
- executable installers or arbitrary update scripts.

## 5. Bridge Compatibility

Bundle must declare or be published with `bridgeContractVersion` in manifest. KioskRunner only checks compatibility. It does not implement the HTML ↔ 1С bridge.

For BOLARS, the HTML runtime must keep using `window.BolarsSelfCheckout` and the existing bridge contracts. Runner must not expose business endpoints to replace that bridge.

## 6. Static Serving Requirements

Bundle must open through:

```text
http://127.0.0.1:8787/kiosk/{showcaseId}/
```

Bundle should use relative or basePath-compatible asset references. It must not require access to `downloads`, `versions`, `logs`, `state.json` or `config.json`.

## 7. V8WebKit / Runtime Safety

For 1С HTML artifact compatibility:

- avoid mandatory `fetch` if target profile does not support it;
- avoid mandatory `type=module` unless separately validated;
- avoid unsupported syntax such as `?.` / `??` in 1С-safe artifact;
- avoid CDN and external runtime dependencies;
- prefer classic bundled script for 1С-safe artifact;
- verify split-assets delivery in the target 1С environment if used.

## 8. Validation Before Switch

KioskRunner must validate bundle before switching `current`:

1. zip can be opened;
2. extraction stays inside staging directory;
3. `index.html` exists in root;
4. `index.html` is non-empty;
5. forbidden files are absent;
6. required asset structure exists or artifact is explicitly self-contained;
7. bundle version target folder does not conflict with invalid partial version.

If validation fails, current working version remains unchanged.
