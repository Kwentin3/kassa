# Blueprint: KioskRunner Embedded Web Server

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

The embedded web server publishes the installed static showcase from `current` by stable localhost URL.

It is not a business backend and does not replace the HTML ↔ 1С bridge.

## 2. Recommended .NET Stack

MVP recommendation:

```text
.NET Generic Host / Worker Service
  + ASP.NET Core Kestrel
  + static file middleware or equivalent minimal pipeline
```

Reasons:

- same host can run update loop and HTTP listener;
- Kestrel supports local-only binding and graceful shutdown;
- static files, MIME mapping and cache headers are standard concerns;
- health/status endpoints can be simple local routes.

Exact .NET LTS version remains an open canon decision.

## 3. Listener

Defaults:

```text
listenHost = 127.0.0.1
port = 8787
basePath = /kiosk/{showcaseId}/
```

Rules:

- `0.0.0.0` is forbidden without explicit ops decision;
- port conflict makes service unhealthy;
- runner must not auto-select a different port silently because 1С needs stable URL.

## 4. Static Root

Static root:

```text
rootDir\current
```

Only this folder is published. `downloads`, `versions`, `logs`, `state.json`, `config.json`, staging and runner binaries are forbidden.

## 5. Routing

| Path | Behavior |
| --- | --- |
| `/kiosk/bolars/` | Serve `index.html`. |
| `/kiosk/bolars/assets/...` | Serve static asset if inside current. |
| SPA fallback under basePath | Serve `index.html`. |
| `/healthz` | Local health endpoint. |
| `/runner/status` | Local status endpoint. |
| forbidden paths | 403/404, no content. |

## 6. MIME Types

Must serve correct MIME for:

- `.html`;
- `.js`;
- `.css`;
- `.json` where public asset is intentional;
- `.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.ico`;
- `.woff`, `.woff2`, `.ttf`;
- `.map` if source maps are intentionally shipped.

Unknown types should be blocked or served as safe `application/octet-stream`; never guessed as executable script.

## 7. Cache Policy

Recommended:

| Resource | Cache |
| --- | --- |
| `index.html` | `no-store` or very short cache. |
| fingerprinted assets | long immutable cache. |
| non-fingerprinted assets | short cache. |
| `/healthz`, `/runner/status` | no-store. |

Stale-cache diagnostics should compare state current version with served version if the bundle provides a version marker.

## 8. Security

Required:

- path traversal protection;
- canonical path stays under `current`;
- no directory listing;
- block forbidden folders/files;
- no upload endpoint;
- no business API;
- status endpoint sanitized;
- localhost-only by default.

## 9. Behavior During Update

If `current` switches during HTTP request:

- request must complete with old or new files;
- no partial file leak;
- service must not crash;
- failed update keeps old current available.

Implementation should avoid deleting current files while requests may read them. Pointer/junction strategy may reduce risk but requires Windows-specific validation.

## 10. Degraded Modes

| Mode | HTTP behavior |
| --- | --- |
| `no_current` | `/healthz` 503, status says degraded, showcase path 503 or diagnostic page. |
| `port_in_use` | Listener not started; service unhealthy. |
| invalid config | Listener may not start; status available only if safe. |
| web server failed | Logs contain bind/config reason. |

## 11. Acceptance

- canonical URL serves `index.html`;
- forbidden paths are not exposed;
- path traversal returns 400/403/404;
- directory URL never lists files;
- status has no secrets or business data;
- cache policy lets 1С see new index after update.
