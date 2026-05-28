# KioskRunner Stage 0 Closeout: Architecture Skeleton And Project Boundaries

Date: 2026-05-28

## Slice name

Stage 0. Architecture Skeleton And Project Boundaries.

## Source docs used

- `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `docs/integrations/1c-html-shell/kiosk-runner/IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md`
- `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md`

## Files changed

- `global.json`
- `Directory.Build.props`
- `KioskRunner.slnx`
- `src/KioskRunner.Contracts/`
- `src/KioskRunner.Ports/`
- `src/KioskRunner.Core/`
- `src/KioskRunner.Adapters.FileSystem/`
- `src/KioskRunner.Adapters.Http/`
- `src/KioskRunner.Adapters.Zip/`
- `src/KioskRunner.Adapters.WebServer/`
- `src/KioskRunner.Host.Cli/`
- `src/KioskRunner.Host.Service/`
- `tests/KioskRunner.Tests.Unit/`

## Contracts touched

No real contract model was implemented.

Only empty assembly markers were added to establish project boundaries.

## Ports added

No real port interface was implemented.

The `KioskRunner.Ports` project was created as the dedicated boundary for ports to be introduced in later slices.

## Adapters added

No real adapter implementation was added.

Adapter projects were created only as layer boundaries:

- `KioskRunner.Adapters.FileSystem`
- `KioskRunner.Adapters.Http`
- `KioskRunner.Adapters.Zip`
- `KioskRunner.Adapters.WebServer`

## Tests added

- CLI command catalog tests.
- Project boundary tests for allowed project references.

The tests assert observable Stage 0 behavior:

- the declared CLI command list is available in help text;
- forbidden backend/business command names are absent;
- contracts have no project references;
- ports reference only contracts;
- core references only contracts and ports;
- adapters do not reference core or host layers.

## Commands run

```powershell
dotnet new globaljson --sdk-version 10.0.300 --force
dotnet new sln -n KioskRunner
dotnet new classlib ... --framework net10.0
dotnet new console ... --framework net10.0
dotnet new xunit ... --framework net10.0
dotnet sln KioskRunner.slnx add ...
dotnet add ... reference ...
dotnet build KioskRunner.slnx
dotnet test KioskRunner.slnx
dotnet run --no-build --project src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj -- --help
dotnet sln KioskRunner.slnx list
```

Note: one parallel `dotnet run` attempt collided with a simultaneous build and failed with a temporary DLL write lock. The command was rerun sequentially with `--no-build` and passed.

## Acceptance gate result

Passed.

Evidence:

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test KioskRunner.slnx` passed: 9 tests passed, 0 failed, 0 skipped.
- `dotnet run --no-build --project src/KioskRunner.Host.Cli/KioskRunner.Host.Cli.csproj -- --help` printed the MVP command list.
- `dotnet sln KioskRunner.slnx list` includes all Stage 0 projects.

## Security checks

- No GitHub branch lookup, `git pull`, network update, bundle download, manual JSON upload, business API, cart, payment or fiscal ownership was introduced.
- Core has no direct dependency on HTTP, filesystem, zip, Kestrel, Windows Service APIs or adapters.
- Default CLI command catalog does not include backend/business commands.

## PRD/Blueprint deviations

No deviation from PRD v0.3 or blueprint pack.

Implementation location follows the roadmap structure under `src/KioskRunner.*` and `tests/KioskRunner.Tests.Unit`.

## Open questions

None for Stage 0.

## Next recommended slice

Stage 1. Contracts Baseline.
