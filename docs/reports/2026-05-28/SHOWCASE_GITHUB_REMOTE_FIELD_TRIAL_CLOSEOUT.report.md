# Showcase GitHub Remote Field Trial Closeout

Date: 2026-05-28

Status: READY_FOR_BROWSER_FIELD_TRIAL

## Scope

Executed the real remote GitHub Pages field trial for the BOLARS showcase delivery/runtime contour without 1C.

Verified flow:

```text
GitHub Actions
-> GitHub Pages / static HTTPS publication
-> production manifest.json
-> immutable bundle.zip
-> KioskRunner registryUrl
-> KioskRunner update-once
-> KioskRunner service
-> http://127.0.0.1:8787/kiosk/bolars/
```

1C, HTML <-> 1C bridge, cart, payment, KKT, fiscalization, marking, scanner and business sale state were not involved.

## Source Documents Used

- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`
- `docs/reports/2026-05-28/SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL_CLOSEOUT.report.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_SHOWCASE_RELEASE_PIPELINE_MVP.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_FINAL_RC_AUDIT.report.md`

## Remote Preflight

Repository:

```text
https://github.com/Kwentin3/kassa
```

Default branch:

```text
mvp/self-checkout-web-ui
```

Preflight findings:

- `.github/workflows/publish-bolars-showcase.yml` existed locally and was committed/pushed before remote run.
- Workflow uses `scripts/publish-showcase-bundle.ps1`.
- Workflow does not duplicate bundle creation logic.
- Workflow prepares the expected static layout:
  - `showcases/bolars/production/manifest.json`
  - `showcases/bolars/versions/<version>/bundle.zip`
  - `showcases/bolars/versions/<version>/manifest.json`
  - `showcases/bolars/versions/<version>/sha256.txt`
- Workflow does not add update-server, fleet dashboard, telemetry, auth/private registry, signatures or tenant/license binding.
- GitHub Actions is enabled.
- GitHub Pages was not enabled before this run.

GitHub Pages was enabled through GitHub Pages API with `build_type=workflow`.

GitHub Pages URL:

```text
https://kwentin3.github.io/kassa/
```

## Pipeline Commit

Pipeline commit pushed to default branch:

```text
f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
```

Commit:

```text
Add BOLARS showcase GitHub publication pipeline
```

Files included in the pushed pipeline commit:

- `.github/workflows/publish-bolars-showcase.yml`
- `package.json`
- `scripts/prepare-1c-bolars-dist.mjs`
- `scripts/publish-showcase-bundle.ps1`
- `scripts/smoke-showcase-release-pipeline.ps1`
- `showcases/bolars/showcase.config.json`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md`

No KioskRunner source code was changed for this field trial.

## Encoding / BOM Check

Before remote workflow execution, `scripts/publish-showcase-bundle.ps1` was updated to write:

- `manifest.json` as UTF-8 without BOM;
- `sha256.txt` as UTF-8/ASCII without BOM.

Local encoding smoke:

```text
version = 2026.05.28.encoding-check
manifestHasBom = false
shaHasBom = false
PowerShell 5.1 ConvertFrom-Json = passed
sha256 length = 64
sha256 matches manifest = true
```

Remote manifest encoding:

```text
manifestHasBom = false
Content-Type = application/json; charset=utf-8
```

KioskRunner accepted the remote manifest after the encoding change.

## Workflow Run

Workflow:

```text
Publish BOLARS Showcase
```

Workflow file:

```text
.github/workflows/publish-bolars-showcase.yml
```

Run URL:

```text
https://github.com/Kwentin3/kassa/actions/runs/26572942908
```

Run ID:

```text
26572942908
```

Inputs:

```text
version = 2026.05.28.github-fieldtrial-1
channel = production
status = production
base_url = empty
rollback_version = empty
```

Resolved base URL:

```text
https://Kwentin3.github.io/kassa
```

Workflow result:

```text
conclusion = success
status = completed
headSha = f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
```

Workflow stages:

- checkout: passed;
- setup Node.js: passed;
- `npm ci`: passed;
- `scripts/publish-showcase-bundle.ps1`: passed;
- `bundle.zip`: created;
- `manifest.json`: created;
- `sha256.txt`: created;
- Pages artifact: created;
- Pages deploy: passed.

Workflow note:

- GitHub Actions emitted a non-blocking Node.js 20 deprecation annotation for several GitHub-maintained actions. This did not fail the run.

## Published Remote Artifact

Version:

```text
2026.05.28.github-fieldtrial-1
```

Production registry URL:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

Bundle URL from manifest:

```text
https://Kwentin3.github.io/kassa/showcases/bolars/versions/2026.05.28.github-fieldtrial-1/bundle.zip
```

SHA-256:

```text
fb38482866ad9a5cfc7db16bfc578803d0156fdc13ee57c683016e52051f65f5
```

Manifest verification:

```text
HTTP status = 200
Content-Type = application/json; charset=utf-8
Cache-Control = max-age=600
showcaseId = bolars
channel = production
status = production
version = 2026.05.28.github-fieldtrial-1
bridgeContractVersion = bolars-web-1c-v0.1
minRunnerVersion = 0.3.0
buildCommit = f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
bundleUrl contains branch/main/dist/source repo = false
```

Bundle verification:

```text
downloaded bundle sha256 = fb38482866ad9a5cfc7db16bfc578803d0156fdc13ee57c683016e52051f65f5
sha256 matches manifest = true
root index.html = present
forbidden .env/config/state/key/cert files = absent
```

Manifest did not return an HTML error page.

## KioskRunner Remote Registry Smoke

KioskRunner artifact:

```text
artifacts/kiosk-runner/KioskRunner-win-x64.zip
```

Clean runner folder:

```text
artifacts/showcase-github-remote-fieldtrial/runner
```

KioskRunner config:

```text
registryUrl = https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
listenHost = 127.0.0.1
port = 8787
basePath = /kiosk/bolars/
```

Command:

```powershell
.\KioskRunner.exe update-once --config .\config.json
```

Result:

```text
Update status: updated; version: 2026.05.28.github-fieldtrial-1
exitCode = 0
```

Status:

```text
health = ok
runnerVersion = 0.3.0
currentVersion = 2026.05.28.github-fieldtrial-1
servedVersion = 2026.05.28.github-fieldtrial-1
lastUpdateStatus = updated
lastError = null
```

KioskRunner downloaded bundle from the real HTTPS `bundleUrl`, verified SHA-256 and published `current`.

## KioskRunner Service Smoke

Command:

```powershell
.\KioskRunner.exe service --config .\config.json
```

Localhost checks:

```text
http://127.0.0.1:8787/kiosk/bolars/ -> 200
http://127.0.0.1:8787/healthz -> 200, {"health":"ok"}
http://127.0.0.1:8787/runner/status -> 200
```

Final status after negative checks and restore:

```text
currentVersion = 2026.05.28.github-fieldtrial-1
servedVersion = 2026.05.28.github-fieldtrial-1
X-Kiosk-Showcase-Version = 2026.05.28.github-fieldtrial-1
index length = 339303 bytes
```

## Negative Checks

Negative checks were performed against local temporary manifests/descriptors and did not modify the production GitHub Pages publication.

Wrong SHA-256:

```text
blocked = true
exitCode = 1
currentVersion = 2026.05.28.github-fieldtrial-1
keptOldCurrent = true
```

Candidate / non-production manifest:

```text
blocked = true
exitCode = 1
currentVersion = 2026.05.28.github-fieldtrial-1
keptOldCurrent = true
```

Missing root `index.html`:

```text
blocked by publish script = true
exitCode = 1
```

Forbidden `.env`:

```text
blocked by publish script = true
exitCode = 1
```

Branch/main/dist URL:

```text
blocked by smoke script = true
exitCode = 1
```

Restore after negative checks:

```text
remote registry update-once = noop
currentVersion = 2026.05.28.github-fieldtrial-1
lastUpdateStatus = noop
lastError = null
```

## Cache Observations

GitHub Pages returned:

```text
Cache-Control = max-age=600
```

This is acceptable for field trial, but operators should account for up to short-term manifest cache delay when promoting another production version.

Versioned bundle URLs remain immutable.

## Commands Run

```powershell
gh auth status
gh api repos/Kwentin3/kassa/pages
gh api -X POST repos/Kwentin3/kassa/pages -f build_type=workflow
git add -- .github/workflows/publish-bolars-showcase.yml package.json scripts/prepare-1c-bolars-dist.mjs scripts/publish-showcase-bundle.ps1 scripts/smoke-showcase-release-pipeline.ps1 showcases/bolars/showcase.config.json docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md
git commit -m "Add BOLARS showcase GitHub publication pipeline"
git push origin mvp/self-checkout-web-ui
gh workflow run "Publish BOLARS Showcase" --repo Kwentin3/kassa --ref mvp/self-checkout-web-ui -f version=2026.05.28.github-fieldtrial-1 -f channel=production -f status=production -f base_url= -f rollback_version=
gh run watch 26572942908 --repo Kwentin3/kassa --exit-status
Invoke-WebRequest https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
Invoke-WebRequest <bundleUrl>
.\KioskRunner.exe update-once --config .\config.json
.\KioskRunner.exe status --config .\config.json
.\KioskRunner.exe service --config .\config.json
Invoke-WebRequest http://127.0.0.1:8787/kiosk/bolars/
Invoke-WebRequest http://127.0.0.1:8787/healthz
Invoke-WebRequest http://127.0.0.1:8787/runner/status
```

## Non-Negotiable Invariants

Confirmed:

- no 1C dependency;
- no HTML <-> 1C bridge change;
- no KioskRunner source change;
- no update-server;
- no fleet dashboard;
- no telemetry;
- no auth/private registry;
- no signatures;
- no tenant/license binding;
- KioskRunner reads only `registryUrl`;
- `registryUrl` points to production manifest;
- manifest points to immutable `bundle.zip`;
- SHA-256 is verified;
- localhost listener remains `127.0.0.1:8787`;
- runner does not use GitHub branch/main/dist/source repo.

## Blockers

None.

## Pending Steps

No remote publication blocker remains.

Optional operational follow-ups:

- consider updating GitHub-maintained Actions versions if GitHub publishes Node.js 24-native major versions;
- remember GitHub Pages manifest cache is `max-age=600`;
- run a browser/tablet visual field trial against `http://127.0.0.1:8787/kiosk/bolars/`;
- only after this delivery/runtime trial should a separate 1C bridge trial be planned.

## Final Recommendation

READY_FOR_BROWSER_FIELD_TRIAL

The remote GitHub Pages production manifest delivered the BOLARS static bundle to KioskRunner successfully. KioskRunner installed the bundle, served it locally, and exposed healthy diagnostics without 1C participation.
