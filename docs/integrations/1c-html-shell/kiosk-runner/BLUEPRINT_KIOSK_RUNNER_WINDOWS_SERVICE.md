# Blueprint: KioskRunner Windows Service And CLI

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

This blueprint defines the Windows Service and CLI lifecycle for KioskRunner MVP.

## 2. Commands

| Command | MVP/Future | Purpose |
| --- | --- | --- |
| `update-once` | MVP | Run one update lifecycle and exit. |
| `status` | MVP | Print local state/web health without changing files. |
| `rollback` | MVP | Restore `previousVersion` from local `versions`. |
| `install` | MVP or script wrapper | Install Windows Service. |
| `uninstall` | MVP or script wrapper | Remove Windows Service. |
| `start` | optional | Start installed service. |
| `stop` | optional | Stop installed service. |
| `service` | MVP | Windows Service entrypoint. |

## 3. Service Name

MVP default:

```text
KioskRunner-{showcaseId}
```

Example:

```text
KioskRunner-bolars
```

One service per showcase is the MVP canon. Multi-showcase service is future work.

## 4. Install Scripts

Runner artifact should include:

```text
install-service.ps1
uninstall-service.ps1
```

Script responsibilities:

- validate `KioskRunner.exe` exists;
- validate `config.json` exists;
- install service with stable working directory;
- set service arguments, e.g. `service --config C:\KioskRunner\config.json`;
- set restart policy if approved;
- avoid printing secrets.

## 5. Working Directory And Config Path

MVP install location:

```text
C:\KioskRunner
```

MVP showcase root:

```text
C:\KioskShowcases\bolars
```

Service must use explicit config path, not rely on a random current directory.

## 6. Permissions

Service account needs:

- read `C:\KioskRunner`;
- read `config.json`;
- read/write `rootDir`;
- bind `127.0.0.1:8787`;
- write logs.

It does not need:

- access to 1С database;
- access to payment/KKT devices;
- admin rights after install unless required by chosen service account policy.

## 7. Logs

Logs live under:

```text
rootDir\logs
```

Recommended format: JSON Lines with bounded retention. CLI can print short human-readable status.

## 8. Restart And Shutdown

Service should:

- start web server and update loop;
- stop accepting new HTTP requests on shutdown;
- finish or cancel active update safely;
- never leave partial `current` as successful state;
- report health after restart based on config/state/current.

## 9. First-run Degraded States

| State | Service behavior |
| --- | --- |
| `no_config` | Do not run update; health degraded if diagnostic endpoint can safely start. |
| `no_current` | Web server can start and return 503/diagnostic for showcase path. |
| `port_in_use` | Web server fails; service unhealthy. |
| invalid `registryUrl` | Update blocked; existing current still served if present. |

## 10. Health

Service is healthy only when:

- config valid;
- web server listening;
- current available;
- state not corrupted beyond recovery.

Update failure with old current still served may be degraded, not fully down.

## 11. Acceptance

- `update-once` works before service install;
- service starts and serves canonical URL;
- `status` exposes no secrets;
- `rollback` works without network;
- graceful shutdown does not corrupt current/state.
