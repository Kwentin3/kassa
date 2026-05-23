# BOLARS Adaptive Visual Contract Refine

Дата: 2026-05-23
Статус: documentation refine completed

## Причина

После visual refactor стало видно, что BOLARS MVP хорошо укладывается в portrait `1080x1920`, но не имеет полноценного height-aware landscape contract. В landscape `1366x768` и `1280x800` часть критичных зон уходит ниже viewport: start actions, payment setup CTA, payment waiting details, final countdown.

Проблема не сводится к одному CSS bug. Контракты описывали `1080x1920` как design target и требовали не прибиваться к пикселям, но не задавали математическую модель адаптации, density tiers, landscape profiles и acceptance для low-height WebView/tablet.

## Фактические наблюдения

Проверка публичного route `https://kassa.speechbattle.com/bolars/self-checkout-mvp` показала:

- `1366x768` start: document height около `1481px`; scan/manual action cards начинаются ниже first viewport.
- `1366x768` payment setup: document height около `1636px`; final total and `Оплатить` ниже first viewport.
- `1366x768` payment waiting: document height около `1629px`; payment visual keeps portrait height and pushes lower zones down.
- `1366x768` final success: document height около `1247px`; countdown is below first viewport.
- `1080x1920` portrait: same screens fit without vertical overflow.

## Что изменено

Обновлены документы:

- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`

## Ключевые решения

1. Добавлен Adaptive Viewport Contract.
2. `1080x1920` остаётся portrait reference, но не является единственным layout mode.
3. Введены viewport profiles:
   - `portrait1080`
   - `portraitCompact`
   - `landscapeKiosk`
   - `landscapeCompact`
   - `microFallback`
   - backward-compatible `landscapeFallback`
4. Зафиксирована модель расчёта:
   - `scaleX = viewportWidth / 1080`
   - `scaleY = viewportHeight / 1920`
   - `viewportScale = clamp(min(scaleX, scaleY), minUsableScale, maxUsableScale)`
   - density/media/typography scales may differ but must come from tokens.
5. Зафиксировано, что адаптивность не должна быть слепым уменьшением всего до нечитаемости:
   - touch targets and primary CTAs have minimums;
   - decorative/media/detail zones collapse before primary actions;
   - details may scroll internally;
   - customer-critical actions must not require page scroll in `landscapeCompact`.

## Landscape acceptance

Visual Acceptance Checklist теперь требует проверку:

- `1080x1920`
- `1920x1080`
- `1366x768`
- `1280x800`

Для `1366x768` critical zones должны иметь `offBottom=0`:

- start: scan instruction, scanner cue, scan/manual actions, text-scale/help access;
- cart: search/add scan, row/empty state, payable total, `Перейти к оплате`;
- payment setup: order summary, package/discount access, final total, `Оплатить`;
- payment waiting: amount, card instruction, waiting status, payment visual cue;
- payment error: error context, retry/return;
- final: success mark, thank-you, countdown.

## Что не менялось

- Frontend code не менялся.
- Runtime business logic не менялась.
- MockAdapter/PreviewAdapter/OneCInterfaceAdapter не менялись.
- Product scope не расширялся.
- Честный знак, ККТ/fiscalization, media delivery and real payment internals не проектировались.

## Следующий шаг

Следующий UI refactor должен идти против новых adaptive acceptance criteria:

1. добавить adaptive layout tokens/CSS variables;
2. реализовать `landscapeCompact` composition per screen;
3. снять clean screenshots and metrics for `1366x768`, `1280x800`, `1920x1080`, `1080x1920`;
4. доказать, что critical zones do not fall below viewport.
