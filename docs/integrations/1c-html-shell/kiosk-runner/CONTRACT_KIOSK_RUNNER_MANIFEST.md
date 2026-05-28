# Contract: KioskRunner Production Manifest

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

The production manifest is the only source KioskRunner reads to discover an installable showcase bundle.

It is not a GitHub branch, not `main`, not `dist`, and not a source repository listing.

## 2. Example

```json
{
  "showcaseId": "bolars",
  "channel": "production",
  "version": "2026.05.28.1",
  "status": "production",
  "bundleUrl": "https://updates.example.com/showcases/bolars/2026.05.28.1/bundle.zip",
  "sha256": "64-char-lowercase-hex-sha256",
  "bridgeContractVersion": "bolars-web-1c-v0.1",
  "minRunnerVersion": "0.3.0",
  "publishedAt": "2026-05-28T12:00:00Z",
  "buildCommit": "abcdef1234567890",
  "rollbackVersion": "2026.05.27.1"
}
```

## 3. Field Contract

| Field | Required | Type | Rule |
| --- | --- | --- | --- |
| `showcaseId` | yes | string | Must match local config. |
| `channel` | yes | string | MVP runner installs only configured `production`. |
| `version` | yes | string | Immutable showcase version. |
| `status` | yes | string | Must be `production` for production install. |
| `bundleUrl` | yes | string URL | URL to immutable `bundle.zip`. |
| `sha256` | yes | string | SHA-256 of `bundle.zip`, lowercase hex preferred. |
| `bridgeContractVersion` | yes | string | HTML ↔ 1С contract compatibility marker. |
| `minRunnerVersion` | yes | string | Minimum runner version needed for this bundle. |
| `publishedAt` | yes | ISO datetime | Publication timestamp. |
| `buildCommit` | optional | string | Source commit for traceability. |
| `rollbackVersion` | optional | string | Recommended rollback version; local `previousVersion` still wins for MVP rollback. |

## 4. Validation Rules

Runner must reject manifest when:

- JSON parse fails;
- required fields are absent;
- `showcaseId` differs from config;
- `channel` differs from config;
- `status` is not `production`;
- `bundleUrl` is absent or invalid;
- `sha256` is absent or wrong shape;
- `minRunnerVersion` is higher than installed runner;
- `bridgeContractVersion` is incompatible;
- manifest response is HTML or any non-JSON payload.

## 5. Manifest Is Not Branch/Dist

Wrong:

```text
registryUrl -> GitHub branch/main/dist
runner -> git pull
runner -> raw HTML source files
```

Right:

```text
registryUrl -> production manifest
manifest -> immutable bundle.zip + sha256
runner -> download bundle -> verify -> install
```

## 6. Public MVP Trust Model

MVP may use a publicly available manifest. This is acceptable only because manifest and bundle contain no secrets, tokens, 1С business data, personal data or fiscal data.

`sha256` verifies bundle integrity relative to manifest. It does not prove the manifest itself is trustworthy. MVP trust is based on a trusted `registryUrl`.

## 7. Future Signed Manifest

Future hardening should add:

- signed manifest;
- signed bundle;
- release signing for runner;
- private registry or token-based download;
- registry domain allowlist;
- central update server.
