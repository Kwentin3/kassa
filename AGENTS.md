# Agent Sticky Notes

Будь прагматичен, лаконичен, консервативен. Если увидишь здравое зерно, не закапывай его.

Перед продолжением работы по этому репозиторию прочитай:

- `docs/infra-ops/STICKY_CONTEXT.md`
- `docs/reports/2026-05-19/GAP_CLOSURE_VERIFICATION.report.md`
- `docs/runbooks/DEPLOYMENT_RUNBOOK.md`

Коротко:

- Это frontend-only MVP кассы самообслуживания, вся бизнес-логика mock-only.
- Не подключать real backend/1C/payment/SBP/KKT/fiscalization/CMS/update-flow без отдельной задачи.
- Демо-домен: `https://kassa.speechbattle.com`.
- SSH для деплоя из локального контура: `roman@192.168.7.64`.
- Не читать и не печатать реальные `.env` / `.env.deploy`; они gitignored.
- Не менять существующий Traefik и чужие контейнеры.
