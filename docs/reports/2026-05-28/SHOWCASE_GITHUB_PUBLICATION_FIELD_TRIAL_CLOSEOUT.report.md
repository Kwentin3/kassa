# Showcase GitHub Publication Field Trial Closeout

Date: 2026-05-28

Status: READY_WITH_PENDING_REMOTE_PUBLICATION

## Scope

Implemented and verified the product GitHub/static publication path for the BOLARS showcase delivery contour without 1C:

```text
GitHub Actions / static hosting
-> production manifest.json
-> immutable bundle.zip
-> KioskRunner config.registryUrl
-> KioskRunner update-once
-> KioskRunner service
-> http://127.0.0.1:8787/kiosk/bolars/
```

1C, HTML <-> 1C bridge, cart, payment, KKT, marking, fiscalization, scanner and business sale state were not involved.

## Source Documents Used

- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_SHOWCASE_RELEASE_PIPELINE_MVP.md`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_RELEASE_PIPELINE_FIELD_TRIAL.md`
- `docs/reports/2026-05-28/SHOWCASE_RELEASE_PIPELINE_MVP_CLOSEOUT.report.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_BUNDLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`
- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_FINAL_RC_AUDIT.report.md`

## Files Created Or Changed

- Created `.github/workflows/publish-bolars-showcase.yml`.
- Created `scripts/smoke-showcase-release-pipeline.ps1`.
- Created `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`.
- Created `docs/reports/2026-05-28/SHOWCASE_GITHUB_RELEASE_PIPELINE_PREFLIGHT.report.md`.
- Created `docs/reports/2026-05-28/SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL_CLOSEOUT.report.md`.

No KioskRunner source code was changed.

No 1C bridge contract was changed.

No update-server, fleet dashboard, telemetry, auth/private registry, signatures or tenant/license binding was added.

## Workflow

Created workflow:

```text
.github/workflows/publish-bolars-showcase.yml
```

Trigger:

```text
workflow_dispatch
```

Inputs:

- `version`: required immutable showcase version.
- `channel`: default `production`.
- `status`: default `production`.
- `base_url`: optional; defaults to `https://<owner>.github.io/<repo>`.
- `rollback_version`: optional.

The workflow:

1. checks out the repo;
2. sets up Node.js;
3. runs `npm ci`;
4. calls existing `scripts/publish-showcase-bundle.ps1`;
5. verifies generated release artifacts;
6. prepares GitHub Pages static layout;
7. uploads traceability artifact;
8. deploys Pages artifact with GitHub Pages Actions.

The workflow uses the existing publish script and does not duplicate bundle generation logic.

## Publication Mode

Selected MVP publication mode:

```text
GitHub Pages via GitHub Actions custom workflow.
```

Reason:

- static HTTPS publication;
- no central update-server;
- no auth/private registry for MVP;
- no download telemetry;
- compatible with KioskRunner `registryUrl -> production manifest`.

GitHub Pages cache note:

- `production/manifest.json` should ideally be no-cache or short TTL;
- GitHub Pages does not provide fine-grained per-file cache headers in this MVP;
- field trial must account for possible manifest cache delay;
- `versions/<version>/bundle.zip` is immutable and may be cached longer.

## Publication Layout

Implemented static layout:

```text
showcases/bolars/production/manifest.json
showcases/bolars/versions/<version>/bundle.zip
showcases/bolars/versions/<version>/manifest.json
showcases/bolars/versions/<version>/sha256.txt
```

Registry URL pattern:

```text
https://<static-host>/showcases/bolars/production/manifest.json
```

Bundle URL pattern:

```text
https://<static-host>/showcases/bolars/versions/<version>/bundle.zip
```

KioskRunner does not read source repo, branch, `main`, `dist`, or build output paths.

## Local CI Simulation

Command:

```powershell
.\scripts\smoke-showcase-release-pipeline.ps1 `
  -Version 2026.05.28.github-smoke `
  -Channel production `
  -Status production `
  -BaseUrl http://127.0.0.1:51410 `
  -PublicationRoot artifacts/github-pages-showcase-publication
```

Result: passed.

Generated local publication:

```text
artifacts/github-pages-showcase-publication/showcases/bolars/production/manifest.json
artifacts/github-pages-showcase-publication/showcases/bolars/versions/2026.05.28.github-smoke/bundle.zip
artifacts/github-pages-showcase-publication/showcases/bolars/versions/2026.05.28.github-smoke/manifest.json
artifacts/github-pages-showcase-publication/showcases/bolars/versions/2026.05.28.github-smoke/sha256.txt
```

Bundle:

```text
artifacts/showcases/bolars/2026.05.28.github-smoke/bundle.zip
```

SHA-256:

```text
44062d30cef7cf32e832a740344c97b757f85c3073f0ba995af9446fd6934f3c
```

Production manifest:

```text
artifacts/github-pages-showcase-publication/showcases/bolars/production/manifest.json
```

Local simulated registry URL:

```text
http://127.0.0.1:51410/showcases/bolars/production/manifest.json
```

Local simulated bundle URL:

```text
http://127.0.0.1:51410/showcases/bolars/versions/2026.05.28.github-smoke/bundle.zip
```

## Static Publication Artifact Check

Publication mode used for smoke:

```text
temporary local static HTTP server over artifacts/github-pages-showcase-publication
```

This was used only to simulate dumb static hosting. It is not a product update-server.

Result:

- `production/manifest.json`: accessible over HTTP.
- `bundleUrl`: accessible over HTTP.
- downloaded bundle SHA-256 matches manifest.
- manifest has `showcaseId=bolars`, `channel=production`, `status=production`.
- manifest does not point to branch/main/dist/source repo.

Windows PowerShell 5.1 decoded the UTF-8 BOM as `ï»¿` during local `ConvertFrom-Json`; the test harness handled this by explicit UTF-8 decode. KioskRunner accepted the manifest successfully.

## KioskRunner E2E Smoke

KioskRunner artifact:

```text
artifacts/kiosk-runner/KioskRunner-win-x64.zip
```

Clean runner folder:

```text
artifacts/showcase-github-publication-smoke/runner
```

Config registry URL:

```text
http://127.0.0.1:51410/showcases/bolars/production/manifest.json
```

Commands:

```powershell
.\KioskRunner.exe update-once --config .\config.json
.\KioskRunner.exe status --config .\config.json
.\KioskRunner.exe service --config .\config.json
```

`update-once` result:

```text
Update status: updated; version: 2026.05.28.github-smoke
```

Final no-op after negative checks:

```text
Update status: noop; version: 2026.05.28.github-smoke
```

Status result:

```text
health = ok
currentVersion = 2026.05.28.github-smoke
servedVersion = 2026.05.28.github-smoke
lastUpdateStatus = noop
lastError = null
```

Local URL smoke:

```text
http://127.0.0.1:8787/kiosk/bolars/ -> 200
http://127.0.0.1:8787/healthz -> 200, {"health":"ok"}
http://127.0.0.1:8787/runner/status -> 200
X-Kiosk-Showcase-Version = 2026.05.28.github-smoke
```

## Negative Checks

Wrong SHA-256:

- test changed production manifest to a new version with invalid sha256;
- KioskRunner returned `sha256_mismatch`;
- exit code was non-zero;
- `currentVersion` remained `2026.05.28.github-smoke`.

Candidate / non-production manifest:

- test changed production manifest payload to `channel=candidate`, `status=candidate`;
- KioskRunner returned `manifest_channel_mismatch` and `manifest_status_not_production`;
- exit code was non-zero;
- `currentVersion` remained `2026.05.28.github-smoke`.

Missing root `index.html`:

- temporary showcase descriptor generated output without `index.html`;
- `scripts/publish-showcase-bundle.ps1` failed with `Required file is missing from outputDir: index.html`;
- no valid production bundle was created.

Forbidden `.env`:

- temporary showcase descriptor generated `index.html` plus `.env`;
- `scripts/publish-showcase-bundle.ps1` failed with `Forbidden file '.env' matched pattern '.env'`;
- `.env` did not enter a valid bundle.

Branch/main/dist URL:

- local dry-run was executed with `BaseUrl=https://example.com/main/dist`;
- `scripts/smoke-showcase-release-pipeline.ps1` failed with `bundleUrl must not reference branch/main/dist/source repo`;
- this prevents treating source/build paths as product registry URLs.

## Commands Run

```powershell
.\scripts\publish-showcase-bundle.ps1 -Showcase bolars -Version 2026.05.28.github-preflight -Channel production -Status production -BaseUrl https://example.github.io/kassa
.\scripts\smoke-showcase-release-pipeline.ps1 -Version 2026.05.28.github-smoke -Channel production -Status production -BaseUrl http://127.0.0.1:51410 -PublicationRoot artifacts/github-pages-showcase-publication
python -m http.server 51410 --bind 127.0.0.1 --directory artifacts/github-pages-showcase-publication
.\KioskRunner.exe update-once --config .\config.json
.\KioskRunner.exe status --config .\config.json
.\KioskRunner.exe service --config .\config.json
Invoke-WebRequest http://127.0.0.1:8787/kiosk/bolars/
Invoke-WebRequest http://127.0.0.1:8787/healthz
Invoke-WebRequest http://127.0.0.1:8787/runner/status
git diff --check
```

`git diff --check` result:

```text
passed, with existing line-ending warning for package.json
```

## Pending Remote Steps

The actual GitHub Actions / GitHub Pages deployment was not executed from this local workspace.

Pending maintainer action:

1. enable GitHub Pages source as GitHub Actions if not already enabled;
2. run `Publish BOLARS Showcase` workflow manually;
3. record the deployed Pages URL;
4. verify real HTTPS `production/manifest.json`;
5. repeat KioskRunner smoke with real `registryUrl`.

Until this is done, status remains:

```text
READY_WITH_PENDING_REMOTE_PUBLICATION
```

## Blockers

No local implementation blockers.

Remote publication remains pending only because this workspace cannot execute GitHub Actions / GitHub Pages deployment.

## Release Recommendation

Use the new workflow and runbook for the first GitHub/static field trial.

Do not connect 1C yet. The next validation step is a maintainer-run remote GitHub Pages workflow followed by the same KioskRunner E2E smoke against the real HTTPS `registryUrl`.
