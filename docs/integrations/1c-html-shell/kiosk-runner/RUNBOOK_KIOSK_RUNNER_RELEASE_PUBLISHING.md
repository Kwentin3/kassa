# Runbook: KioskRunner Release Publishing

Дата: 2026-05-28  
Статус: draft  
Аудитория: release operator / DevOps

## 1. Artifact Separation

There are two independent release streams:

- Runner artifact: delivery/runtime program.
- Showcase artifact: static HTML showcase bundle.

Runner version and showcase version are different.

## 2. A. Runner Publishing

Build:

```text
KioskRunner.exe
```

Package:

```text
KioskRunner-win-x64.zip
```

Include:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
README.md
LICENSE / NOTICE
```

Publish:

- GitHub Release of KioskRunner project; or
- approved public release URL.

MVP:

- implementer downloads runner manually;
- no self-update;
- no mandatory auth;
- release signing is future hardening unless separately required.

## 3. B. Showcase Publishing

Build static HTML:

```text
source repo -> build -> static artifact
```

Package:

```text
bundle.zip
```

Compute:

```text
sha256(bundle.zip)
```

Create production manifest:

```json
{
  "showcaseId": "bolars",
  "channel": "production",
  "version": "2026.05.28.1",
  "status": "production",
  "bundleUrl": "https://<public-static-host>/showcases/bolars/versions/2026.05.28.1/bundle.zip",
  "sha256": "64-char-lowercase-hex-sha256",
  "bridgeContractVersion": "bolars-web-1c-v0.1",
  "minRunnerVersion": "0.3.0",
  "publishedAt": "2026-05-28T12:00:00Z",
  "buildCommit": "abcdef1234567890"
}
```

## 4. Candidate To Production

Recommended flow:

1. Build candidate bundle.
2. Verify smoke/visual/1C/static-serving gates.
3. Compute sha256.
4. Publish immutable bundle.
5. Promote manifest to production.
6. Runner reads only production manifest.

Runner must not read branch/main/dist or infer artifacts from source repo.

## 5. Public MVP

MVP may publish runner zip, manifest and bundle publicly if they contain no secrets or business data.

`sha256` does not replace signed manifest. Future hardening should add signing/auth/private registry.

## 6. Release Checklist

- Bundle has root `index.html`.
- Bundle has no secrets.
- Manifest `showcaseId` matches intended config.
- Manifest `status=production` only after checks.
- Manifest `minRunnerVersion` is accurate.
- Bundle URL is immutable.
- SHA-256 matches published bundle.
- Runner release includes safe `config.example.json`.
