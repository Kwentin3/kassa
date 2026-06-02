# Security: KioskRunner Public MVP And Hardening

Дата: 2026-05-28  
Статус: draft  
Source of truth: `../PRD_KIOSK_RUNNER_NET_v0.3.md`

## 1. MVP Security Model

MVP allows public/no-auth access to:

- `KioskRunner-win-x64.zip`;
- production `manifest.json`;
- immutable `bundle.zip`.

This is acceptable only because these artifacts contain no secrets, no 1С business data and no personal/fiscal/payment data.

## 2. Why Public MVP Is Acceptable

- Bundle is static UI shell.
- Bundle contains no 1С database data.
- Bundle contains no cart, receipt, fiscalization, marking or payment state.
- Runner listens on `127.0.0.1` by default.
- Runner does not expose 1С API.
- Runner is not a backend.
- Runner does not accept business commands.
- Runner does not accept manual JSON upload/import.

## 3. MVP Risks

| Risk | Meaning |
| --- | --- |
| Public runner download | Anyone can download the binary package. |
| Public bundle download | Anyone can copy the visual shell. |
| Public manifest | Anyone can inspect version and bundle URL. |
| No manifest signature | If attacker controls manifest and bundle, `sha256` alone does not protect trust. |
| Misconfigured listener | Opening `0.0.0.0` can expose local static/status endpoints. |

## 4. Hard Requirements

- No secrets in manifest.
- No secrets in bundle.
- No tokens in `config.example.json`.
- No 1С business data in bundle/status/logs.
- No internal 1С object references.
- No directory listing.
- No publication of `downloads`, `versions`, `logs`, `state.json`, `config.json`.
- No public/no-auth mode for transmitting 1С data.
- No listener on `0.0.0.0` without explicit ops decision.

## 5. SHA-256 vs Signed Manifest

`sha256` verifies:

```text
downloaded bundle.zip == bundle expected by manifest
```

`sha256` does not verify:

```text
manifest is trusted
publisher is legitimate
bundle is licensed for this tenant
```

MVP trust is based on trusted `registryUrl`. Production hardening should add signed manifest and/or signed bundle.

## 6. Localhost-Only

Default listener:

```text
127.0.0.1:8787
```

Do not expose externally just because artifacts are public. External exposure needs a separate ops/security decision, firewall review and likely auth/TLS strategy.

## 7. Future Hardening

Future phases:

- private registry;
- token-based download;
- signed manifest;
- signed bundle;
- signed `KioskRunner.exe`;
- tenant/license binding;
- registry domain allowlist;
- central update server;
- mTLS or enterprise TLS policy if external listener becomes required;
- centralized config distribution with secret handling.

## 8. Security Acceptance

- Status endpoint has no secrets and no business data.
- Path traversal is blocked.
- Forbidden paths are blocked.
- Public manifest/bundle contain no secrets.
- `config.example.json` contains only public non-secret defaults/placeholders.
- Runner does not implement business API.
