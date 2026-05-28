# KioskRunner Stage 5 Closeout: Bundle Extraction And Validation Slice

Date: 2026-05-28

## Slice name

Stage 5. Bundle Extraction And Validation Slice.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_BUNDLE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Ports/Bundles/`
- `src/KioskRunner.Adapters.Zip/`
- `src/KioskRunner.Adapters.FileSystem/Bundles/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

Added bundle extraction/validation error codes:

- `broken_zip`
- `zip_slip_blocked`
- `bundle_index_missing`
- `bundle_forbidden_file`
- `bundle_assets_missing`

## Ports added

- `IZipExtractor`
- `IBundleValidator`
- `ZipExtractionResult`
- `BundleValidationResult`

## Adapters added

- `ZipArchiveExtractor`
- `StaticBundleValidator`

## Tests added

- Valid bundle extracts and validates.
- Zip-slip is blocked and staging is cleaned.
- Broken zip is rejected and staging is cleaned.
- Missing `index.html` is rejected.
- Forbidden `.env` file is rejected.
- Invalid bundle does not create `versions` or `current`.

## Commands run

```powershell
dotnet add tests/KioskRunner.Tests.Unit/KioskRunner.Tests.Unit.csproj reference src/KioskRunner.Adapters.Zip/KioskRunner.Adapters.Zip.csproj
dotnet build KioskRunner.slnx
rg -n "versions|current|Junction|CreateSymbolicLink|CreateJunction" src/KioskRunner.Adapters.Zip src/KioskRunner.Adapters.FileSystem src/KioskRunner.Ports -S --glob "!**/obj/**" --glob "!**/bin/**"
dotnet test KioskRunner.slnx
```

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 52 tests passed, 0 failed, 0 skipped.
- Out-of-scope scan returned no source matches for version publish, `current` switch or junction behavior in Stage 5 source paths.

## Security checks

- Zip-slip/path traversal entries are blocked before any publish step.
- Staging is deleted on zip-slip and broken zip failure.
- Forbidden operational/secret-bearing files such as `.env` are rejected.
- Bundle validation requires root `index.html`.
- No `versions`, `current`, web server, backend behavior or 1С business API was introduced.

## PRD/Blueprint deviations

No deviation.

This slice validates only extracted staging content. Version storage and current switching remain out of scope.

## Open questions

None for Stage 5.

## Next recommended slice

Stage 6. Version Store And Current Publisher Slice.
