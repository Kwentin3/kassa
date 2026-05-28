# Test Matrix: KioskRunner MVP

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

This matrix defines MVP verification coverage for KioskRunner. Tests must not require real 1С business integration.

## 2. Matrix

| ID | Scenario | Expected result |
| --- | --- | --- |
| T01 | No `config.json` | Runner reports `no_config`; no update; health degraded; no crash. |
| T02 | Invalid config JSON | Runner reports `invalid_json`; no update. |
| T03 | Missing `registryUrl` | Runner reports `registry_url_missing`; no network update. |
| T04 | Manifest unavailable | Old current remains served; status/logs show manifest unavailable. |
| T05 | Invalid manifest JSON | Runner rejects manifest; current unchanged. |
| T06 | `registryUrl` returns HTML instead of manifest | Runner rejects shape; does not install HTML directly. |
| T07 | Wrong `showcaseId` | Runner rejects manifest; current unchanged. |
| T08 | Non-production status/channel | Runner blocks install. |
| T09 | `minRunnerVersion` too high | Runner blocks install and reports runner update required. |
| T10 | Bundle unavailable | Runner logs download error; current unchanged. |
| T11 | SHA-256 mismatch | Runner rejects bundle; current unchanged. |
| T12 | Broken zip | Runner rejects bundle; staging cleaned. |
| T13 | Missing root `index.html` | Runner rejects bundle; current unchanged. |
| T14 | Successful first install | `versions/<version>`, `current`, `state.json`, logs created; URL serves index. |
| T15 | No-op same version | Runner updates last check/status only; no reinstall. |
| T16 | Successful update | New version installed; previousVersion updated; URL serves new current. |
| T17 | Failed update keeps old current | Old URL remains functional after failure. |
| T18 | Rollback | Previous local version restored without network. |
| T19 | Port in use | Web server fails healthy check; logs show `port_in_use`. |
| T20 | Path traversal attempt | Request blocked with 400/403/404; no file leak. |
| T21 | Forbidden `/downloads` path | 403/404; no directory listing. |
| T22 | Forbidden `/versions` path | 403/404; no directory listing. |
| T23 | Forbidden `/logs` path | 403/404; no log content. |
| T24 | Forbidden `/state.json` path | 403/404; no state file. |
| T25 | Forbidden `/config.json` path | 403/404; no config file. |
| T26 | Cache behavior for `index.html` | `no-store` or short cache. |
| T27 | Cache behavior for fingerprinted asset | Long immutable cache if fingerprinted. |
| T28 | Status endpoint no secrets | Status has no tokens, 1С data, PII, fiscal/payment data. |
| T29 | Public/no-auth artifact access | Public runner/manifest/bundle can be downloaded; artifacts contain no secrets. |
| T30 | Runner without 1С | Static page may open; runner does not provide business backend. |

## 3. Evidence

Each test should record:

- command or URL;
- expected status;
- log event id;
- state/status snippet;
- proof current stayed unchanged where relevant.

## 4. Non-goals

Tests do not validate:

- real payment;
- real scanner;
- real ККТ/fiscalization;
- 1С business logic;
- HTML bridge semantics beyond stable URL and static serving.
