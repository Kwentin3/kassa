# Showcase Release Pipeline MVP Closeout

Date: 2026-05-28

Status: PASSED

## Scope

Refine, implement and verify a minimal Showcase Release Pipeline MVP for KioskRunner field trial.

The work stayed inside the field-trial MVP boundary:

- no update-server;
- no fleet dashboard;
- no download telemetry;
- no auth/private registry;
- no signatures;
- no tenant/license binding;
- no KioskRunner code changes;
- no 1С bridge changes.

## Files changed or created

Created:

- `showcases/bolars/showcase.config.json`
- `scripts/prepare-1c-bolars-dist.mjs`
- `scripts/publish-showcase-bundle.ps1`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_RELEASE_PIPELINE_FIELD_TRIAL.md`
- `docs/reports/2026-05-28/SHOWCASE_RELEASE_PIPELINE_MVP_CLOSEOUT.report.md`

Updated:

- `package.json`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_SHOWCASE_RELEASE_PIPELINE_MVP.md`

Generated artifacts:

- `artifacts/showcases/bolars/2026.05.28.fieldtrial/bundle.zip`
- `artifacts/showcases/bolars/2026.05.28.fieldtrial/manifest.json`
- `artifacts/showcases/bolars/2026.05.28.fieldtrial/sha256.txt`
- `artifacts/showcases/bolars/production/manifest.json`
- `artifacts/showcase-release-pipeline-smoke/`

## Blueprint refinements

Applied targeted changes to `BLUEPRINT_SHOWCASE_RELEASE_PIPELINE_MVP.md`:

- clarified that `KioskRunner.exe update-once` installs `current` and exits;
- clarified that localhost serving requires `KioskRunner.exe service --config config.json` or Windows Service start;
- clarified that `bundle.zip` must contain `index.html` in archive root;
- clarified that the script archives contents of `outputDir`, not the `outputDir` directory itself;
- added production manifest cache note: `production/manifest.json` should use `no-cache` or short TTL where possible;
- clarified field-trial publication mode: existing public static deployment host if ops approves, otherwise GitHub Pages-style dumb static hosting;
- preserved anti-combiner MVP scope.

## Build command

Descriptor:

```text
showcases/bolars/showcase.config.json
```

Build command used:

```text
npm run build:1c:bolars
```

This command reuses the existing 1C HTML build and then prepares:

```text
dist-1c/bolars/index.html
```

No backend, real 1С, payment, KKT, fiscalization, scanner or secrets are required for this build.

## Bundle output

Bundle path:

```text
artifacts/showcases/bolars/2026.05.28.fieldtrial/bundle.zip
```

ZIP structure verified:

```text
index.html
```

`index.html` is in the archive root. The archive does not contain a nested `bolars/` or `dist-1c/` folder.

Forbidden file validation is implemented for:

- `.env`
- `.env.local`
- `.env.deploy`
- `*.pem`
- `*.pfx`
- `*.key`
- `config.json`
- `state.json`

## SHA-256

Generated SHA-256:

```text
d33bf1d2a6e07e353b349705e9e7e6ae5ba5f6e75b99782f9c911c9881f8cf7a
```

Verification:

- `sha256.txt` created;
- SHA-256 in `sha256.txt` matches `bundle.zip`;
- SHA-256 in `manifest.json` matches `bundle.zip`.

## Manifest

Manifest path:

```text
artifacts/showcases/bolars/2026.05.28.fieldtrial/manifest.json
```

Production manifest path:

```text
artifacts/showcases/bolars/production/manifest.json
```

Manifest values verified:

- `showcaseId`: `bolars`
- `channel`: `production`
- `status`: `production`
- `version`: `2026.05.28.fieldtrial`
- `minRunnerVersion`: `0.3.0`
- `bridgeContractVersion`: `bolars-web-1c-v0.1`
- `buildCommit`: `0258b8403ef4375e7972bd457919d9d739b85abd`
- `bundleUrl` does not reference branch, `main`, `dist`, source repo, or GitHub raw branch.

Manifest `bundleUrl` used for smoke:

```text
http://127.0.0.1:51400/showcases/bolars/versions/2026.05.28.fieldtrial/bundle.zip
```

## Publication mode used for smoke

Smoke used a temporary local static HTTP server:

```text
python -m http.server 51400 --bind 127.0.0.1 --directory artifacts/showcase-release-pipeline-smoke/public
```

This was only a verification static file server, not a product update-server.

Registry URL used by KioskRunner:

```text
http://127.0.0.1:51400/showcases/bolars/production/manifest.json
```

## KioskRunner smoke

KioskRunner artifact used:

```text
artifacts/kiosk-runner/KioskRunner-win-x64.zip
```

Smoke flow:

1. Extracted runner to `artifacts/showcase-release-pipeline-smoke/runner`.
2. Copied `config.example.json` to `config.json`.
3. Set `registryUrl` to the local production manifest.
4. Ran:

```powershell
KioskRunner.exe update-once --config config.json
KioskRunner.exe status --config config.json
```

Results:

- `update-once` accepted manifest and installed bundle.
- `status` reported installed version `2026.05.28.fieldtrial`.
- `current/index.html` was created under runner root.

Serving flow:

```powershell
KioskRunner.exe service --config config.json
```

Verified URLs:

```text
http://127.0.0.1:8787/kiosk/bolars/
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Results:

- localhost showcase URL opened after service start;
- `/healthz` responded with HTTP 200;
- `/runner/status` responded with installed/served version.

## Negative smoke

Wrong SHA-256:

- Modified production manifest in temporary smoke registry to version `2026.05.28.badsha`.
- Replaced `sha256` with invalid hash.
- Ran `KioskRunner.exe update-once --config config.json`.
- Result: KioskRunner blocked update and kept old `current`.

Missing root `index.html`:

- Used a temporary negative showcase descriptor and output directory without `index.html`.
- Ran `scripts/publish-showcase-bundle.ps1`.
- Result: publish script failed before creating a valid production bundle.

Forbidden file:

- Used a temporary negative output directory with root `index.html` and `.env`.
- Ran `scripts/publish-showcase-bundle.ps1`.
- Result: publish script failed with forbidden file validation.

## Commands run

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish-showcase-bundle.ps1 -Showcase bolars -Version 2026.05.28.fieldtrial -Channel production -Status production -BaseUrl http://127.0.0.1:51400`
- ZIP root inspection via `[System.IO.Compression.ZipFile]::OpenRead(...)`
- SHA-256 verification via `Get-FileHash -Algorithm SHA256`
- Local static HTTP server for smoke
- `KioskRunner.exe update-once --config config.json`
- `KioskRunner.exe status --config config.json`
- `KioskRunner.exe service --config config.json`
- HTTP checks for canonical URL, `/healthz`, and `/runner/status`
- Negative publish smoke for missing `index.html`
- Negative publish smoke for forbidden `.env`

## Manual or future work

Manual before real field trial:

- choose actual static publication host;
- upload/copy `bundle.zip` to immutable versioned path;
- upload/copy `production/manifest.json` to stable production path;
- confirm cache policy for `production/manifest.json`;
- update field-trial KioskRunner `registryUrl` to the real public manifest URL;
- hand stable localhost URL to 1С implementer after runner is installed on the target machine.

Future only:

- update-server;
- fleet dashboard;
- download telemetry;
- auth/private registry;
- signed manifest/bundle;
- tenant/license binding;
- automated promotion workflow.

## Acceptance criteria

- Blueprint refined: passed.
- `showcases/bolars/showcase.config.json` created: passed.
- `scripts/publish-showcase-bundle.ps1` created: passed.
- `bundle.zip` created: passed.
- `index.html` in zip root: passed.
- Forbidden files block publish: passed.
- SHA-256 calculated: passed.
- `manifest.json` created: passed.
- Production manifest created: passed.
- KioskRunner accepts manifest: passed.
- KioskRunner downloads bundle: passed.
- KioskRunner publishes `current`: passed.
- After service start localhost URL opens showcase: passed.
- `/healthz` and `/runner/status` respond: passed.
- Wrong SHA-256 blocks update: passed.
- Missing `index.html` blocks bundle: passed.
- No update-server/fleet/auth/telemetry added: passed.
