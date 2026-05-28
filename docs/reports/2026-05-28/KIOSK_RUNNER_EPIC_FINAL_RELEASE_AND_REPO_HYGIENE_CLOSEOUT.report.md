# KioskRunner Epic Final Release And Repo Hygiene Closeout

Дата: 2026-05-28
Статус: EPIC_READY_FOR_FIELD_TRIAL

## Scope

Закрыт KioskRunner epic release:

- классифицировано рабочее дерево;
- локальные build/smoke artifacts отделены от git history;
- KioskRunner source, packaging, docs и handoff/debug entrypoint закоммичены;
- `KioskRunner-win-x64.zip` опубликован как GitHub Release asset;
- официальный release URL внесён в handoff и README;
- выполнены финальные проверки.

Новая функциональность не добавлялась.

## Release

Release tag:

`kioskrunner-v0.3.0-fieldtrial`

Release URL:

`https://github.com/Kwentin3/kassa/releases/tag/kioskrunner-v0.3.0-fieldtrial`

Artifact:

`KioskRunner-win-x64.zip`

Artifact URL:

`https://github.com/Kwentin3/kassa/releases/download/kioskrunner-v0.3.0-fieldtrial/KioskRunner-win-x64.zip`

Target commit:

`c9d8a5f71fad15ab57972a132df46ac5ed9f0cf2`

Artifact SHA-256:

`BE19B0E2634E3ADFC5FCFBADA5F8E84AB1854FB728948DAD4EB7AB2F460A9345`

GitHub asset digest:

`sha256:be19b0e2634e3adfc5fcfbada5f8e84ab1854fb728948dad4eb7ab2f460a9345`

Release creation note:

- first `gh release create` attempt used a short SHA and GitHub rejected it with `Release.target_commitish is invalid`;
- release was then created successfully with the full target commit SHA.

## Package Audit

Zip contents:

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

Forbidden package entries checked and not found:

- `config.json`;
- `.env`, `.env.local`, `.env.deploy`;
- `*.pem`, `*.pfx`, `*.key`;
- `logs`;
- `current`;
- `versions`;
- `downloads`;
- business data.

Release package was rebuilt from the committed source tree and current `packaging/README.md`.

## Commits Created

Commits pushed to `origin/mvp/self-checkout-web-ui`:

- `873a4b8 chore: ignore generated KioskRunner artifacts`
- `2af0060 feat: add KioskRunner MVP runtime`
- `441f348 feat: add KioskRunner PowerShell manager packaging`
- `a21f254 docs: add KioskRunner release documentation`
- `c9d8a5f docs: add KioskRunner handoff debug entrypoint`

Final closeout report commit is created after release publication.

## Files Changed

Major groups:

- `.gitignore`;
- `KioskRunner.slnx`, `Directory.Build.props`, `global.json`;
- `src/KioskRunner.*`;
- `tests/KioskRunner.*`;
- `packaging/*`;
- `docs/integrations/1c-html-shell/PRD_KIOSK_RUNNER_NET_v0.*.md`;
- `docs/integrations/1c-html-shell/kiosk-runner/*.md`;
- `docs/reports/2026-05-28/*.report.md`;
- `docs/integrations/BOLARS_1C_PROGRAMMER_HANDOFF.md`;
- `src/bolars/BolarsSelfCheckoutApp.tsx`;
- `src/bolars/__tests__/bolarsApp.test.tsx`.

Generated outputs not committed:

- `artifacts/`;
- `.NET bin/obj`;
- local smoke `config.json`, `state.json`, `logs`, `current`, `versions`, `downloads`.

## Docs Updated

Official release URL is now present in:

- `docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md`;
- `docs/integrations/1c-html-shell/kiosk-runner/HANDOFF_KIOSK_RUNNER_1C_IMPLEMENTER.md`;
- `docs/integrations/1c-html-shell/kiosk-runner/README.md`;
- `packaging/README.md`.

No production handoff points to local `artifacts/` as the download source.

## Debug Entrypoint

BOLARS debug panel status:

- existing `1C handoff` link preserved;
- new `KioskRunner local launch` link points to `HANDOFF_KIOSK_RUNNER_SIMPLE_FOR_1C.md`;
- targeted BOLARS test confirms the link is rendered.

No 1С bridge contract was changed.

## Tests And Checks Run

Shell:

Windows PowerShell in `d:\Users\Roman\Desktop\Проекты\Витрина`.

Commands:

- `git status --short --branch` - clean before final closeout report;
- `git worktree list` - one canonical worktree;
- `git branch -vv` - one local branch, tracking origin;
- `git branch --merged` - current branch only;
- `git branch --no-merged` - none;
- `git remote show origin` - `mvp/self-checkout-web-ui` is remote HEAD;
- `dotnet --list-sdks` - includes `10.0.300`;
- `dotnet --info` - .NET SDK `10.0.300`, runtime `10.0.8`, OS `win-x64`;
- `dotnet build KioskRunner.slnx` - passed, 0 warnings, 0 errors;
- `dotnet test KioskRunner.slnx` - passed, 85 tests total;
- `npm run typecheck` - passed;
- `npx vitest run src/bolars/__tests__/bolarsApp.test.tsx --exclude artifacts/**` - passed, 17 tests;
- `git diff --check` - passed.

Test integrity note:

- one `dotnet test` attempt failed because it was run in parallel with `dotnet build`, and both processes wrote to the same `.NET obj` output file;
- this was an execution lock conflict, not a test assertion failure;
- `dotnet test KioskRunner.slnx` was rerun alone and passed.

## Branch Audit Summary

Current branch:

`mvp/self-checkout-web-ui`

Remote:

`origin/mvp/self-checkout-web-ui`

Local branches:

- `mvp/self-checkout-web-ui`

Remote branches:

- `origin/mvp/self-checkout-web-ui`

Merged local branches:

- `mvp/self-checkout-web-ui`

Unmerged local branches:

- none.

Branch consolidation recommendation:

- no local branch cleanup is needed;
- no remote branch deletion is recommended;
- no squash or force-push is recommended;
- keep normal history on `mvp/self-checkout-web-ui`.

## Repo Hygiene

`.gitignore` now covers:

- `artifacts/`;
- `.NET **/bin/`;
- `.NET **/obj/`.

Root `.env` remains ignored and was not read or printed.

Tracked file scan outside ignored/generated folders showed only safe example env templates:

- `.env.example`;
- `.env.deploy.example`;
- `.env.secrets.example`.

## Remaining TODO

No release URL TODO remains in KioskRunner handoff/docs.

Future work remains intentionally out of MVP:

- .NET GUI Manager;
- private registry/auth;
- signed manifest/bundle;
- signed runner;
- tenant/license binding;
- central config/fleet management;
- update-server/dashboard/telemetry.

## Blockers

None.

## Final Recommendation

`EPIC_READY_FOR_FIELD_TRIAL`

KioskRunner field-trial release is published, docs point to the official GitHub Release asset, repo hygiene is controlled, and the branch is ready for review/merge without committing local artifacts.
