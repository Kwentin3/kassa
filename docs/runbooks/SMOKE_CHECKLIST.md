# Smoke Checklist - Self-Checkout Terminal MVP

## Domain / HTTPS

- [ ] `https://kassa.speechbattle.com` opens.
- [ ] Certificate is valid.
- [ ] No mixed content warnings in DevTools.
- [ ] SPA refresh works on current URL.

## Core Demo

- [ ] Idle screen displays branded terminal.
- [ ] Start purchase opens cart.
- [ ] Product can be added by mock input code `4600001000011`.
- [ ] Cart shows item, quantity, line sum and total.
- [ ] Manual search finds `молоко`.
- [ ] Catalog adds one product.
- [ ] Card mock success transitions to receipt.
- [ ] Mock receipt shows id, items, total and QR placeholder.
- [ ] Done resets to idle.

## Scanner / Android

- [ ] Camera tab is visible.
- [ ] Android Chrome shows camera permission prompt.
- [ ] Permission denied or camera error shows fallback text.
- [ ] Mock input fallback works.
- [ ] Keyboard scanner mode accepts code + Enter.

## Extended Demo

- [ ] Payment declined scenario shows retry options.
- [ ] Receipt failure routes to help/staff.
- [ ] Help button opens `Сотрудник уже идёт`.
- [ ] Demo PIN `0000` opens staff mode.
- [ ] Staff can reset session.
- [ ] Quick branding changes brand/theme.
- [ ] Idle promo appears only without active session.
- [ ] Broken promo asset falls back to default idle.
- [ ] Demo Control Panel is marked `DEMO / Настройка прототипа`.
- [ ] Demo Control Panel is disabled/read-only during `payment_pending`.

## Non-Goals

- [ ] No card data inputs exist.
- [ ] No real bank/SBP request is made.
- [ ] No real fiscalization/KKT/OFD request is made.
- [ ] No real 1C/backend integration exists.
- [ ] No secrets are present in browser build.
