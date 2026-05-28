# Blueprint: KioskRunner Rollback And Recovery

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. Purpose

Rollback and recovery keep the local showcase available when update, filesystem or web serving failures occur.

Rollback concerns static files only. It does not recover 1С sale state.

## 2. Previous Version

`state.previousVersion` is the primary rollback target. It must refer to a local directory under:

```text
versions\<previousVersion>
```

Rollback must not require GitHub, registry or bundle download if previous version exists locally.

## 3. Rollback Command

```text
KioskRunner.exe rollback
```

Expected lifecycle:

1. Load config.
2. Load state.
3. Validate `previousVersion`.
4. Validate previous version bundle root has `index.html`.
5. Switch `current` to previous version.
6. Update state.
7. Log reason and result.
8. Web server serves restored `current`.

## 4. Failed Update

If manifest, download, hash, unzip or bundle validation fails:

- do not switch current;
- keep old current served;
- write `lastUpdateStatus=failed` or `blocked`;
- keep `previousVersion` unchanged.

## 5. Current Switch Failure

If switch starts but fails:

- restore previous current if possible;
- mark state degraded if actual current cannot be proven;
- keep web server from exposing staging;
- require recovery playbook if state/current mismatch remains.

## 6. Damaged `state.json`

Expected behavior:

- do not run destructive update;
- inspect `current` and `versions` safely;
- report `invalidState`;
- allow explicit recovery command/future tooling;
- do not infer business state.

## 7. Missing Current

If no `current` exists:

- health `degraded/no_current`;
- showcase path returns 503 or diagnostic page;
- `update-once` can create first current from production manifest;
- rollback unavailable unless previous local version can be identified safely.

## 8. Partial Staging

On startup:

- detect stale `_staging` folders;
- remove only folders known to be staging and under rootDir;
- never delete `current` or valid `versions`;
- log cleanup.

## 9. Web Server Stale Files

Stale serving means state says version A but HTTP still serves version B.

Mitigation:

- `index.html` no-store/short cache;
- optional served-version marker in bundle;
- status endpoint reports `currentVersion`;
- logs warn if served marker differs from state.

## 10. Recovery Playbooks

### Playbook A: failed update

1. Check `/runner/status`.
2. Check latest logs.
3. Confirm current URL still opens.
4. Fix manifest/bundle/hash issue.
5. Run `update-once`.

### Playbook B: no current

1. Validate config and `registryUrl`.
2. Run `update-once`.
3. If download unavailable, restore a known version into `versions`.
4. Run explicit rollback/recover command when available.

### Playbook C: corrupted state

1. Stop service.
2. Back up `rootDir`.
3. Inspect `current` and `versions`.
4. Recreate state only through approved recovery tooling/manual ops procedure.
5. Start service and verify status.

### Playbook D: port conflict

1. Identify process using port.
2. Stop conflicting service or update config with approved stable port.
3. Update 1С URL only if port changed by explicit ops decision.

## 11. Acceptance

- rollback works offline;
- failed update keeps old current;
- partial staging cleanup does not delete valid versions;
- damaged state does not trigger destructive update;
- recovery logs are clear and sanitized.
