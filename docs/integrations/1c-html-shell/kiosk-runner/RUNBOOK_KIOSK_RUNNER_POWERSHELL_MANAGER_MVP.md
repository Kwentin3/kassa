# Runbook: KioskRunner PowerShell Manager MVP

Дата: 2026-05-28  
Статус: MVP ops runbook

## 1. Цель

PowerShell Manager MVP закрывает базовый UX внедренца без .NET GUI.

Он помогает:

- посмотреть состояние KioskRunner;
- установить Windows Service;
- запустить/остановить/перезапустить службу;
- проверить GitHub/static registry;
- безопасно выполнить update now;
- выполнить rollback;
- открыть витрину;
- открыть health/status/logs/config;
- проверить состояние после перезагрузки.

Скрипты не реализуют update lifecycle сами. Update lifecycle остаётся внутри `KioskRunner.exe`.

## 2. Файлы

В пакете должны лежать:

```text
KioskRunner.exe
config.example.json
install-service.ps1
uninstall-service.ps1
manage-kioskrunner.ps1
kioskrunner-status.ps1
check-registry.ps1
open-showcase.ps1
post-reboot-smoke.ps1
kioskrunner-common.ps1
README.md
```

## 3. Quick Start

1. Распаковать пакет, например:

```text
C:\KioskRunner
```

2. Скопировать config:

```powershell
Copy-Item .\config.example.json .\config.json
```

3. Отредактировать:

```powershell
notepad .\config.json
```

Минимально проверить:

- `registryUrl`;
- `showcaseId`;
- `rootDir`;
- `webServer.listenHost`;
- `webServer.port`;
- `webServer.basePath`.

4. Запустить Manager:

```powershell
.\manage-kioskrunner.ps1
```

5. В меню выполнить:

```text
[1] Show status
[8] Check registry
[2] Install service
[3] Start service
[6] Update now
[9] Open showcase
```

## 4. Install Service

Через меню:

```text
[2] Install service
```

Или напрямую:

```powershell
.\install-service.ps1 -ConfigPath .\config.json
```

Ожидаемо:

- service name: `KioskRunner-bolars`;
- startup type: `Automatic`;
- binary path содержит `KioskRunner.exe service --config <config.json>`;
- recovery policy пытается перезапустить service после сбоя.

Install не должен менять `config.json` и не должен удалять `current`, `versions`, `logs`.

## 5. Start / Stop / Restart

Через меню:

```text
[3] Start service
[4] Stop service
[5] Restart service
```

После start проверить:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Stop требует подтверждение, потому что локальная витрина может стать недоступной.

## 6. Status

Через меню:

```text
[1] Show status
```

Или напрямую:

```powershell
.\kioskrunner-status.ps1 -ConfigPath .\config.json
```

Status показывает:

- serviceName;
- installed / not installed;
- running / stopped;
- startup type;
- service PathName;
- config path;
- registryUrl;
- rootDir;
- local showcase URL;
- `/healthz` status;
- `/runner/status` status;
- currentVersion;
- servedVersion;
- lastUpdateStatus;
- lastError;
- lastSuccessfulUpdateAt.

## 7. Check Registry

Через меню:

```text
[8] Check registry
```

Или напрямую:

```powershell
.\check-registry.ps1 -ConfigPath .\config.json
```

Скрипт:

- читает `registryUrl`;
- скачивает manifest;
- проверяет, что ответ JSON, а не HTML;
- показывает `showcaseId`, `channel`, `status`, `version`, `bundleUrl`, `sha256`, `minRunnerVersion`, `buildCommit`;
- проверяет доступность `bundleUrl` через HEAD/минимальный GET;
- не скачивает bundle полностью;
- не меняет `current`.

Важно: это диагностический скрипт. Он не заменяет validation logic KioskRunner.

## 8. Update Now

Через меню:

```text
[6] Update now
```

Бюджетный safe mode:

```text
stop service -> KioskRunner.exe update-once --config config.json -> start service -> status
```

Причина: текущий update lock внутри service process. Отдельный CLI `update-once` теоретически может пересечься с scheduled update. Поэтому Manager останавливает службу перед manual update.

Future hardening:

```text
rootDir-scoped inter-process update/rollback lock
```

## 9. Rollback

Через меню:

```text
[7] Rollback
```

Скрипт требует подтверждение.

Safe mode:

```text
stop service -> KioskRunner.exe rollback --config config.json -> start service -> status
```

Если `previousVersion` отсутствует, runner должен вернуть понятную ошибку. Это не должно удалять текущую витрину.

## 10. Open Showcase

Через меню:

```text
[9] Open showcase
```

Или напрямую:

```powershell
.\open-showcase.ps1 -ConfigPath .\config.json
```

Открывается:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Если service не запущен, страница может быть недоступна.

## 11. Logs / Config / Diagnostics

Меню:

```text
[10] Open health
[11] Open runner status
[12] Open logs folder
[13] Open config file
```

Diagnostics endpoints:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

## 12. Post-Reboot Smoke

После перезагрузки Windows:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

Проверяет:

- service installed;
- startup type `Automatic`;
- state `Running`;
- `/healthz`;
- `/runner/status`;
- currentVersion present;
- servedVersion equals currentVersion.

Если реальная перезагрузка недоступна, допустимый lab smoke:

```text
Restart-Service KioskRunner-bolars
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

## 13. Uninstall

Через меню:

```text
[14] Uninstall service
```

Или напрямую:

```powershell
.\uninstall-service.ps1 -ConfigPath .\config.json
```

Без `-Force` скрипт требует подтверждение.

Uninstall удаляет только Windows Service. Он не удаляет:

- `config.json`;
- `rootDir`;
- `current`;
- `versions`;
- `logs`.

## 14. Troubleshooting

Service is not installed:

- выполнить `[2] Install service`;
- убедиться, что PowerShell запущен от администратора.

Service is stopped:

- выполнить `[3] Start service`;
- проверить `/healthz`.

Registry unavailable:

- выполнить `[8] Check registry`;
- проверить интернет и `registryUrl`;
- старая установленная витрина должна продолжать открываться, если `current` уже есть.

Showcase does not open:

- выполнить `[1] Show status`;
- проверить service running;
- проверить port `8787`;
- открыть `/healthz`;
- открыть `/runner/status`;
- открыть logs folder.

Update failed:

- смотреть `lastError`;
- выполнить `Check registry`;
- старая версия должна остаться в `current`.

## 15. Boundaries

PowerShell Manager не добавляет:

- .NET GUI;
- вторую службу;
- Task Scheduler как основной механизм;
- update-server;
- telemetry;
- auth/private registry;
- 1С dependency;
- HTML ↔ 1С bridge changes.

Runner по-прежнему не читает branch/main/dist и не делает `git pull`.
