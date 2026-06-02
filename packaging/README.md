# KioskRunner MVP

KioskRunner - это локальная Windows-служба для HTML-витрины BOLARS рядом с 1С.

Он скачивает опубликованную production-витрину, проверяет SHA-256, кладёт файлы в локальную папку `current`, запускает локальный web-server и отдаёт витрину по постоянному адресу:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С нужно дать только этот локальный адрес. 1С не должна знать GitHub, manifest, `bundle.zip`, `sha256`, `versions` или `current`.

## Что KioskRunner Не Делает

KioskRunner не заменяет 1С и не является backend-ом.

Он не хранит корзину, оплату, чек, ККТ, маркировку, фискализацию или данные продажи. Он не делает `git pull`, не читает `main`, `dist` или GitHub branch, не принимает ручной JSON и не меняет HTML ↔ 1С bridge.

## Важные Адреса

Пакет раннера:

```text
https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip
```

Production manifest для field trial:

```text
https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
```

Локальный адрес витрины для 1С:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Диагностика на этой же машине:

```text
http://127.0.0.1:8787/healthz
http://127.0.0.1:8787/runner/status
```

## Быстрая Установка

1. Распакуйте `KioskRunner-win-x64.zip` в:

```text
C:\KioskRunner
```

2. Скопируйте `config.example.json` в `config.json`.

Через проводник:

- откройте `C:\KioskRunner`;
- скопируйте `config.example.json`;
- переименуйте копию в `config.json`.

Через PowerShell:

```powershell
Copy-Item -LiteralPath "C:\KioskRunner\config.example.json" -Destination "C:\KioskRunner\config.json"
```

3. Откройте config:

```powershell
notepad "C:\KioskRunner\config.json"
```

4. Проверьте, что в `config.json` есть такая строка:

```json
"registryUrl": "https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json"
```

Для обычного field trial менять её не нужно.

5. Проверьте остальные базовые поля:

```text
showcaseId = bolars
rootDir = C:\KioskShowcases\bolars
webServer.listenHost = 127.0.0.1
webServer.port = 8787
webServer.basePath = /kiosk/bolars/
autoUpdate = true
```

6. Запустите PowerShell от администратора, перейдите в папку раннера и откройте manager:

```powershell
Set-Location -LiteralPath "C:\KioskRunner"
.\manage-kioskrunner.ps1
```

7. В меню выполните по порядку:

```text
[1] Show status
[8] Check registry
[2] Install service
[3] Start service
[6] Update now
[9] Open showcase
```

`Update now` нужен для первой установки витрины. После этого служба сама проверяет обновления по расписанию.

## Что Должно Получиться

После успешной установки:

- служба `KioskRunner-bolars` установлена;
- служба в состоянии `Running`;
- `StartupType = Automatic`;
- `Check registry` видит JSON manifest, а не HTML-страницу;
- `currentVersion` заполнен;
- `servedVersion` совпадает с `currentVersion`;
- `/healthz` отвечает `ok`;
- `/runner/status` отвечает HTTP 200;
- открывается `http://127.0.0.1:8787/kiosk/bolars/`.

## Проверка Сети И DNS

Для скачивания витрины машине нужен HTTPS-доступ к:

```text
kwentin3.github.io
```

Простая проверка:

```powershell
Resolve-DnsName kwentin3.github.io
Invoke-WebRequest -UseBasicParsing -Uri "https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json"
```

Если `Resolve-DnsName` не находит адрес или `Invoke-WebRequest` не получает JSON, проблема не в 1С и не в локальном web-server раннера. Проверьте DNS, прокси, firewall, TLS-inspection или доступ к GitHub Pages.

Локальный адрес `127.0.0.1` не требует внешнего DNS. Он работает только на той Windows-машине, где установлен KioskRunner. Если 1С открывается на другой машине, нужен отдельный сетевой deployment-профиль; не меняйте `listenHost` на `0.0.0.0` без отдельного ops/security-решения.

## Прямые Команды

Показать статус:

```powershell
.\kioskrunner-status.ps1 -ConfigPath .\config.json
```

Проверить manifest и bundle без изменения `current`:

```powershell
.\check-registry.ps1 -ConfigPath .\config.json
```

Установить службу:

```powershell
.\install-service.ps1 -ConfigPath C:\KioskRunner\config.json
```

Запустить, остановить или перезапустить службу:

```powershell
Start-Service -Name KioskRunner-bolars
Stop-Service -Name KioskRunner-bolars
Restart-Service -Name KioskRunner-bolars
```

Выполнить первое обновление напрямую:

```powershell
.\KioskRunner.exe update-once --config C:\KioskRunner\config.json
```

Безопаснее для обычной эксплуатации использовать пункт `[6] Update now` в manager: он остановит службу, выполнит `update-once` и снова запустит службу.

Открыть витрину:

```powershell
.\open-showcase.ps1 -ConfigPath .\config.json
```

Проверить после перезагрузки:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

Удалить только службу:

```powershell
.\uninstall-service.ps1 -ConfigPath .\config.json
```

Удаление службы не удаляет `config.json`, `rootDir`, `current`, `versions` и `logs`.

## Частые Ошибки

| Симптом | Что значит | Что делать |
| --- | --- | --- |
| `updates.example.com` не резолвится | В config остался старый placeholder. | Заменить `registryUrl` на `https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json`. |
| `/healthz` возвращает 503 | Раннер работает, но витрина ещё не установлена или state деградировал. | Выполнить `Check registry`, затем `[6] Update now`; смотреть `/runner/status`. |
| `/runner/status` показывает `degraded/no_current` | Нет локального `currentVersion`. | Установить первую версию через `Update now`. |
| `lastError = manifest_unavailable` | Manifest недоступен по сети. | Проверить DNS/HTTPS-доступ к `kwentin3.github.io`. |
| `sha256_mismatch` | Manifest и bundle не совпали. | Не форсировать установку; проверить публикацию bundle/manifest. |
| Служба не устанавливается | Нет прав администратора или PowerShell policy блокирует скрипты. | Запустить PowerShell от администратора; при необходимости проверить execution policy. |
| Порт `8787` занят | Локальный web-server не может стартовать. | Найти процесс на порту; не менять URL для 1С молча. |

## Что Дать 1С

Дайте 1С только:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Не передавайте 1С ссылки на GitHub, manifest, `bundle.zip`, папки `current`, `versions`, `downloads`, `logs` или `config.json`.

## Безопасность

- Не кладите секреты в `config.example.json`, manifest или bundle.
- Не храните токены, пароли, ключи, данные продажи, телефоны покупателей или фискальные данные в публичных артефактах.
- `webServer.listenHost` должен оставаться `127.0.0.1` для MVP.
- Public/no-auth manifest и bundle допустимы только потому, что не содержат секретов и бизнес-данных 1С.
- SHA-256 проверяет целостность bundle относительно manifest, но не является подписью manifest.
