# KioskRunner Stage 2 Closeout: Config Provider Slice

Date: 2026-05-28

## Slice name

Stage 2. Config Provider Slice.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_CONFIG.md`
- `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md`
- `docs/integrations/1c-html-shell/kiosk-runner/SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`

## Files changed

- `src/KioskRunner.Ports/Config/`
- `src/KioskRunner.Core/Config/`
- `src/KioskRunner.Adapters.FileSystem/Config/`
- `packaging/config.example.json`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

No schema change beyond using Stage 1 config contract and validation errors.

## Ports added

- `IConfigProvider`
- `ConfigProviderResult`

## Adapters added

- `JsonFileConfigProvider`

## Tests added

- Missing config returns `no_config`.
- Invalid JSON returns `invalid_json`.
- Missing `registryUrl` returns `registry_url_missing`.
- Unsafe `listenHost` returns `unsafe_listen_host`.
- Valid config is accepted.
- `config.example.json` is valid and contains no secret/token/password markers.

## Commands run

```powershell
dotnet add tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj reference src/KioskRunner.Adapters.FileSystem/KioskRunner.Adapters.FileSystem.csproj
dotnet build KioskRunner.slnx
rg -n "HttpClient|Kestrel|WindowsService|ServiceBase|git pull|manual JSON" src/KioskRunner.Ports src/KioskRunner.Core src/KioskRunner.Adapters.FileSystem packaging/config.example.json -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 34 tests passed, 0 failed, 0 skipped.
- Out-of-scope scan returned no source matches for HTTP client, Kestrel, Windows Service, `git pull` or manual JSON behavior in this slice.

## Security checks

- `config.example.json` contains placeholder public URLs only and no tokens/passwords/secrets.
- Default listener remains `127.0.0.1`.
- `0.0.0.0` is rejected by config validation.
- Directory listing remains forbidden by config validation.
- No manifest download, bundle download, backend behavior or 1С business API was introduced.

## PRD/Blueprint deviations

No deviation.

The adapter reads local config only. It does not discover GitHub branches, inspect `main/dist`, call network, or infer registry location.

## Open questions

None for Stage 2.

## Next recommended slice

Stage 3. Manifest Client Slice.
