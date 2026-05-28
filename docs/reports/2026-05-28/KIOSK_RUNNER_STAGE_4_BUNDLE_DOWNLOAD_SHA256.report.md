# KioskRunner Stage 4 Closeout: Bundle Download And SHA-256 Slice

Date: 2026-05-28

## Slice name

Stage 4. Bundle Download And SHA-256 Slice.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Ports/Bundles/`
- `src/KioskRunner.Adapters.Http/Bundles/`
- `src/KioskRunner.Adapters.FileSystem/Hash/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

Added download/hash error codes:

- `bundle_download_failed`
- `hash_file_missing`
- `sha256_mismatch`

## Ports added

- `IBundleDownloader`
- `IHashVerifier`
- `BundleDownloadResult`
- `HashVerificationResult`

## Adapters added

- `HttpBundleDownloader`
- `Sha256HashVerifier`

## Tests added

- Valid bundle download writes to `downloads/.../bundle.zip`.
- Valid SHA-256 is accepted.
- Wrong SHA-256 is rejected.
- Failed download does not create final bundle file.
- Stage 4 source slice does not introduce zip extraction.

## Commands run

```powershell
dotnet build KioskRunner.slnx
rg -n "ExtractToDirectory|ZipArchive|current" src/KioskRunner.Adapters.Http src/KioskRunner.Adapters.FileSystem src/KioskRunner.Ports -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 46 tests passed, 0 failed, 0 skipped.
- Out-of-scope scan returned no source matches for zip extraction or `current` switching in Stage 4 source paths.

## Security checks

- Download writes to explicit downloads path, not `current`.
- Failed download leaves no final bundle file.
- Hash mismatch returns `sha256_mismatch` and does not publish anything.
- No unzip, execution, `current` switch, business API, 1С state or manual JSON upload was introduced.

## PRD/Blueprint deviations

No deviation.

This slice implements only download and integrity verification. Publishing remains blocked until later slices.

## Open questions

None for Stage 4.

## Next recommended slice

Stage 5. Bundle Extraction And Validation Slice.
