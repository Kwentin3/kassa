# KioskRunner Stage 3 Closeout: Manifest Client Slice

Date: 2026-05-28

## Slice name

Stage 3. Manifest Client Slice.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Ports/Manifest/`
- `src/KioskRunner.Core/Manifest/`
- `src/KioskRunner.Adapters.Http/Manifest/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

Added manifest fetch/parse error codes:

- `manifest_unavailable`
- `manifest_response_not_json`
- `invalid_manifest_json`

## Ports added

- `IManifestClient`
- `ManifestClientResult`

## Adapters added

- `HttpManifestClient`

## Tests added

- Valid manifest fetch and validation.
- HTML response rejected.
- Wrong `showcaseId` rejected.
- Wrong channel rejected.
- Non-production status rejected.
- Invalid `sha256` rejected.
- `minRunnerVersion` above installed runner returns `runner_update_required`.
- Manifest client does not download bundle.

## Commands run

```powershell
dotnet add tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj reference src/KioskRunner.Adapters.Http/KioskRunner.Adapters.Http.csproj
dotnet build KioskRunner.slnx
rg -n "bundle\.zip|File\.|Directory\.|ZipArchive|Kestrel|WindowsService|git pull|main/dist" src/KioskRunner.Adapters.Http src/KioskRunner.Ports src/KioskRunner.Core -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 42 tests passed, 0 failed, 0 skipped.
- Out-of-scope scan returned no source matches for bundle download, filesystem update, zip, Kestrel, Windows Service, `git pull` or branch/main/dist behavior in the Stage 3 source slice.

## Security checks

- Manifest client fetches exactly the configured `registryUrl` passed by caller.
- Manifest client rejects HTML/non-JSON responses before validation.
- Manifest validation blocks wrong showcase/channel/status and incompatible runner version.
- No bundle download, hash verification, extraction, current switch or 1С business behavior was introduced.

## PRD/Blueprint deviations

No deviation.

The implementation keeps `registryUrl -> production manifest` as the only manifest discovery path.

## Open questions

None for Stage 3.

## Next recommended slice

Stage 4. Bundle Download And SHA-256 Slice.
