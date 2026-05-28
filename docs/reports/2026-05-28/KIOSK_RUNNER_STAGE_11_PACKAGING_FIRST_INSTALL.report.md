# KioskRunner Stage 11 Closeout: Packaging And First Install

Date: 2026-05-28

## Slice name

Stage 11. Packaging And First Install Slice

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`
- `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md`
- `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`

## Files changed

- `src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj`
- `packaging/install-service.ps1`
- `packaging/uninstall-service.ps1`
- `packaging/README.md`
- `artifacts/kiosk-runner/KioskRunner-win-x64.zip`

Generated local smoke folders:

- `artifacts/kiosk-runner/publish/`
- `artifacts/kiosk-runner/package/`
- `artifacts/kiosk-runner/smoke/`

## Contracts touched

- No contract changes.
- `config.example.json` was reused unchanged and remains secret-free.

## Ports added

None.

## Adapters added

None.

## Tests added

No unit tests were added in this slice. Stage 11 validation used package/first-install smoke tests against the produced artifact.

## Commands run

- `dotnet publish src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o artifacts/kiosk-runner/publish`
- `Compress-Archive ... artifacts/kiosk-runner/KioskRunner-win-x64.zip`
- Extract package to `artifacts/kiosk-runner/smoke/install`
- Run local Python HTTP server for test manifest/bundle
- `KioskRunner.exe update-once --config <smoke config>`
- `KioskRunner.exe status --config <smoke config>`
- Start foreground `KioskRunner.exe service --config <smoke config>`
- Verify `http://127.0.0.1:<smokePort>/healthz`
- Verify `http://127.0.0.1:<smokePort>/kiosk/bolars/`
- `install-service.ps1 -ConfigPath <smoke config> -ServiceName KioskRunnerSmokeTest`
- `Start-Service -Name KioskRunnerSmokeTest`
- Verify canonical URL from real Windows service
- `uninstall-service.ps1 -ServiceName KioskRunnerSmokeTest`
- `dotnet test KioskRunner.slnx`
- `rg -n "token|password|secret" packaging/config.example.json packaging/README.md packaging/install-service.ps1 packaging/uninstall-service.ps1 -S`

## Acceptance gate result

Passed.

- `KioskRunner-win-x64.zip` was created at `artifacts/kiosk-runner/KioskRunner-win-x64.zip`.
- Zip package contains:
  - `KioskRunner.exe`
  - `config.example.json`
  - `install-service.ps1`
  - `uninstall-service.ps1`
  - `README.md`
- Clean install from zip into the smoke folder worked.
- `update-once` downloaded local production manifest/bundle, verified SHA-256, published `current`, and wrote state/logs.
- Foreground `service` mode served the canonical showcase URL.
- Real Windows SCM install/start/serve/uninstall smoke passed with temporary service `KioskRunnerSmokeTest`.
- `dotnet test KioskRunner.slnx` passed, 84 tests passed.

## Security checks

- Package does not include real `config.json`.
- Package does not include `.env`, private keys or secrets.
- `config.example.json` uses localhost listener and a placeholder production manifest URL.
- Packaging README keeps public/no-auth and no-secret constraints explicit.
- The secrets scan found only explanatory README text; no secret values were present.

## PRD/Blueprint deviations

None.

## Open questions

- MSI/exe installer remains future work.
- Release signing remains future hardening.

## Next recommended slice

Stage 12. Full MVP Test Matrix And Closeout.
