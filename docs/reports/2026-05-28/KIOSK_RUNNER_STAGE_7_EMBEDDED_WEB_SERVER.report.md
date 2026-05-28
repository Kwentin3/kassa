# KioskRunner Stage 7 Closeout: Embedded Web Server

Date: 2026-05-28

## Slice name

Stage 7. Embedded Web Server Slice

## Source docs used

- `ROADMAP_KIOSK_RUNNER_MVP_IMPLEMENTATION.md`
- `PRD_KIOSK_RUNNER_NET_v0.3.md`
- `IMPLEMENTATION_READINESS_KIOSK_RUNNER_MVP.md`
- `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md`
- `CONTRACT_KIOSK_RUNNER_CONFIG.md`
- `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md`
- `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md`
- `TEST_MATRIX_KIOSK_RUNNER_MVP.md`

## Files changed

- `src/KioskRunner.Contracts/Validation/KioskRunnerErrorCodes.cs`
- `src/KioskRunner.Ports/WebServer/IWebServerHost.cs`
- `src/KioskRunner.Ports/WebServer/WebServerStartOptions.cs`
- `src/KioskRunner.Ports/WebServer/WebServerStartResult.cs`
- `src/KioskRunner.Adapters.WebServer/KioskRunner.Adapters.WebServer.csproj`
- `src/KioskRunner.Adapters.WebServer/KestrelStaticWebServerAdapter.cs`
- `tests/KioskRunner.Tests.Integration/KioskRunner.Tests.Integration.csproj`
- `tests/KioskRunner.Tests.Integration/KestrelStaticWebServerAdapterTests.cs`
- `KioskRunner.slnx`

## Contracts touched

- Added web server failure error codes:
  - `web_server_failed`
  - `port_in_use`

## Ports added

- `IWebServerHost`
- `WebServerStartOptions`
- `WebServerStartResult`

## Adapters added

- `KestrelStaticWebServerAdapter`

## Tests added

- `KestrelStaticWebServerAdapterTests.CanonicalBasePathServesIndexWithVersionHeaderAndNoStore`
- `KestrelStaticWebServerAdapterTests.AssetGetsMimeTypeCachePolicyAndVersionHeader`
- `KestrelStaticWebServerAdapterTests.ForbiddenPathsAreBlocked`
- `KestrelStaticWebServerAdapterTests.PathTraversalIsBlocked`
- `KestrelStaticWebServerAdapterTests.DirectoryListingIsNotServed`
- `KestrelStaticWebServerAdapterTests.PortConflictReturnsPortInUse`

## Commands run

- `dotnet build KioskRunner.slnx`
- `dotnet test tests/KioskRunner.Tests.Integration/KioskRunner.Tests.Integration.csproj`
- `dotnet test KioskRunner.slnx`
- `rg -n "UseDirectoryBrowser|0\\.0\\.0\\.0|downloads|versions|state\\.json|config\\.json|X-Kiosk-Showcase-Version|PathTraversal|CacheControl" src/KioskRunner.Adapters.WebServer tests/KioskRunner.Tests.Integration -S --glob '!**/obj/**' --glob '!**/bin/**'`

## Acceptance gate result

Passed.

- `dotnet build KioskRunner.slnx` passed with 0 warnings and 0 errors.
- `dotnet test tests/KioskRunner.Tests.Integration/KioskRunner.Tests.Integration.csproj` passed, 6 tests passed.
- `dotnet test KioskRunner.slnx` passed, 63 tests passed.
- Canonical URL base path serves `index.html`.
- Static assets are served with MIME type and long cache policy.
- `index.html` is served with `Cache-Control: no-store`.
- `X-Kiosk-Showcase-Version` is present on served static files.
- Forbidden service paths are blocked.
- Path traversal attempt is blocked using a raw HTTP request.
- Directory listing is not served.
- Port conflict returns a structured startup failure.

## Security checks

- Listener rejects non-loopback hosts through the port contract path.
- No `0.0.0.0` listener is introduced.
- No directory listing middleware is enabled.
- `downloads`, `versions`, `logs`, `state.json`, and `config.json` are not exposed as static content.
- The adapter serves only from configured `current` static root and validates resolved file paths.
- No 1C business API, manual JSON upload, cart, sale, payment, fiscal, scanner or marking behavior was introduced.

## PRD/Blueprint deviations

None.

The Stage 7 status and health endpoints are intentionally minimal. Stage 8 will connect them to the formal health/status provider and no-secret payload contract.

## Open questions

None opened in this slice.

## Next recommended slice

Stage 8. Health / Status Slice.
