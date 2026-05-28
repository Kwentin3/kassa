# KioskRunner Blueprint Pack

Дата: 2026-05-28  
Статус: draft blueprint pack  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## Назначение

Эта папка содержит blueprint-домен для реализации KioskRunner MVP. Документы не реализуют runner и не меняют PRD, HTML bridge или 1С-контракты.

Канон:

```text
KioskRunner = updater + local storage + embedded static web server + health/status + rollback + bootstrap/distribution.
```

Runner читает `registryUrl` из локального `config.json`, получает production manifest, скачивает immutable `bundle.zip`, проверяет `sha256`, распаковывает bundle, переключает `current` и отдаёт `current` через localhost web server.

## For Implementers / Quick Entrypoints

Для 1С-программиста и внедренца начинайте с короткой инструкции:

- Runner package: `https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip`
- [HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md](HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md) - простой запуск KioskRunner через PowerShell Manager и стабильный URL для 1С.
- [HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md](HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md) - границы KioskRunner относительно 1С и HTML bridge.
- [RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md](RUNBOOK_KIOSK_RUNNER_POWERSHELL_MANAGER_MVP.md) - подробный ops-runbook для `manage-kioskrunner.ps1` и service scripts.
- [RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md](RUNBOOK_SHOWCASE_GITHUB_PUBLICATION_FIELD_TRIAL.md) - как публикуется showcase bundle через GitHub Pages.

## Документы

| Документ | Назначение | Основные зависимости |
| --- | --- | --- |
| `BLUEPRINT_KIOSK_RUNNER_ARCHITECTURE.md` | Целевая техническая архитектура и границы компонентов. | PRD v0.3, все contracts. |
| `CONTRACT_KIOSK_RUNNER_CONFIG.md` | `config.json` и `config.example.json`. | Architecture, install runbook. |
| `CONTRACT_KIOSK_RUNNER_MANIFEST.md` | Production manifest. | Update lifecycle, publishing runbook. |
| `CONTRACT_KIOSK_RUNNER_BUNDLE.md` | `bundle.zip` requirements. | Manifest, web server, update lifecycle. |
| `CONTRACT_KIOSK_RUNNER_STATE_AND_STATUS.md` | `state.json`, `/healthz`, `/runner/status`. | Update, web server, recovery. |
| `BLUEPRINT_KIOSK_RUNNER_UPDATE_LIFECYCLE.md` | `update-once` and service update loop. | Config, manifest, bundle, state. |
| `BLUEPRINT_KIOSK_RUNNER_WEB_SERVER.md` | Embedded static web server. | Config, state/status, bundle. |
| `BLUEPRINT_KIOSK_RUNNER_WINDOWS_SERVICE.md` | Windows Service and CLI lifecycle. | Config, update, web server. |
| `BLUEPRINT_KIOSK_RUNNER_ROLLBACK_AND_RECOVERY.md` | Rollback, recovery and failure playbooks. | State/status, update lifecycle. |
| `RUNBOOK_KIOSK_RUNNER_FIRST_INSTALL_WINDOWS.md` | First install for implementer/admin. | Config, service, web server. |
| `RUNBOOK_KIOSK_RUNNER_RELEASE_PUBLISHING.md` | Runner and showcase release publishing. | Manifest, bundle, security. |
| `SECURITY_KIOSK_RUNNER_PUBLIC_MVP_AND_HARDENING.md` | Public/no-auth MVP and future hardening. | All network/artifact contracts. |
| `TEST_MATRIX_KIOSK_RUNNER_MVP.md` | MVP verification matrix. | All contracts and blueprints. |
| `HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md` | Simple field-trial entrypoint for 1С implementer/admin. | PowerShell Manager, service smoke. |
| `HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md` | Short handoff for 1С implementer. | PRD v0.3, web server, bridge docs. |

## Development Order

1. Freeze contracts: config, manifest, bundle, state/status.
2. Implement bootstrap validation and `update-once`.
3. Implement local storage layout and idempotent state updates.
4. Implement embedded web server with health/status and static serving security.
5. Implement Windows Service lifecycle.
6. Implement rollback and recovery commands.
7. Package runner artifact with `config.example.json` and install scripts.
8. Validate with MVP test matrix.

## MVP Canon Decisions

- One Windows Service per showcase for MVP. Multi-showcase runner is future work.
- Recommended embedded server stack: .NET Generic Host / Worker Service with ASP.NET Core Kestrel for localhost static serving and diagnostics.
- Default listener: `127.0.0.1:8787`.
- Default `basePath`: `/kiosk/{showcaseId}/`.
- `registryUrl` points to production manifest only, not GitHub branch, `main`, `dist`, or source repo.
- Logs are JSON Lines for machine diagnostics, with optional console/plain summary for CLI.
- Public/no-auth artifact download is allowed for MVP only because artifacts contain no secrets or 1С business data.

## Open Canon Decisions

- Exact .NET LTS version.
- Official runner release location: dedicated repo, monorepo release area, or external release bucket.
- Windows install format after MVP: zip, MSI, or exe installer.
- Final `current` switch mechanism on Windows: directory replace, junction pointer, or copy-to-current strategy.
- Served version detection for stale cache diagnostics.
- Centralized config management for many kiosks.
