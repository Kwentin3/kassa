# KioskRunner MVP Preflight Report

Date: 2026-05-28

## Scope

This report covers the mandatory preflight before starting KioskRunner MVP implementation.

No KioskRunner code was created in this step.

## Documents Found

All required source-of-truth documents are present:

| Document | Status |
| --- | --- |
| `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.3.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/README.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_CONFIG.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_MANIFEST.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_BUNDLE.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/TEST_MATRIX_KIOSK_RUNNER_MVP.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md` | found |
| `docs/integrations/1c-html-shell/kiosk-runner/ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md` | found |

## Repository Structure

The repository is currently a frontend-focused project with existing directories:

- `src/`
- `public/`
- `dist/`
- `dist-1c/`
- `docs/`
- `scripts/`
- `tools/`
- `ops/`

The root also contains Vite/TypeScript files such as `package.json`, `vite.config.ts`, `vitest.config.ts`, and deployment files.

No `.sln`, `.csproj`, `.cs`, `global.json`, `Directory.Build.props`, or `Directory.Packages.props` files were found during preflight.

## Existing KioskRunner Code

No existing KioskRunner implementation code was found.

Search hits for `KioskRunner`, `IManifestClient`, `KestrelStaticWebServerAdapter`, and `kiosk-runner` are documentation-only.

## .NET SDK

Installed SDKs:

- `.NET SDK 9.0.306`
- `.NET SDK 10.0.300`

Installed runtimes include .NET 6, .NET 8, and .NET 9 runtime families.
After installation, .NET 10 runtime families are also available:

- `Microsoft.AspNetCore.App 10.0.8`
- `Microsoft.NETCore.App 10.0.8`
- `Microsoft.WindowsDesktop.App 10.0.8`

Required by approved roadmap:

- `.NET 10 LTS`

Result:

- **Passed:** .NET 10 SDK is available in the current environment.

`dotnet --list-sdks` output:

```text
9.0.306 [C:\Program Files\dotnet\sdk]
10.0.300 [C:\Program Files\dotnet\sdk]
```

`dotnet --info` selected SDK:

```text
Version: 10.0.300
MSBuild version: 18.6.3+caa81fa49
RID: win-x64
Base Path: C:\Program Files\dotnet\sdk\10.0.300\
Host Version: 10.0.8
```

## OS / Runtime Environment

Current environment:

- OS: Microsoft Windows `10.0.17763`
- Architecture: `x64`
- PowerShell: `5.1.17763.7919`
- .NET host architecture: `x64`

Windows-specific implementation and smoke checks are possible in this OS. The earlier .NET 10 SDK blocker has been resolved.

## Smoke Tests Available In Current Environment

The current Windows environment can run:

- solution/project compilation;
- unit tests;
- integration tests that do not require privileged service installation;
- local Kestrel web server smoke tests;
- filesystem update lifecycle tests;
- rollback tests;
- packaging checks;
- partial Windows junction behavior tests, depending on privileges.

## Smoke Tests Pending / Manual

Pending until implementation exists and required permissions are confirmed:

- Windows Service install/start/stop smoke;
- service restart policy validation;
- junction switch smoke if the current user lacks required filesystem privileges;
- first-install smoke using packaged `KioskRunner-win-x64.zip`.

## Business-System Dependencies

No real 1С, acquiring, KKT, fiscalization, scanner, marking, payment terminal, backend, CMS, or business-data integration is required for KioskRunner MVP implementation.

KioskRunner must remain delivery/runtime infrastructure only.

## Blockers Before Stage 0

No blockers remain before Stage 0.

## Decision

Implementation may proceed to Stage 0.

No PRD, blueprint, contract, runbook, security, or test-matrix document was changed.
