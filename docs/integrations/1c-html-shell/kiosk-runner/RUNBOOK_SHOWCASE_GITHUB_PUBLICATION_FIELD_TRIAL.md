# Runbook: Showcase GitHub Publication Field Trial

## Purpose

This runbook describes the field-trial flow for publishing the BOLARS HTML showcase through GitHub Actions / GitHub Pages-style static hosting and validating delivery through KioskRunner without 1C.

The flow is limited to the delivery/runtime contour:

GitHub Actions build -> static publication -> production manifest -> immutable bundle.zip -> KioskRunner update-once -> KioskRunner service -> `http://127.0.0.1:8787/kiosk/bolars/`.

1C, the HTML <-> 1C bridge, cart, payment, fiscalization, scanner, marking, KKT and business sale state are not part of this test.

## Canonical Publication Layout

The published static tree must keep this layout:

```text
showcases/
  bolars/
    production/
      manifest.json
    versions/
      <version>/
        bundle.zip
        manifest.json
        sha256.txt
```

`production/manifest.json` is the stable registry URL for KioskRunner.

`versions/<version>/bundle.zip` is an immutable bundle URL referenced by the manifest.

KioskRunner must not know the source repository, branch, `main`, `dist`, or build output folder.

## GitHub Actions Workflow

Use workflow:

```text
.github/workflows/publish-bolars-showcase.yml
```

Run it manually from GitHub Actions with `workflow_dispatch`.

Required input:

```text
version = 2026.05.28.1
```

Default inputs:

```text
channel = production
status = production
base_url = empty
rollback_version = empty
```

If `base_url` is empty, the workflow uses:

```text
https://<owner>.github.io/<repo>
```

For a custom static host, pass the public HTTPS base URL without a trailing slash.

## What Workflow Produces

The workflow:

1. checks out the repo;
2. installs Node dependencies;
3. runs `scripts/publish-showcase-bundle.ps1`;
4. verifies generated `bundle.zip`, `manifest.json`, `sha256.txt`;
5. prepares GitHub Pages layout under `artifacts/pages`;
6. uploads the release files as a traceability artifact;
7. deploys the static layout to GitHub Pages.

Expected URLs:

```text
registryUrl = https://<static-host>/showcases/bolars/production/manifest.json
bundleUrl   = https://<static-host>/showcases/bolars/versions/<version>/bundle.zip
```

## Local Dry Run

Before running GitHub Actions, validate the same publication layout locally:

```powershell
.\scripts\smoke-showcase-release-pipeline.ps1 `
  -Version 2026.05.28.1 `
  -Channel production `
  -Status production `
  -BaseUrl http://127.0.0.1:51410 `
  -PublicationRoot artifacts/github-pages-showcase-publication
```

The local dry-run creates:

```text
artifacts/github-pages-showcase-publication/showcases/bolars/production/manifest.json
artifacts/github-pages-showcase-publication/showcases/bolars/versions/<version>/bundle.zip
artifacts/github-pages-showcase-publication/showcases/bolars/versions/<version>/manifest.json
artifacts/github-pages-showcase-publication/showcases/bolars/versions/<version>/sha256.txt
```

A temporary local static server may be used only for smoke simulation. It is not a product update-server.

## Manifest Cache Note

`production/manifest.json` must update predictably. If the static host allows cache headers, configure `no-cache` or a short TTL for `production/manifest.json`.

Versioned `bundle.zip` paths are immutable and may be cached longer.

GitHub Pages does not provide fine-grained per-file cache header control in this MVP. If a field trial sees stale `production/manifest.json`, wait for cache refresh or publish a new version and re-check the URL before running KioskRunner.

## KioskRunner Config

Unpack `KioskRunner-win-x64.zip`, copy `config.example.json` to `config.json`, and set:

```json
{
  "showcaseId": "bolars",
  "channel": "production",
  "registryUrl": "https://<static-host>/showcases/bolars/production/manifest.json",
  "webServer": {
    "listenHost": "127.0.0.1",
    "port": 8787,
    "basePath": "/kiosk/bolars/"
  }
}
```

Do not point `registryUrl` to GitHub branch URLs, source folders, `main`, `dist`, or `raw` development paths. It must point to the published production manifest only.

## KioskRunner Smoke

Run:

```powershell
.\KioskRunner.exe update-once --config .\config.json
.\KioskRunner.exe status --config .\config.json
```

`update-once` downloads and installs the bundle, then exits. It does not keep the local HTTP server running.

Start serving:

```powershell
.\KioskRunner.exe service --config .\config.json
```

Then open:

```text
http://127.0.0.1:8787/kiosk/bolars/
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Expected result:

```text
health = ok
currentVersion = <version>
servedVersion = <version>
X-Kiosk-Showcase-Version = <version>
```

## Troubleshooting

If `sha256_mismatch` appears, do not force install. Re-download `bundle.zip`, recompute sha256, and verify that `production/manifest.json` points to the immutable versioned bundle.

If KioskRunner reports `manifest_channel_mismatch` or `manifest_status_not_production`, check that the production registry URL does not point to a candidate manifest.

If the localhost showcase does not open after `update-once`, start `service` mode. `update-once` does not host static files.

If the manifest URL returns HTML, a GitHub Pages error page, or a stale file, fix publication settings or wait for cache refresh before testing KioskRunner again.

## Success Criteria

The field trial is successful when:

1. GitHub Actions produces `bundle.zip`, `manifest.json`, `sha256.txt` and `production/manifest.json`.
2. `registryUrl` points to `production/manifest.json`.
3. `bundleUrl` points to immutable `versions/<version>/bundle.zip`.
4. KioskRunner `update-once` installs the version.
5. KioskRunner `service` serves `http://127.0.0.1:8787/kiosk/bolars/`.
6. `/healthz` and `/runner/status` are available.
7. No 1C, backend, auth, telemetry, update-server or fleet dashboard is involved.
