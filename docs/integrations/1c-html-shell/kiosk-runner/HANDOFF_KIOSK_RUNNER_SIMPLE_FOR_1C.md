# KioskRunner: Простая Инструкция Для 1С И Внедренца

Дата: 2026-05-28  
Статус: field trial handoff  
Аудитория: 1С-программист / внедренец / администратор киоска

## 1. Что Это Такое

KioskRunner - это локальный помощник для запуска HTML-витрины рядом с 1С.

Он ставится на Windows-машину, скачивает готовую витрину из опубликованного GitHub Pages manifest, разворачивает её локально и отдаёт через адрес:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

1С открывает только этот локальный адрес. 1С не нужно знать GitHub, manifest, bundle, `sha256`, `current` или `versions`.

## 2. Что Делает KioskRunner

KioskRunner:

- проверяет, доступна ли опубликованная витрина;
- скачивает `bundle.zip`;
- проверяет SHA-256, чтобы не поставить повреждённый bundle;
- устанавливает локальную версию витрины;
- запускает локальный web-server;
- показывает статус через `/healthz` и `/runner/status`;
- обновляет витрину автоматически, если на GitHub Pages появилась новая production-версия;
- позволяет открыть витрину в браузере;
- позволяет откатиться на предыдущую локальную версию.

## 3. Что KioskRunner Не Делает

KioskRunner:

- не заменяет 1С;
- не хранит корзину;
- не принимает оплату;
- не работает с ККТ;
- не работает с маркировкой;
- не хранит данные продажи;
- не является backend-ом;
- не требует ручной загрузки JSON;
- не читает GitHub branch, `main` или `dist`;
- не делает `git pull`.

1С остаётся владельцем бизнес-логики, корзины, оплаты, чека, ККТ, маркировки и состояния продажи.

## 4. Где Скачать Runner

`KioskRunner-win-x64.zip` скачивается из GitHub Releases проекта:

```text
https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip
```

Страница release:

```text
https://github.com/Kwentin3/kassa/releases/tag/kioskrunner-v0.3.0-fieldtrial
```

Важно: локальная папка `artifacts/` в репозитории не является production-источником для внедренца.

## 5. Быстрый Запуск

1. Скачать `KioskRunner-win-x64.zip` по официальной ссылке из GitHub Release.

2. Распаковать, например:

```text
C:\KioskRunner
```

3. Создать рабочий config-файл.

Это именно копирование файла, а не копирование строки из инструкции:

- откройте папку `C:\KioskRunner` в проводнике;
- найдите файл `config.example.json`;
- скопируйте его в этой же папке;
- переименуйте копию в `config.json`.

Если удобнее через PowerShell, команда такая:

```powershell
Copy-Item -LiteralPath "C:\KioskRunner\config.example.json" -Destination "C:\KioskRunner\config.json"
```

4. Открыть config:

```powershell
notepad "C:\KioskRunner\config.json"
```

5. Проверить основные поля:

```text
registryUrl = https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json
showcaseId = bolars
rootDir
webServer.listenHost = 127.0.0.1
webServer.port = 8787
webServer.basePath = /kiosk/bolars/
autoUpdate = true
```

Если в `registryUrl` указано `https://updates.example.com/...`, это старый placeholder. Его нужно заменить на URL выше.

6. Запустить PowerShell Manager:

```powershell
Set-Location -LiteralPath "C:\KioskRunner"
.\manage-kioskrunner.ps1
```

7. В меню выбрать:

```text
[1] Show status
[8] Check registry
[2] Install service
[3] Start service
[6] Update now
[9] Open showcase
```

`Update now` нужен для первой установки витрины или ручной проверки. После этого служба сама будет проверять обновления по расписанию.

## 6. Как Понять, Что Всё Работает

Признаки успеха:

- служба `KioskRunner-bolars` установлена;
- служба `Running`;
- `StartupType = Automatic`;
- Registry / Manifest доступен;
- `currentVersion` заполнен;
- `servedVersion` совпадает с `currentVersion`;
- `/healthz` отвечает `ok`;
- `/runner/status` отвечает;
- открывается:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

## 7. Что Происходит После Перезагрузки

После перезагрузки Windows служба должна запуститься сама.

Если витрина уже скачана, она должна открываться даже без интернета.

Если интернет есть и на GitHub Pages опубликована новая production-версия, служба сама проверит manifest, скачает новый bundle, проверит SHA-256 и переключит локальную витрину.

Проверка после перезагрузки:

```powershell
.\post-reboot-smoke.ps1 -ConfigPath .\config.json
```

## 8. Что Дать 1С

Дайте 1С только стабильную локальную ссылку:

```text
http://127.0.0.1:8787/kiosk/bolars/
```

Не давайте 1С ссылки на GitHub, manifest, `bundle.zip`, папки `current` или `versions`.

Данные покупки 1С передаёт в HTML через существующий direct JS call / bridge. KioskRunner в этом обмене не участвует.

## 9. Если Что-то Не Работает

| Проблема | Что Проверить |
| --- | --- |
| Страница не открывается | Служба запущена, порт `8787` свободен, `/healthz` отвечает. |
| Обновление не пришло | `Check registry`, правильный `registryUrl`, GitHub Pages cache, `/runner/status`. |
| Ошибка DNS для `updates.example.com` | В config остался placeholder. Поставьте `https://kwentin3.github.io/kassa/showcases/bolars/production/manifest.json`. |
| Ошибка DNS/HTTPS для `kwentin3.github.io` | Проверить доступ к GitHub Pages, DNS, proxy, firewall или TLS-inspection. |
| Ошибка `sha256` | Не форсировать установку. Проверить, что manifest и bundle опубликованы одной версией. |
| Служба не стартует | Открыть logs, проверить `config.json`, запустить PowerShell от администратора. |
| `currentVersion` пустой | Выполнить `Check registry`, затем `Update now` через меню. |
| `servedVersion` не совпадает с `currentVersion` | Перезапустить службу и проверить `/runner/status`. |

## 10. Короткое Правило

```text
1С владеет бизнес-логикой.
HTML рисует экран и общается с 1С через bridge.
KioskRunner скачивает, обновляет и локально отдаёт HTML-витрину.
```
