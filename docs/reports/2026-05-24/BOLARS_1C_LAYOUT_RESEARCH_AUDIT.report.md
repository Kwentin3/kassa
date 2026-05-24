# BOLARS 1C Layout Research Audit

Дата: 2026-05-24
Статус: audit complete, implementation not changed

## 1. Scope

Задача: проверить, почему 1C-safe витрина визуально расходится с ожидаемой адаптивной моделью, с учётом фактического V8WebKit runtime capability contract.

Этот audit не подключает реальную 1С, оплату, РМК, ККТ, фискализацию, backend или маркировку. Это research-аудит layout/runtime compatibility.

Внешний ресерч не использовался: для текущей проблемы достаточно локального evidence, потому что у проекта уже есть фактический browser capability contract из диагностического прогона 1C/V8WebKit.

## 2. Inputs

- `docs/integrations/1c-html-shell/runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `src/bolars/BolarsSelfCheckoutApp.tsx`
- `src/bolars/runtime/types.ts`
- `src/bolars/runtime/defaults.ts`
- `src/styles/index.css`
- Screenshot from 1C browser showing cart screen rendered with side gutters and heavy visual drift.
- Browser metric check of public 1C artifact.

## 3. Executive Finding

Проблема не доказывает, что 1С не умеет fullscreen или что адаптивная математическая модель неверная.

Более точный диагноз: 1C artifact сейчас не получает отдельный 1C layout identity. Он наследует web/tablet stage framing and modern CSS assumptions. Поэтому адаптивность работает внутри ограниченного stage, но сам stage выбран как desktop/tablet preview, а не как host-fill 1C runtime surface.

Иными словами:

- 1С может отдать весь экран HTML-полю;
- наша страница всё равно может сказать: "мой stage максимум 1366px и стоит по центру";
- внутри этих 1366px часть адаптивности работает;
- но для 1C fullscreen это уже неверная исходная геометрия.

## 4. Capability Contract vs Current Dependencies

| Area | 1C/V8WebKit contract | Current implementation | Audit result |
| --- | --- | --- | --- |
| Host viewport | Diagnostic viewport `1628 x 823`, host should be treated as HTML field. | `.bolars-stage` uses `width: min(100%, var(--bolars-stage-max))`; landscape sets `--bolars-stage-max: 1366px`. | Fails 1C host-fill requirement; creates gutters. |
| CSS Grid | Supported, but critical layout zones need fallback / no fragile dependency. | Cart row uses fixed dense grid columns; summary uses fixed multi-column grid. | Risky for long RU names, text-scale and V8WebKit differences. |
| `position: sticky` | Must not be used as mandatory dependency. | JSX uses class `sticky`; Tailwind emits `.sticky{position:sticky}` in the 1C artifact. | Direct contract violation for critical CTA. |
| Viewport units | Visual docs require fallback; 1C contract does not prove `100dvh` as reliable. | Root/stage/work/cart use `100dvh` and `calc(100dvh - ...)`. | Risky inside host field; needs host-first/`100vh` fallback. |
| Shadows/effects | `box-shadow` supported but do not overload; heavy effects are risky. | Many critical surfaces use heavy shadows and `color-mix`. | Explains heavy/blurred visual impression in 1C. |
| Pointer/touch | `PointerEvent = false`, `maxTouchPoints = 0` in diagnostic run. | Search outside-close uses `pointerdown`. | Interaction risk for custom keyboard dismissal. |
| Delivery | Single-file classic script, no external JS/CSS/fetch. | 1C artifact already targets single-file legacy-safe delivery. | Boot problem mostly solved; layout remains. |

## 5. Measured Evidence

Public artifact measured in Chromium against:

`https://kassa.speechbattle.com/bolars/self-checkout-mvp-1c.html?debug=1&preview=1`

Debug/preview panels were hidden for measurements.

Key result:

| Viewport | Scenario | Stage x | Stage width | Left gutter | Right gutter |
| --- | --- | ---: | ---: | ---: | ---: |
| `1628x823` | `cartOneItem` | `131` | `1366` | `131` | `131` |
| `1628x823` | `startIdle` | `131` | `1366` | `131` | `131` |
| `1628x823` | `finalSuccess` | `131` | `1366` | `131` | `131` |
| `1366x768` | `cartOneItem` | `0` | `1366` | `0` | `0` |
| `1280x800` | `cartOneItem` | `0` | `1280` | `0` | `0` |

Interpretation:

- The screenshot gutters are reproducible from CSS alone at the diagnostic 1C viewport width.
- This is not evidence of 1C refusing fullscreen. It is evidence that our page caps the stage.
- At exactly `1366px` width the problem disappears because viewport equals stage cap.
- On a fullscreen `1920x1080` 1C host, the same rule would likely create even wider side gutters unless overridden.

## 6. Findings

### P0. 1C runtime has no explicit layout identity in the root DOM

`BolarsSelfCheckoutApp` renders root classes for text scale, screen and theme, but not for adapter/embed runtime. There is no class like `bolars-runtime-onec`, `bolars-embed-onec` or `bolars-profile-embeddedOneC`.

Effect: CSS cannot reliably choose host-fill behavior only for 1C without also changing the normal web route.

Required direction: root DOM must expose presentation identity derived from route/runtime, not business state. This is UI concern, not backend/1C logic.

### P0. Stage max-width leaks from web preview into 1C runtime

Current CSS:

- base `--bolars-stage-max: 1080px`;
- landscape compact `--bolars-stage-max: 1366px`;
- `.bolars-stage { width: min(100%, var(--bolars-stage-max)); margin: 0 auto; }`.

This is useful for desktop demo framing, but wrong for 1C fullscreen host. 1C route needs `width: 100%`, no decorative centering, no white gutters.

### P0. `sticky` class is an actual Tailwind sticky dependency

In JSX the payment CTA has:

```tsx
className="bolars-primary-action sticky"
```

The local CSS block `.bolars-primary-action.sticky` only adds width/margin, but because Tailwind is imported, the generated 1C artifact contains:

```css
.sticky{position:sticky}
```

This explains why computed style shows `position: sticky` even though the local BOLARS CSS does not explicitly set it. For 1C this is a direct mismatch with the runtime capability contract.

Required direction: rename this role to a semantic class such as `bolars-action-rail-primary` or override/remove sticky for 1C. Better: remove the `sticky` utility from customer-critical CTA completely.

### P0. Runtime viewport profile contract drifted from implementation types

Updated visual contracts now require profiles like:

- `landscapeKiosk`;
- `landscapeCompact`;
- `embeddedOneC`;
- `microFallback`.

Current runtime type still exposes a smaller/older set:

```ts
viewportProfile: 'portrait1080' | 'portraitCompact' | 'landscapeFallback';
```

Default snapshot still starts as `portrait1080`.

Effect: the declared adaptive math exists in docs, but implementation cannot represent the new 1C profile as state/config. This is likely the deeper reason the 1C artifact falls back to generic CSS media behavior.

### P1. Cart layout is dense and grid-fragile for V8WebKit

Cart row uses a five-zone fixed grid:

```css
grid-template-columns: 150px minmax(0, 1fr) 230px 150px 64px;
```

Landscape compact changes values, but the model remains a dense fixed-column layout. This is acceptable in modern Chromium if the exact viewport is known, but it is not conservative enough for 1C/V8WebKit with long Russian names and large text scale.

Required direction: for `embeddedOneC`, use a safer two-zone row:

- left: thumbnail + product identity;
- right: quantity, price, delete;
- clamp/wrap product names inside content zone;
- avoid letting text expand columns.

### P1. Height/overflow depends too much on `100dvh`

Critical containers use `100dvh`:

- `.bolars-root`;
- `.bolars-stage`;
- `.bolars-work-screen`;
- `.bolars-cart-layout`;
- landscape overrides.

This worked in Chromium visual smoke, but the 1C contract does not prove `100dvh` as reliable. In embedded browser fields, the safer model is host/container height first, then `100vh`, then `100dvh` as enhancement.

### P1. Visual effects are above the conservative V8WebKit baseline

The 1C contract says shadows are supported, but should not overload the screen. It does not prove `color-mix` as a critical primitive.

Current CSS uses `color-mix` and heavy shadows for:

- button surfaces;
- card shadows;
- row changed state;
- scan/search cards;
- summary band;
- payment/final effects.

This matches the screenshot symptom: the page loads, but shadows and surfaces look heavier/less controlled than in Chrome.

Required direction: add static 1C token fallback for critical colors and reduce elevation under `embeddedOneC`.

### P2. Pointer events are not guaranteed in 1C diagnostic profile

Diagnostic profile reports:

- `PointerEvent = false`;
- `ontouchstart = false`;
- `maxTouchPoints = 0`.

Current search keyboard outside-close listens to `pointerdown`. This is not the main layout bug, but it can affect keyboard dismissal and perceived brokenness in 1C.

Required direction: for 1C-safe UI interactions, prefer `click`/keyboard events and avoid pointer/touch-only control paths.

### P2. Debug overlay can distort manual judgment

`debug=1` is useful for integration, but fixed debug overlays must not be part of visual acceptance. The customer screenshots/metrics should either hide debug or use clean route/snapshot fixtures.

## 7. Root Cause Model

The root cause is not "1C cannot render adaptive UI".

The root cause is:

1. We solved boot/runtime compatibility first.
2. The 1C artifact now loads.
3. The loaded app still uses web/tablet presentation defaults.
4. The app has no explicit 1C layout profile in root classes or viewport config.
5. Therefore desktop framing, `sticky`, `100dvh`, dense grid and heavy effects leak into 1C runtime.

This is a profile selection and visual fallback problem, not a business logic problem.

## 8. Recommended Implementation Slice

Keep this narrow. Do not rewrite the flow.

### Slice A: Add 1C presentation identity

- Derive `isOneCEmbedded` from route/artifact/adapter context.
- Add root class, for example:
  - `bolars-runtime-onec`;
  - `bolars-embed-onec`;
  - `bolars-profile-embeddedOneC`.
- Extend `viewportProfile` type to include the profiles declared in contracts.
- Default 1C artifact to `embeddedOneC` unless runtime snapshot explicitly overrides it.

### Slice B: Host-fill stage for 1C only

Under `.bolars-embed-onec`:

- set stage width to `100%`;
- remove auto-centering gutters;
- remove decorative stage shadow;
- use host/container height first with `100vh` fallback;
- keep normal web route unchanged.

Acceptance: at `1628x823`, stage width must be `1628`, x must be `0`, left/right gutters must be `0`.

### Slice C: Remove sticky dependency

- Rename/remove class `sticky` from critical CTA.
- Ensure generated 1C artifact does not contain a required `.sticky{position:sticky}` path for customer CTA.
- Put summary/CTA into reserved layout zone: bottom rail, right rail or inline summary.

### Slice D: Simplify cart/payment critical layouts for 1C

- Use safer cart row layout for `embeddedOneC`.
- Keep quantity controls, price and delete visible.
- Keep total and `Перейти к оплате` visible.
- Keep order review scroll internal in payment setup.
- Do not let detail zones push primary actions below viewport.

### Slice E: V8WebKit visual fallback

- Add static fallback values for critical colors before/alongside `color-mix`.
- Reduce shadows in `embeddedOneC`.
- Prefer border/light elevation for separation.
- Keep focus/disabled/pressed states visible.

### Slice F: 1C-specific visual smoke

Automate metrics for `/bolars/self-checkout-mvp-1c.html`:

- viewports: `1628x823`, `1366x768`, `1280x800`, `1920x1080`, `1080x1920`;
- screens: start, cart empty, cart one item, cart many items, text scale extra large, payment setup, payment waiting, payment error, final success;
- assertions:
  - stage gutters zero for 1C profile;
  - no horizontal scroll;
  - critical zones `offBottom = 0`;
  - no customer-critical `position: sticky`;
  - debug overlay hidden or ignored in visual metrics.

## 9. Acceptance Gates

Minimum gates before considering the 1C layout fixed:

- `npm run typecheck`
- `npm run test:run`
- `npm run build`
- 1C artifact verifier still passes: no `?.`, `??`, module runtime, external JS/CSS, `/assets/`, mandatory `fetch`.
- New 1C layout smoke passes at `1628x823`, `1366x768`, `1280x800`.
- Manual 1C screenshot confirms no side gutters and no visual clipping.

## 10. Open Questions For 1C Team

These are useful but not blockers for the first fix:

- What exact fullscreen HTML field size does 1C expose on the target terminal: `1920x1080`, `1366x768`, `1628x823`, or another size?
- Does the fullscreen mode include any 1C chrome, message pane, taskbar or safe area?
- Does the target terminal have touch input, or is interaction scanner/mouse/keyboard driven?
- Should debug panel be available on the terminal, or only in a separate diagnostics route?

## 11. Recommendation

Proceed with a targeted 1C layout refactor.

Do not discard the adaptive model. The model is directionally correct. The implementation needs a missing runtime presentation profile:

```text
web/demo route        -> tablet-like centered stage is allowed
1C embedded route     -> host-fill stage, no sticky, conservative V8WebKit layout
```

This should be treated as a profile isolation task, not as a redesign and not as a backend/1C integration task.
