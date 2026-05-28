# KioskRunner Repo Hygiene Preflight

Дата: 2026-05-28
Статус: PASSED_FOR_CLASSIFICATION

## Scope

Цель проверки - закрыть KioskRunner epic release без потери документов, без случайного коммита локальных артефактов и без разрушительной работы с ветками.

Проверки выполнены в рабочей папке:

`d:\Users\Roman\Desktop\Проекты\Витрина`

## Git State

Current branch:

`mvp/self-checkout-web-ui`

Remote:

`origin https://github.com/Kwentin3/kassa`

Remote HEAD:

`mvp/self-checkout-web-ui`

Current HEAD:

`f3afdfb Add BOLARS showcase GitHub publication pipeline`

Branch relation:

`mvp/self-checkout-web-ui` is aligned with `origin/mvp/self-checkout-web-ui` before local KioskRunner release cleanup commits.

Worktrees:

Only one canonical worktree is present.

## Modified Files

Tracked modified files:

- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`
- `src/bolars/BolarsSelfCheckoutApp.tsx`
- `src/bolars/__tests__/bolarsApp.test.tsx`

Classification:

- safe to commit after verification;
- belongs to KioskRunner handoff/debug entrypoint closeout;
- should be committed separately from build artifacts.

## Untracked Files

Untracked source/configuration files:

- `Directory.Build.props`
- `KioskRunner.slnx`
- `global.json`
- `src/KioskRunner.*`
- `tests/`
- `packaging/`

Classification:

- safe to commit after tests;
- represents KioskRunner MVP source, tests, packaging scripts and safe config template;
- must be checked for generated output and secrets before commit.

Untracked KioskRunner documentation:

- `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.1.md`
- `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.2.md`
- `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.3.md`
- `docs/integrations/1c-html-shell/kiosk-runner/*.md`

Classification:

- safe to commit;
- contains PRD, blueprints, contracts, runbooks, handoffs, release pipeline docs and security/test docs;
- should not be deleted or collapsed into a single document.

Untracked reports:

- `docs/reports/2026-05-28/*.report.md`
- `docs/reports/2026-05-28/KIOSK_RUNNER_MVP_PROGRESS.md`

Classification:

- safe to commit as epic audit trail;
- large but intentional because the KioskRunner MVP was implemented slice-by-slice with closeout reports.

Untracked generated artifacts:

- `artifacts/kiosk-runner/*`
- `artifacts/showcases/*`
- `artifacts/github-pages-showcase-publication*`
- `artifacts/showcase-github-publication-smoke/*`
- `artifacts/showcase-github-remote-fieldtrial/*`
- `artifacts/kioskrunner-powershell-manager-smoke/*`
- `artifacts/kioskrunner-service-autoupdate-*`
- other temporary smoke and negative-test folders under `artifacts/`

Classification:

- do not commit;
- local build/smoke output only;
- `artifacts/kiosk-runner/KioskRunner-win-x64.zip` is a release upload source, not a git-tracked file.

## Artifact And Secret Hygiene

Release candidate artifact found:

`artifacts/kiosk-runner/KioskRunner-win-x64.zip`

Observed SHA-256 before final rebuild:

`DD6E6F54340A09EA2B848673F5FC33F056D4A8F1FFCA74D6874DE754F3EB0705`

Zip contents observed:

- `KioskRunner.exe`
- `config.example.json`
- `install-service.ps1`
- `uninstall-service.ps1`
- `kioskrunner-common.ps1`
- `kioskrunner-status.ps1`
- `check-registry.ps1`
- `open-showcase.ps1`
- `post-reboot-smoke.ps1`
- `manage-kioskrunner.ps1`
- `README.md`

Forbidden paths found only in local ignored/smoke context:

- root `.env` exists locally and is already ignored;
- negative-test `.env` samples exist under `artifacts/`;
- smoke `config.json` and `state.json` files exist under `artifacts/`.

No tracked non-example secret/config candidate was found outside ignored/generated paths.

## Branch Audit Snapshot

Local branches:

- `mvp/self-checkout-web-ui`

Merged local branches:

- `mvp/self-checkout-web-ui`

No unmerged local branches were reported.

Remote branches:

- `origin/mvp/self-checkout-web-ui`

Branch cleanup recommendation:

- no local branch deletion is needed;
- no remote branch deletion is needed;
- no squash/force-push is recommended;
- use normal commits on the current branch and push.

## Files Safe To Commit

Safe after verification:

- KioskRunner source projects under `src/KioskRunner.*`;
- KioskRunner tests under `tests/`;
- solution/build metadata: `KioskRunner.slnx`, `Directory.Build.props`, `global.json`;
- packaging scripts and `packaging/config.example.json`;
- KioskRunner PRD/blueprint/contract/runbook/security/test/handoff docs;
- KioskRunner reports under `docs/reports/2026-05-28/`;
- BOLARS debug handoff link changes.

## Files Safe To Ignore Or Keep Local

Keep local and ignore:

- entire `artifacts/` tree;
- smoke config/state/log/current/versions/downloads under `artifacts/`;
- release zip after uploading to GitHub Release;
- local `.env` and `.env.deploy`.

Do not delete automatically:

- `artifacts/kiosk-runner/KioskRunner-win-x64.zip` until GitHub Release upload is complete;
- smoke artifacts that are still useful as audit evidence for reports.

## Maintainer Decisions Needed

No destructive branch cleanup decision is needed.

Release publication decision:

- use tag `kioskrunner-v0.3.0-fieldtrial`;
- publish `KioskRunner-win-x64.zip` as a GitHub Release asset;
- update handoff and README with the official GitHub Release URL after publication.

## Gate Result

Stage 0 gate: PASSED.

The working tree is dirty but classified. Generated artifacts are understood and must be ignored, not committed. There is one canonical branch/worktree and no branch-collapse blocker.
