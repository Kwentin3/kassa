# Blueprint: KioskRunner Update Lifecycle

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Scope

This blueprint describes `KioskRunner.exe update-once` and the periodic service update loop.

It does not implement runner code and does not change HTML ↔ 1С bridge contracts.

## 2. Lifecycle

```text
load config
  -> validate config
  -> init storage
  -> load state
  -> fetch manifest
  -> validate manifest
  -> compare versions
  -> download bundle
  -> verify sha256
  -> extract to staging
  -> validate bundle
  -> publish version
  -> switch current
  -> update state
  -> write logs
  -> cleanup
```

## 3. Config Read

Runner reads local `config.json`. It must not auto-use `config.example.json` as production config.

Terminal errors:

- `no_config`;
- `invalid_json`;
- `registry_url_missing`;
- unsafe `webServer` config;
- unsafe `rootDir`.

## 4. Manifest Load And Validation

Runner downloads only `registryUrl`.

Reject:

- response is HTML;
- invalid JSON;
- missing required fields;
- wrong `showcaseId`;
- non-production channel/status;
- `minRunnerVersion` too high;
- incompatible `bridgeContractVersion`;
- invalid `bundleUrl`;
- invalid `sha256`.

## 5. Version Compare

MVP rule:

- if `manifest.version == state.currentVersion`, result is `noop`;
- otherwise treat manifest as candidate update if validation passed.

Version ordering can be lexical/semantic only after a canon decision. MVP can avoid complex ordering by installing only when version differs and manifest is production-approved.

## 6. Bundle Download

Download to `downloads/<version>/<file>` or equivalent temp location under `rootDir`.

Do not download to `current`. Do not execute downloaded content. Do not follow arbitrary branch/source discovery.

## 7. SHA-256 Check

Compute hash of downloaded zip and compare to manifest `sha256`.

Mismatch:

- mark download invalid;
- do not extract to publish location;
- do not switch `current`;
- log `sha256_mismatch`.

## 8. Staging

Extract to staging folder under `rootDir`, for example:

```text
_staging\<version>-<operationId>\
```

Extraction must protect against zip-slip/path traversal and must not write outside staging.

## 9. Bundle Validation

Before publishing:

- `index.html` exists in extracted root;
- `index.html` is non-empty;
- forbidden files absent;
- assets or self-contained HTML present;
- optional served-version marker exists if release pipeline provides one.

## 10. Publish And Switch Current

Publish extracted staging to:

```text
versions\<version>\
```

Then switch `current`.

Open implementation decision: safest Windows switch mechanism:

1. junction/symlink pointer to version directory;
2. directory replace/rename;
3. copy-to-current with backup.

MVP acceptance: failed switch keeps or restores previous working `current`.

## 11. State Update

On success:

- `previousVersion = old currentVersion`;
- `currentVersion = manifest.version`;
- `currentSha256 = manifest.sha256`;
- `lastUpdateStatus = updated`;
- `lastSuccessfulUpdateAt = now`;
- `lastError = null`.

On no-op:

- update `lastCheckAt`;
- `lastUpdateStatus = noop`;
- do not rewrite current.

On failure:

- do not switch current;
- write sanitized `lastError`;
- `lastUpdateStatus = failed` or `blocked`.

## 12. Logging

Recommended format: JSON Lines.

Events:

- `update.started`;
- `manifest.fetched`;
- `manifest.rejected`;
- `bundle.downloaded`;
- `bundle.hash_failed`;
- `bundle.validated`;
- `current.switch_started`;
- `current.switch_completed`;
- `update.noop`;
- `update.failed`;
- `update.completed`.

## 13. Cleanup And Retention

Cleanup applies to:

- old staging folders;
- invalid downloads;
- old versions beyond `keepVersions`.

Never delete:

- current version;
- previous version;
- version being served;
- staging currently active.

## 14. Idempotency

Repeated `update-once` with same manifest must be safe and produce `noop` after successful install.

Partial previous attempts must be detected by staging markers or state mismatch and cleaned without harming current.

## 15. Force Reinstall

Force reinstall is future/optional. It must be explicit and logged. It must not bypass manifest validation or `sha256`.

## 16. Partial Update Recovery

If service stops during update:

- current remains old or is recovered;
- staging is cleaned on next start;
- state is checked against actual current;
- health/status reports degraded if consistency cannot be proven.
