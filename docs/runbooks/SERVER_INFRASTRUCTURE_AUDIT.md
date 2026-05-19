# Server Infrastructure Audit - kassa.speechbattle.com

Дата: 2026-05-19  
Статус: completed / safe for isolated `kassa-web` deployment  
Цель: read-only проверка перед деплоем `kassa-web`

## Проверенные Факты

- DNS A record: `kassa.speechbattle.com -> 146.19.211.30`.
- SSH доступен только в локальном контуре: `roman@192.168.7.64`.
- TCP порт 22 на внешнем `146.19.211.30` открыт, но SSH banner снаружи недоступен.
- Сервер: Ubuntu.
- Docker: `Docker version 28.5.1`.
- Traefik container: `traefik`.
- Traefik image: `traefik:v3.0`.
- Traefik network: `traefik-net`.
- Docker provider включен в `/home/roman/traefik/traefik.yml`.
- Docker provider network: `traefik-net`.
- Entrypoints: `web` on `:80`, `websecure` on `:443`.
- HTTP redirects to HTTPS through Traefik.
- Certresolver: `letsencrypt`.
- Traefik mounts:
  - `/home/roman/traefik/certs -> /certs`;
  - `/home/roman/traefik/config -> /config`;
  - `/home/roman/traefik/traefik.yml -> /traefik.yml`;
  - `/var/run/docker.sock -> /var/run/docker.sock` read-only.
- Existing compose project convention: `/opt/stacks/<service>` for app services.
- No running `kassa` or `kassa-web` container found.
- No existing `/home/roman/kassa-web` or `/opt/kassa-web` path found.
- GitHub repo `https://github.com/Kwentin3/kassa` на момент проверки не имел remote heads.
- SSH read-only команды не выполнились: подключение зависает на `Connection timed out during banner exchange`.

## Непроверенные Факты Из-За SSH Blocker

Working containers observed:

- `traefik` on `traefik-net`;
- `mcp-prod-app-1` on `traefik-net`;
- `mcp-stage-mcp-1` on `traefik-net` and `postgres-dev_default`;
- `portainer` on `traefik-net`;
- `open-notebook` / `open-notebook-db`;
- `qdrant`;
- `postgres-dev-postgres-1`;
- `github-runner-mcp`.

## Deployment Variables

Текущие безопасные значения:

- `HOST_DOMAIN=kassa.speechbattle.com`
- `DEPLOY_HOST=192.168.7.64`
- `DEPLOY_USER=roman`
- `DEPLOY_PORT=22`
- `DEPLOY_TARGET_PATH=/opt/stacks/kassa-web`
- `TRAEFIK_ENTRYPOINT=websecure`
- `TRAEFIK_NETWORK=traefik-net`
- `TRAEFIK_CERT_RESOLVER=letsencrypt`

## Риски

- Может существовать конфликт router name `kassa` или container name `kassa-web`.
- Перед повторным деплоем нужно снова проверить, что `kassa-web` не занят чужим сервисом.
- Не использовать внешний IP для SSH из локального workspace; использовать `192.168.7.64`.
- Сертификат может не выпуститься, если внешний DNS/80/443 недоступны для Let's Encrypt.

## Что Нельзя Трогать

- Не перезапускать существующий Traefik.
- Не менять Traefik static config.
- Не удалять Docker networks.
- Не останавливать существующие containers.
- Не править чужие compose-файлы.
- Не копировать SSH private keys в repo.

## Следующий Безопасный Шаг

Перед каждым деплоем повторить read-only checks:

```bash
docker ps
docker network ls
docker inspect <traefik-container>
docker inspect <traefik-network>
```

Деплоить только новый compose project в `/opt/stacks/kassa-web` и не менять существующий Traefik.
