# Handoff: KioskRunner For 1С Implementer

Дата: 2026-05-28  
Статус: draft  
Аудитория: 1С-программист / внедренец

## 0. Короткая инструкция для внедренца

Если нужно просто поднять локальную витрину через службу, используйте короткий документ:

[HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md](HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md)

Он объясняет, где взять `KioskRunner-win-x64.zip`, как запустить `manage-kioskrunner.ps1`, как установить службу, как проверить статус и какую ссылку передать в 1С.

Официальный пакет для field trial:

```text
https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip
```

## 1. Какой URL открывать

Открывайте стабильный URL витрины:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Можно использовать:

```text
http://localhost:8787/kiosk/bolars/
```

если `localhost` корректно работает в вашей среде.

## 1.1. Как проверить через PowerShell Manager

Для внедренца без .NET GUI используется PowerShell Manager из папки KioskRunner:

```powershell
.\manage-kioskrunner.ps1
```

Перед передачей ссылки в 1С проверьте в меню:

```text
[1] Show status
[8] Check registry
[3] Start service
[6] Update now
[9] Open showcase
```

Минимально должно быть:

- service installed;
- service running;
- registry/manifest reachable;
- `currentVersion` заполнен;
- `servedVersion` совпадает с `currentVersion`;
- `http://127.0.0.1:8787/kiosk/bolars/` открывается в браузере.

После перезагрузки Windows можно проверить:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

## 2. Что делает KioskRunner

KioskRunner - это маленькая локальная служба на Windows. Она отдаёт только HTML-витрину из текущей папки `current`.

Он:

- скачивает опубликованную витрину с GitHub Pages через production manifest;
- скачивает static bundle;
- проверяет, что bundle не повреждён, через `sha256`;
- разворачивает витрину локально;
- отдаёт HTML по stable localhost URL;
- стартует после перезагрузки Windows как служба, если установлен через `install-service.ps1`;
- сам проверяет GitHub Pages manifest и подтягивает новую production-версию, если она опубликована.

Для 1С-программиста важна только стабильная ссылка локальной витрины:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

GitHub, manifest, `bundle.zip`, `sha256`, `current` и `versions` - это внутренняя механика доставки.

## 3. Что KioskRunner не делает

KioskRunner:

- не является backend 1С;
- не принимает бизнес-команды;
- не хранит корзину;
- не хранит чек;
- не хранит оплату;
- не работает с маркировкой;
- не работает с ККТ/фискализацией;
- не заменяет HTML ↔ 1С bridge;
- не принимает ручной JSON upload/import.

## 4. Что 1С не нужно знать

1С не нужно знать:

- GitHub;
- manifest;
- `bundle.zip`;
- `sha256`;
- `current`;
- `versions`;
- rollback;
- runner internal folders.

1С знает только stable URL.

## 5. Как 1С передаёт данные

1С передаёт данные в HTML через direct JS call / bridge, например через API HTML-страницы.

Для BOLARS это относится к `window.BolarsSelfCheckout` и существующим Web ↔ 1С JSON/snapshot contracts.

Runner в этом обмене не участвует. Он только отдаёт static HTML.

## 6. Почему нельзя ручной JSON upload

Ручная загрузка JSON запрещена, потому что:

- 1С должна оставаться владельцем данных;
- ручной JSON создаёт ложный production path;
- можно загрузить устаревшие или чужие данные;
- это обходит bridge-контракт.

## 7. Диагностика

Для администратора доступны локальные endpoints:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

Они не являются частью кассового бизнес-процесса. Не используйте их для корзины, оплаты или чека.

Если страница не открывается:

1. Откройте `manage-kioskrunner.ps1`.
2. Проверьте, установлена ли служба.
3. Проверьте, запущена ли служба.
4. Проверьте `Check registry` / Registry Manifest.
5. Проверьте `currentVersion` и `servedVersion`.
6. Откройте `/healthz`.
7. Откройте `/runner/status`.
8. Откройте logs folder.

## 8. Короткое правило

```text
1С владеет бизнес-логикой.
HTML рисует экран и общается с 1С через bridge.
KioskRunner только доставляет и отдаёт HTML.
```
