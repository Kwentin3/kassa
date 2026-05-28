# KioskRunner Service Autoupdate Smoke

Date: 2026-05-28

Final status: PASSED

## Scope

Verified that KioskRunner running in `service` mode as a Windows Service automatically updates the local showcase after a new production bundle appears on GitHub Pages.

This smoke did not use 1C, did not use `KioskRunner.exe update-once`, did not use PowerShell Manager `Update now`, and did not stop the service during the remote A -> B autoupdate observation.

Verified flow:

```text
GitHub Actions
-> GitHub Pages production manifest
-> immutable bundle.zip
-> KioskRunner Windows Service scheduled update loop
-> local current switch
-> embedded web server serves new version
```

## Service And Config

Service name:

```text
KioskRunner-bolars
```

Smoke config path:

```text
D:\Users\Roman\Desktop\Проекты\Витрина\artifacts\kioskrunner-service-autoupdate-smoke\runner\config.json
```

Smoke rootDir:

```text
D:\Users\Roman\Desktop\Проекты\Витрина\artifacts\kioskrunner-service-autoupdate-smoke\showcases\bolars
```

Registry URL:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

Config values:

```text
autoUpdate = true
checkIntervalMinutes = 1
listenHost = 127.0.0.1
port = 8787
basePath = /kiosk/bolars/
```

Service registration:

```text
StartMode = Auto
State during smoke = Running
PathName = "...\KioskRunner.exe" service --config "...\config.json"
```

Post-smoke cleanup:

- test Windows Service was uninstalled;
- smoke `rootDir`, `current`, `versions` and `logs` were left on disk for evidence.

## Versions

Baseline version A:

```text
2026.05.28.autoupdate-a-160831
```

Intermediate version B:

```text
2026.05.28.autoupdate-b-160831
```

Final version B used for final acceptance:

```text
2026.05.28.autoupdate-b2-160831
```

Note: the first B dispatch accidentally passed a malformed optional `rollback_version` input from PowerShell. KioskRunner does not depend on that field for update, and the service did update to that version. To avoid leaving production manifest with a malformed optional field, a clean final B2 version was published with empty `rollback_version`. The service then automatically updated again to B2 without manual intervention.

## GitHub Actions Runs

Version A run:

```text
https://github.com/Kwentin3/kassa/actions/runs/26576651429
```

Result:

```text
status = completed
conclusion = success
headSha = f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
```

Intermediate B run:

```text
https://github.com/Kwentin3/kassa/actions/runs/26576759537
```

Result:

```text
status = completed
conclusion = success
headSha = f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
```

Final B2 run:

```text
https://github.com/Kwentin3/kassa/actions/runs/26576852973
```

Result:

```text
status = completed
conclusion = success
headSha = f3afdfb73c2a3bd5c6e0c6dcb64352455efd7e28
```

## Published Manifests And Bundles

Production manifest URL:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

Version A bundle URL:

```text
https://Kwentin3.github.io/kassa/showcases/bolars/versions/2026.05.28.autoupdate-a-160831/bundle.zip
```

Version A sha256:

```text
5d8ad8851cf0d0a08a1e141b422fd90ec19766042391d052124b313a2f441bb1
```

Downloaded A bundle SHA-256 matched manifest.

Final B2 bundle URL:

```text
https://Kwentin3.github.io/kassa/showcases/bolars/versions/2026.05.28.autoupdate-b2-160831/bundle.zip
```

Final B2 sha256:

```text
ef336e8cf8dea062597e8c2b00ff2ef90b88c3fde383f344e990f69892eeaba0
```

Downloaded B2 bundle SHA-256 matched manifest.

Final production manifest fields:

```text
showcaseId = bolars
channel = production
status = production
version = 2026.05.28.autoupdate-b2-160831
rollbackVersion = null
Cache-Control = max-age=600
```

## Timeline

Local timezone: Europe/Moscow, UTC+03:00.

```text
2026-05-28T16:08:44+03:00  Dispatched GitHub Actions for version A.
2026-05-28T16:09:41+03:00  Version A workflow completed successfully.
2026-05-28T16:09:55+03:00  GitHub Pages production manifest returned version A.
2026-05-28T16:10:36+03:00  Installed and started KioskRunner-bolars Windows Service.
2026-05-28T13:10:38Z       Service completed update to version A.
2026-05-28T16:10:46+03:00  /runner/status observed currentVersion=A, servedVersion=A.
2026-05-28T16:10:56+03:00  Dispatched GitHub Actions for intermediate version B.
2026-05-28T16:11:53+03:00  Intermediate version B workflow completed successfully.
2026-05-28T13:11:39Z       Service completed scheduled update to intermediate B.
2026-05-28T16:12:52+03:00  Dispatched clean final GitHub Actions for version B2.
2026-05-28T16:13:51+03:00  Final B2 workflow completed successfully.
2026-05-28T13:13:40Z       Service completed scheduled update to final B2.
2026-05-28T16:14:15+03:00  /runner/status observed currentVersion=B2, servedVersion=B2.
2026-05-28T16:16:59+03:00  Final endpoint capture: showcase/health/status all OK.
```

## Status Before And After

After service start and baseline A install:

```json
{
  "health": "ok",
  "currentVersion": "2026.05.28.autoupdate-a-160831",
  "servedVersion": "2026.05.28.autoupdate-a-160831",
  "lastUpdateStatus": "updated",
  "lastError": null
}
```

After final B2 scheduled update:

```json
{
  "health": "ok",
  "currentVersion": "2026.05.28.autoupdate-b2-160831",
  "previousVersion": "2026.05.28.autoupdate-b-160831",
  "servedVersion": "2026.05.28.autoupdate-b2-160831",
  "lastCheckAt": "2026-05-28T13:16:41.5123681+00:00",
  "lastUpdateStatus": "noop",
  "lastSuccessfulUpdateAt": "2026-05-28T13:13:40.5379804+00:00",
  "lastError": null
}
```

The final captured `lastUpdateStatus` is `noop` because the service performed additional scheduled checks after the successful B2 update. Logs show the actual B2 update as `update.completed` at `2026-05-28T13:13:40Z`.

## Endpoint Results

Health:

```text
GET http://127.0.0.1:8787/healthz
HTTP 200
{"health":"ok"}
```

Runner status:

```text
GET http://127.0.0.1:8787/runner/status
HTTP 200
currentVersion = 2026.05.28.autoupdate-b2-160831
servedVersion = 2026.05.28.autoupdate-b2-160831
```

Showcase:

```text
GET http://127.0.0.1:8787/kiosk/bolars/
HTTP 200
X-Kiosk-Showcase-Version = 2026.05.28.autoupdate-b2-160831
Cache-Control = no-store
```

## Service Log Evidence

Relevant log sequence:

```jsonl
{"timestamp":"2026-05-28T13:10:37.7423398+00:00","event":"manifest.fetched","message":"2026.05.28.autoupdate-a-160831"}
{"timestamp":"2026-05-28T13:10:38.0207575+00:00","event":"update.completed","message":"2026.05.28.autoupdate-a-160831"}
{"timestamp":"2026-05-28T13:11:38.4375256+00:00","event":"manifest.fetched","message":"2026.05.28.autoupdate-b-160831"}
{"timestamp":"2026-05-28T13:11:39.05643+00:00","event":"update.completed","message":"2026.05.28.autoupdate-b-160831"}
{"timestamp":"2026-05-28T13:12:39.4274323+00:00","event":"manifest.fetched","message":"2026.05.28.autoupdate-b-160831"}
{"timestamp":"2026-05-28T13:12:39.4290013+00:00","event":"update.noop","message":"2026.05.28.autoupdate-b-160831"}
{"timestamp":"2026-05-28T13:13:39.9032489+00:00","event":"manifest.fetched","message":"2026.05.28.autoupdate-b2-160831"}
{"timestamp":"2026-05-28T13:13:40.5389956+00:00","event":"update.completed","message":"2026.05.28.autoupdate-b2-160831"}
{"timestamp":"2026-05-28T13:14:40.9246425+00:00","event":"manifest.fetched","message":"2026.05.28.autoupdate-b2-160831"}
{"timestamp":"2026-05-28T13:14:40.9257767+00:00","event":"update.noop","message":"2026.05.28.autoupdate-b2-160831"}
```

This proves the scheduled service loop continued checking after the update and returned no-op for the already installed version.

## Manual Update Use

Manual update was not used.

Explicitly not used:

- `KioskRunner.exe update-once`
- PowerShell Manager `Update now`
- safe update stop -> update-once -> start
- service stop during remote A -> B/B2 observation

The only service stop/removal was post-smoke cleanup after all evidence was captured.

## Cache Observations

GitHub Pages returned:

```text
Cache-Control = max-age=600
```

Observed manifest `Age` values:

```text
A:  age=0
B:  age=30
B2: age=23
```

No blocking cache delay occurred in this run. The service saw new production manifests during scheduled checks within approximately one configured interval.

## Negative Autoupdate Check

A safe local negative autoupdate simulation was executed without touching production GitHub Pages.

Simulation setup:

- local static registry: `http://127.0.0.1:51420/showcases/bolars/production/manifest.json`;
- foreground `KioskRunner.exe service --config <negative-config>`;
- local web server port: `8788`;
- no `update-once`;
- no main service stop.

Baseline local negative version:

```text
2026.05.28.negative-base-160831
```

Bad manifest version:

```text
2026.05.28.negative-bad-160831
```

Bad manifest used the same reachable bundleUrl but an intentionally wrong SHA-256:

```text
0000000000000000000000000000000000000000000000000000000000000000
```

Result:

```json
{
  "badObserved": true,
  "currentVersion": "2026.05.28.negative-base-160831",
  "servedVersion": "2026.05.28.negative-base-160831",
  "lastUpdateStatus": "failed",
  "lastError": "sha256_mismatch"
}
```

Expected behavior was confirmed: wrong SHA-256 did not switch `current`, and old local showcase remained the served version.

## Blockers

None.

## Limitations

- The first B workflow dispatch had a malformed optional `rollback_version` input due to PowerShell expression passing. This was corrected by publishing clean final B2. Runner update behavior was unaffected.
- Negative remote test was not performed against production GitHub Pages because intentionally corrupting production manifest is unsafe. A local static registry simulation was used instead.
- GitHub Pages cache headers remain `max-age=600`; this run did not experience a blocking cache delay, but future runs may need to wait.

## Final Recommendation

PASSED.

KioskRunner Windows Service scheduled autoupdate loop is field-trial ready for the tested delivery path:

```text
GitHub Pages production manifest
-> service scheduled check
-> bundle download
-> sha256 verification
-> current switch
-> localhost serving of new version
```
