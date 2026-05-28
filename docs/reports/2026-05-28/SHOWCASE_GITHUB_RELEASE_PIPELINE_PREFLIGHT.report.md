# Showcase GitHub Release Pipeline Preflight

Date: 2026-05-28

Status: PASSED

## Scope

Preflight for product GitHub/static publication of BOLARS showcase bundle for KioskRunner field trial without 1С.

## Source documents read

- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_SHOWCASE_RELEASE_PIPELINE_MVP.md`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_SHOWCASE_RELEASE_PIPELINE_FIELD_TRIAL.md`
- `docs/reports/2026-05-28/SHOWCASE_RELEASE_PIPELINE_MVP_CLOSEOUT.report.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_BUNDLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`
- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_FINAL_RC_AUDIT.report.md`

## Current pipeline files

- `showcases/bolars/showcase.config.json`: present.
- `scripts/publish-showcase-bundle.ps1`: present.
- `scripts/prepare-1c-bolars-dist.mjs`: present.
- `package.json` contains `build:1c:bolars`: present.
- `artifacts/kiosk-runner/KioskRunner-win-x64.zip`: present.

## Local pipeline check

Command:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\publish-showcase-bundle.ps1 `
  -Showcase bolars `
  -Version 2026.05.28.github-preflight `
  -Channel production `
  -Status production `
  -BaseUrl https://example.github.io/kassa
```

Result: passed.

Generated:

```text
artifacts/showcases/bolars/2026.05.28.github-preflight/bundle.zip
artifacts/showcases/bolars/2026.05.28.github-preflight/manifest.json
artifacts/showcases/bolars/2026.05.28.github-preflight/sha256.txt
artifacts/showcases/bolars/production/manifest.json
```

SHA-256:

```text
6f5aa7269a5ed9fc4f06d10f32bac5103fe910c7257b235220767aa68224ff86
```

## Existing GitHub publication infra

Repository root `.github/` directory: not present.

There is no existing GitHub Pages workflow in the repository root, so adding `.github/workflows/publish-bolars-showcase.yml` does not conflict with a current Pages workflow.

## Publication mode

Selected MVP publication mode:

```text
GitHub Pages via GitHub Actions custom workflow.
```

Rationale:

- no central update-server;
- no auth/private registry;
- no telemetry/fleet dashboard;
- produces a dumb static HTTPS layout;
- KioskRunner consumes only `registryUrl -> production/manifest.json`.

The workflow will use the official GitHub Pages custom workflow pattern with `actions/upload-pages-artifact` and `actions/deploy-pages`.

## KioskRunner impact

No KioskRunner change is required.

Expected runtime path remains:

```text
config.registryUrl -> production manifest -> immutable bundle.zip -> sha256 -> current -> localhost web server
```

KioskRunner must not read GitHub branch/main/dist, perform `git pull`, or download HTML from the source repository.

## Blockers

None before workflow implementation.

Remote GitHub Pages deployment itself cannot be executed from this local workspace. It will be marked pending until a maintainer runs the workflow in GitHub with Pages source set to GitHub Actions.
