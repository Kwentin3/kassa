# BOLARS Theme and Tokens Contract

Статус: draft 0.4
Дата: 2026-05-24
Назначение: контракт тем, цветовых профилей и адаптивных дизайн-токенов для кассы самообслуживания БОЛАРС.

## 1. Принцип

Компоненты не должны хардкодить цвета, размеры, тени, радиусы и brand-specific значения. Компоненты используют semantic tokens. Тема БОЛАРС является управляемым набором токенов, который runtime/config выбирает через `themeProfile`.

Если появится официальный брендбук БОЛАРС, значения меняются в конфигурации темы, а не в UI-компонентах.

## Related Documents

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - каноническое upstream ТЗ.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - продуктовая рамка MVP.
- `docs/AGENT_START_HERE.md` - implementation handoff и первый срез.
- `docs/README.md` - индекс документации и порядок чтения.
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` - визуальные инварианты.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - active `themeProfile` и `uiConfig` в state snapshot.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - token/theme acceptance criteria.
- `docs/integrations/1c-html-shell/runtime-profiles/1C_HTML_SHELL_RUNTIME_CAPABILITY_CONTRACT_V8WEBKIT.md` - 1C/V8WebKit runtime constraints.

## 2. Theme Profiles

Минимально предусмотреть по опорному ТЗ:

| Profile | Назначение |
| --- | --- |
| `bolars-light-default` | `Bolars Light / БОЛАРС Светлая`; базовая тема MVP. |
| `bolars-light-contrast` | `Bolars Contrast / БОЛАРС Контрастная`; профиль повышенной читаемости. |
| `bolars-light-clean` | `Bolars Clean / БОЛАРС Чистая`; спокойный рабочий профиль с меньшей промо-насыщенностью. |
| `bolars-light-promo` | `Bolars Promo / БОЛАРС Промо`; профиль с более активным промо-фоном и brand accents. |
| `bolars-light-magenta-soft` | `Bolars Magenta Soft / БОЛАРС Мягкая магента`; белый фон, лёгкий magenta tint для кнопок, полей и контейнеров, тёмно-сливовый контрастный текст. |
| `custom` | `Custom / Пользовательская`; будущий профиль для ручной настройки цветов. |
| `bolars-dark-optional` | Архитектурная возможность тёмной темы, не обязательна для MVP. |

Для текущего prototype MVP реализованы selectable light-профили: `bolars-light-default`, `bolars-light-contrast`, `bolars-light-clean`, `bolars-light-promo`, `bolars-light-magenta-soft`. `custom` и `bolars-dark-optional` остаются reserved architecture, а не обязательным customer scope.

Implementation agent не должен тратить первый срез на dark/custom theme UI или production theme editor. Нужно только token-driven foundation, где HEX живут в theme/profile config, а компоненты обращаются к semantic tokens.

## 2.1. Route Theme Override

Для dev/demo/acceptance допускается безопасный URL override активного профиля:

```text
/bolars/self-checkout-mvp?theme=bolars-light-contrast
/bolars/self-checkout-mvp?debug=1&preview=1&theme=bolars-light-promo
/bolars/self-checkout-mvp?debug=1&preview=1&themeProfile=bolars-light-clean
/bolars/self-checkout-mvp?debug=1&preview=1&theme=bolars-light-magenta-soft
```

Правила:

- `theme` и `themeProfile` являются alias-параметрами; если указаны оба, `themeProfile` имеет приоритет.
- Разрешены только selectable profiles: `bolars-light-default`, `bolars-light-contrast`, `bolars-light-clean`, `bolars-light-promo`, `bolars-light-magenta-soft`.
- Reserved значения (`custom`, `bolars-dark-optional`) и неизвестные значения должны безопасно fallback-иться на `bolars-light-default` с debug warning.
- URL override задаёт initial `themeProfile` в runtime context и snapshot. UI всё равно применяет только tokens из snapshot, а не читает query params напрямую.
- Production theme admin, dark theme UI и ручной custom editor не входят в MVP.

## 3. Рабочая Палитра БОЛАРС

Эти HEX-значения допустимы только внутри theme/profile config. Компоненты не обращаются к ним напрямую.

| Palette key | Value |
| --- | --- |
| `bolarsMagenta` | `#E6007E` |
| `bolarsDarkMagenta` | `#A9005F` |
| `logoBlack` | `#111111` |
| `white` | `#FFFFFF` |
| `lightBackground` | `#F6F6F6` |
| `surfaceWhite` | `#FFFFFF` |
| `borderGray` | `#DADADA` |
| `textPrimary` | `#1A1A1A` |
| `textSecondary` | `#666666` |
| `bolarsCyan` | `#00A6C8` |
| `successGreen` | `#25A64A` |
| `promoLime` | `#C9E600` |
| `warningOrange` | `#F5A623` |
| `errorRed` | `#D93025` |

## 4. Обязательные Цветовые Токены

Semantic tokens:

- `color.bg.app`
- `color.bg.texture`
- `color.bg.header`
- `color.bg.surface`
- `color.bg.surfaceMuted`
- `color.bg.overlay`
- `color.text.primary`
- `color.text.secondary`
- `color.text.inverse`
- `color.text.brand`
- `color.text.success`
- `color.text.warning`
- `color.text.error`
- `color.border.default`
- `color.border.strong`
- `color.border.focus`
- `color.brand.primary`
- `color.brand.primaryStrong`
- `color.brand.onPrimary`
- `color.scan.primary`
- `color.scan.background`
- `color.cta.pay.bg`
- `color.cta.pay.fg`
- `color.cta.pay.pressedBg`
- `color.cta.cancel.border`
- `color.cta.cancel.fg`
- `color.delete.fg`
- `color.success.bg`
- `color.success.fg`
- `color.warning.bg`
- `color.warning.fg`
- `color.error.bg`
- `color.error.fg`
- `color.discount.bg`
- `color.discount.fg`
- `color.manager.bg`
- `color.manager.fg`
- `color.final.countdownTrack`
- `color.final.countdownFill`
- `color.summary.totalFg`
- `color.summary.countFg`
- `color.help.bg`
- `color.help.icon`
- `color.receipt.bg`
- `color.receipt.perforation`
- `color.productImage.bg`
- `color.productImage.placeholderFg`

## 5. Типографические Токены

- `font.family.base`
- `font.weight.regular`
- `font.weight.medium`
- `font.weight.semibold`
- `font.weight.bold`
- `font.size.caption`
- `font.size.body`
- `font.size.bodyLarge`
- `font.size.productName`
- `font.size.sectionTitle`
- `font.size.screenTitle`
- `font.size.hero`
- `font.size.total`
- `font.size.button`
- `font.lineHeight.tight`
- `font.lineHeight.normal`
- `font.lineHeight.relaxed`
- `font.textScale.normal.multiplier`
- `font.textScale.large.multiplier`
- `font.textScale.extraLarge.multiplier`

Правило: header-only text-scale control показывает три контрастные буквы `A` разного размера. `normal/large/extraLarge` меняют semantic scale multipliers для start hero, товарных строк, quantity, totals, CTA, payment/status copy и modal/numpad copy, но не ломают grid, row height и CTA height. Если текст не помещается, компонент обязан иметь overflow/wrap contract.

## 6. Spacing Tokens

- `space.0`
- `space.1`
- `space.2`
- `space.3`
- `space.4`
- `space.5`
- `space.6`
- `space.8`
- `space.10`
- `space.12`
- `space.16`
- `space.20`
- `space.screen.gutter`
- `space.screen.sectionGap`
- `space.card.padding`
- `space.row.gap`
- `space.actionRail.bottom`
- `space.touch.gap`

Recommended base for `1080x1920`: gutters `32-48px`, section gap `24-32px`, card padding `24-32px`.

## 7. Radius Tokens

- `radius.none`
- `radius.xs`
- `radius.sm`
- `radius.md`
- `radius.lg`
- `radius.xl`
- `radius.card`
- `radius.header`
- `radius.button`
- `radius.input`
- `radius.modal`
- `radius.pill`

Эскизы используют крупные radii, но token должен позволять сделать будущие клиентские профили более строгими без переписывания компонентов.

## 8. Shadow / Elevation Tokens

- `shadow.none`
- `shadow.surface`
- `shadow.card`
- `shadow.cardStrong`
- `shadow.header`
- `shadow.actionRail`
- `shadow.modal`
- `shadow.focus`
- `shadow.successGlow`
- `shadow.scanGlow`
- `shadow.pressed`

Fallback для слабого WebView: заменить heavy shadows на `border + light shadow`.

### 8.1 Button Surface Tokens

Кнопочные поверхности управляются отдельной централизованной token group. Компонент выбирает semantic role, а не подбирает локально фон, тень и pressed effect.

Roles:

- `button.primary`
- `button.secondary`
- `button.danger`
- `button.icon`
- `button.quantity`
- `button.keypad`
- `button.package`
- `button.searchResult`
- `button.help`
- `button.headerSecondary`

Для каждой роли должны быть определены semantic values:

- `bg`
- `fg`
- `border`
- `shadow`
- `texture`
- `hover.bg`
- `hover.shadow`
- `hover.transform`
- `pressed.bg`
- `pressed.shadow`
- `pressed.transform`
- `focus.ring`
- `disabled.bg`
- `disabled.fg`
- `disabled.border`
- `disabled.shadow`
- `disabled.opacity`

Правила:

- `button.*.bg` в normal state должен быть контрастнее родительской поверхности; border-only button без отличающейся заливки не допускается для customer-facing actions.
- `button.primary` имеет самый сильный surface signal; `button.secondary` и вспомогательные роли остаются заметными, но не спорят с primary CTA.
- `button.headerSecondary` оптимизирован для тёмной шапки и не обязан совпадать со светлыми secondary actions.
- `button.texture` допускается только как лёгкая фактура surface, не как носитель смысла и не вместо contrast/focus/disabled states.
- `pressed.transform` и `hover.transform` являются state tokens; при reduced motion они отключаются, но `bg`, `shadow`, `focus` и `disabled` остаются различимыми.
- Missing token for any customer-facing button role must fail development/test before visual acceptance.

## 9. Токены Состояний

- `state.focus.ringColor`
- `state.focus.ringWidth`
- `state.focus.offset`
- `state.disabled.opacity`
- `state.busy.opacity`
- `state.pressed.transform`
- `state.pressed.durationMs`
- `state.highlight.durationMs`
- `state.highlight.bg`
- `state.highlight.border`
- `state.error.bg`
- `state.error.border`
- `state.warning.bg`
- `state.warning.border`
- `state.success.bg`
- `state.success.border`

## 10. Scanner Hint Tokens

- `scanner.corner.color`
- `scanner.corner.width`
- `scanner.corner.length`
- `scanner.glow.color`
- `scanner.line.color`
- `scanner.line.height`
- `scanner.icon.color`
- `scanner.hint.bg`
- `scanner.hint.border`
- `scanner.hint.text`

Cyan должен считываться как scanner/search/payment guidance, а не как primary CTA.

## 11. Manager Badge Tokens

- `manager.badge.bg`
- `manager.badge.fg`
- `manager.badge.icon`
- `manager.badge.border`
- `manager.badge.radius`
- `manager.badge.height`

Manager badge отображается только из `managerState`, не из локального UI-флага.

## 12. Discount Tokens

- `discount.icon.color`
- `discount.input.border`
- `discount.input.focusBorder`
- `discount.applied.bg`
- `discount.applied.fg`
- `discount.applied.icon`
- `discount.notFound.bg`
- `discount.notFound.fg`
- `discount.amount.fg`

Скидка не должна визуально спорить с итоговой суммой и payment CTA.

## 13. Final Screen Tokens

- `final.successMark.bg`
- `final.successMark.fg`
- `final.successMark.glow`
- `final.receipt.bg`
- `final.receipt.shadow`
- `final.countdown.bg`
- `final.countdown.track`
- `final.countdown.fill`
- `final.confetti.colorPrimary`
- `final.confetti.colorMuted`

Конфетти должно быть статичным или очень коротким; при reduced motion отключается.

## 14. Reference Fidelity Token Groups

Следующий visual refactor должен добавлять недостающую похожесть на эскизы через tokens, а не через component-local CSS constants.

### 14.1 Header / Clock Tokens

- `header.brand.height`
- `header.work.height`
- `header.bg`
- `header.logo.fg`
- `header.logo.accent`
- `header.clock.icon`
- `header.clock.text`
- `header.clock.separator`
- `header.radius.bottom`
- `header.shadow`

`brandHeader` используется на start/payment waiting/final. `workHeader` используется на cart/payment setup.

### 14.2 Product Image Slot Tokens

- `productImage.slot.width`
- `productImage.slot.height`
- `productImage.slot.bg`
- `productImage.slot.radius`
- `productImage.slot.fit`
- `productImage.placeholder.bg`
- `productImage.placeholder.fg`
- `productImage.placeholder.icon`

Даже если media delivery paused, product row anatomy сохраняет image slot. Placeholder является visual fallback, а не изменением product scope.

### 14.3 Bottom Summary / Sticky CTA Tokens

- `summary.band.bg`
- `summary.band.border`
- `summary.band.radius`
- `summary.band.shadow`
- `summary.band.height`
- `summary.total.fg`
- `summary.total.fontSize`
- `summary.count.icon`
- `summary.count.fg`
- `summary.cta.height`
- `summary.cta.radius`

Cart portrait pattern использует bottom summary band: item count, total, green payment CTA. Desktop/right rail может быть fallback для отличающегося viewport, но не должен стать основным portrait contract.

### 14.4 Scan Action / Scanner Visual Tokens

- `scanAction.card.bg`
- `scanAction.card.border`
- `scanAction.card.radius`
- `scanAction.card.shadow`
- `scanAction.icon.bg`
- `scanAction.icon.fg`
- `scanner.barcode.fg`
- `scanner.corner.glow`
- `scanner.centerLine.color`

Scan action card используется на start и cart as continuation hint. Cyan остаётся scanner/search/payment guidance; magenta остаётся brand/barcode accent.

### 14.5 Payment Visual Tokens

- `paymentVisual.frame.cornerColor`
- `paymentVisual.frame.glow`
- `paymentVisual.terminal.bg`
- `paymentVisual.card.bg`
- `paymentVisual.phone.bg`
- `paymentVisual.status.infoFg`
- `paymentVisual.status.spinnerFg`
- `paymentVisual.orderPreview.bg`

Если bitmap illustration недоступна, implementation использует tokenized vector/CSS fallback, но зона оплаты не исчезает.

### 14.6 Receipt / Countdown Tokens

- `receipt.bg`
- `receipt.logo.fg`
- `receipt.text.primary`
- `receipt.text.secondary`
- `receipt.total.fg`
- `receipt.shadow`
- `receipt.perforation.bg`
- `countdown.card.bg`
- `countdown.ring.track`
- `countdown.ring.fill`
- `countdown.progress.track`
- `countdown.progress.fill`

Финальный экран должен иметь receipt preview и countdown card. Это visual confirmation, не юридически значимая фискализация.

### 14.7 Help Card Tokens

- `help.card.bg`
- `help.card.border`
- `help.card.radius`
- `help.card.shadow`
- `help.icon.bg`
- `help.icon.fg`
- `help.chevron.fg`

Help card является отдельной zone и не конкурирует с payment CTA.

## 15. Adaptive Layout and Scale Tokens

Размеры интерфейса не должны жить как fixed portrait constants внутри компонентов. Базовые значения темы задаются для `1080x1920`, а фактические values вычисляются через viewport profile and density multipliers.

### 15.1 Required Adaptive Token Groups

- `viewport.base.width`
- `viewport.base.height`
- `viewport.profile`
- `viewport.scale.x`
- `viewport.scale.y`
- `viewport.scale.ui`
- `viewport.scale.density`
- `viewport.safeArea.top`
- `viewport.safeArea.right`
- `viewport.safeArea.bottom`
- `viewport.safeArea.left`
- `viewport.host.width`
- `viewport.host.height`
- `viewport.embed.mode`
- `viewport.embed.runtime`
- `density.profile`
- `density.minUsableScale`
- `density.maxUsableScale`
- `density.compactSpacingMultiplier`
- `density.compactMediaMultiplier`
- `density.compactTypographyMultiplier`
- `density.landscapeHeaderMultiplier`
- `density.landscapeCardMultiplier`
- `density.landscapeMediaMultiplier`

### 15.2 Component Size Tokens

The implementation should express component dimensions through tokens that can be scaled per profile:

- `layout.stage.maxWidth`
- `layout.stage.embeddedMaxWidth`
- `layout.stage.widthMode`
- `layout.stage.minHeight`
- `layout.stage.heightMode`
- `layout.header.brand.height`
- `layout.header.work.height`
- `layout.header.compactHeight`
- `layout.body.gutter`
- `layout.body.sectionGap`
- `layout.card.padding`
- `layout.card.compactPadding`
- `layout.touch.primaryMinHeight`
- `layout.touch.secondaryMinHeight`
- `layout.touch.quantityButtonSize`
- `layout.start.scanner.width`
- `layout.start.scanner.height`
- `layout.start.actionCard.height`
- `layout.cart.row.height`
- `layout.cart.summary.height`
- `layout.cart.summary.mode`
- `layout.cart.row.columnProfile`
- `layout.payment.visual.height`
- `layout.final.successMark.size`
- `layout.final.receipt.maxHeight`
- `layout.final.countdown.height`

`layout.touch.*` values may shrink less aggressively than media/spacing tokens. A small landscape viewport must not produce unusable `+`, `-`, quantity, package or payment buttons.

### 15.3 Scaling Rules

- Typography uses `font.size.* * font.textScale.*.multiplier * viewport.scale.typography`, with min/max clamps per semantic role.
- Spacing uses `space.* * viewport.scale.density`, with stronger compression in `landscapeCompact`.
- Media/illustration zones use `layout.* * viewport.scale.media`, and collapse before touch targets.
- Primary CTA height is clamped: base target `96-112px`, compact minimum `64-72px`.
- Secondary touch target compact minimum is `48-56px`.
- `brandHeader` compact height should be tokenized separately; it must not keep portrait `180-210px` height in `landscapeCompact`.
- Shadow and radius can reduce in compact profiles to preserve density and performance.
- 1C embedded profile uses `layout.stage.widthMode = "host-fill"`; desktop centered max-width is not inherited.
- 1C embedded profile uses `layout.stage.heightMode = "host-first"`; `100dvh` is a fallback, not the only sizing primitive.
- 1C embedded profile must provide static token values for critical colors/shadows so the UI does not depend on `color-mix` rendering.
- 1C embedded profile must express CTA/summary placement as a reserved layout zone (`bottomRail`, `rightRail` or `inlineSummary`), not as `position: sticky`.

### 15.4 Profile-Specific Behavior

| Profile | Token behavior |
| --- | --- |
| `portrait1080` | Base tokens, full reference anatomy. |
| `portraitCompact` | Reduced gutters/gaps/media; primary CTA and header preserved. |
| `landscapeKiosk` | Wide/two-column layout, moderate vertical compression. |
| `landscapeCompact` | Strong header/media/spacing compression, two-column where useful, primary action visible without page scroll. |
| `embeddedOneC` | Host-fill stage, V8WebKit-safe effects, no sticky dependency, critical zones visible in the 1C HTML field. |
| `microFallback` | Critical-path tokens only; decorative/details collapse. |

### 15.5 Example Adaptive Token Shape

```json
{
  "viewport": {
    "base": { "width": 1080, "height": 1920 },
    "profiles": {
      "portrait1080": { "density": 1, "media": 1, "typography": 1 },
      "landscapeCompact": { "density": 0.56, "media": 0.46, "typography": 0.82 },
      "embeddedOneC": {
        "density": 0.58,
        "media": 0.42,
        "typography": 0.84,
        "widthMode": "host-fill",
        "heightMode": "host-first",
        "effects": "v8webkit-light"
      }
    }
  },
  "layout": {
    "stage": {
      "maxWidth": 1366,
      "embeddedMaxWidth": "none",
      "widthMode": "host-fill",
      "heightMode": "host-first"
    },
    "header": {
      "brand": { "height": 200, "compactHeight": 104 },
      "work": { "height": 144, "compactHeight": 88 }
    },
    "touch": {
      "primaryMinHeight": 72,
      "secondaryMinHeight": 52,
      "quantityButtonSize": 52
    },
    "payment": {
      "visualHeight": 520,
      "visualCompactHeight": 220
    },
    "cart": {
      "summary": { "mode": "bottomRail" },
      "row": { "columnProfile": "v8webkit-safe" }
    }
  }
}
```

Example numbers are contract guidance, not component-local constants. Real implementation may express them as CSS custom properties, TypeScript theme object or validated JSON, but components consume resolved semantic tokens only.

## 16. High Contrast Profile

`bolars-light-contrast` обязан:

- усилить contrast text/surface/header;
- усилить border для cards/inputs/buttons;
- убрать слишком слабые pale backgrounds;
- сохранить brand recognition через magenta;
- не использовать цвет как единственный носитель состояния;
- иметь видимый focus ring на black, white, green и magenta surfaces.

## 17. Theme Config Contract

Пример JSON-структуры. В реальной реализации это может быть TypeScript object, JSON или YAML, но форма должна быть валидируемой.

```json
{
  "id": "bolars-light-default",
  "brand": "bolars",
  "version": "0.1",
  "palette": {
    "bolarsMagenta": "#E6007E",
    "bolarsDarkMagenta": "#A9005F",
    "logoBlack": "#111111",
    "white": "#FFFFFF",
    "lightBackground": "#F6F6F6",
    "surfaceWhite": "#FFFFFF",
    "borderGray": "#DADADA",
    "textPrimary": "#1A1A1A",
    "textSecondary": "#666666",
    "bolarsCyan": "#00A6C8",
    "successGreen": "#25A64A",
    "promoLime": "#C9E600",
    "warningOrange": "#F5A623",
    "errorRed": "#D93025"
  },
  "tokens": {
    "color": {
      "bg": {
        "app": "{palette.lightBackground}",
        "header": "{palette.logoBlack}",
        "surface": "{palette.surfaceWhite}",
        "overlay": "rgba(17,17,17,0.48)"
      },
      "text": {
        "primary": "{palette.textPrimary}",
        "secondary": "{palette.textSecondary}",
        "inverse": "{palette.white}",
        "brand": "{palette.bolarsMagenta}"
      },
      "brand": {
        "primary": "{palette.bolarsMagenta}",
        "primaryStrong": "{palette.bolarsDarkMagenta}",
        "onPrimary": "{palette.white}"
      },
      "scan": {
        "primary": "{palette.bolarsCyan}",
        "background": "rgba(0,166,200,0.08)"
      },
      "cta": {
        "pay": {
          "bg": "{palette.successGreen}",
          "fg": "{palette.white}",
          "pressedBg": "#1f8f3f"
        }
      }
    },
    "font": {
      "family": {
        "base": "system-ui, -apple-system, Segoe UI, sans-serif"
      },
      "textScale": {
        "normal": { "multiplier": 1 },
        "large": { "multiplier": 1.12 },
        "extraLarge": { "multiplier": 1.24 }
      }
    },
    "space": {
      "screen": { "gutter": 40, "sectionGap": 28 },
      "card": { "padding": 28 },
      "touch": { "gap": 12 }
    },
    "radius": {
      "card": 28,
      "header": 24,
      "button": 20,
      "input": 20,
      "modal": 32
    },
    "shadow": {
      "card": "0 12px 32px rgba(17,17,17,0.10)",
      "actionRail": "0 -8px 24px rgba(17,17,17,0.08)",
      "focus": "0 0 0 4px rgba(0,166,200,0.30)"
    }
  }
}
```

Важно: `#1f8f3f` в примере тоже находится внутри theme config. В компонентах допускается только `token('color.cta.pay.pressedBg')` или эквивалент.

## 18. Validation Rules

- Theme config должен проходить schema validation.
- Primary text contrast на surface не ниже WCAG AA для крупного текста.
- CTA text contrast должен быть устойчивым при `normal/large/extraLarge`.
- Focus ring должен быть виден на всех interactive surfaces.
- Missing token должен падать в development/test, а не молча заменяться случайным цветом.
- Custom profile не может скрывать help, cancel confirmation, payment error и final success.
- Missing reference-fidelity tokens для header/product image/summary/payment visual/receipt/countdown должны обнаруживаться visual/token tests до refactor acceptance.
- Missing adaptive layout tokens for viewport/profile/header/media/touch sizing must fail development/test before landscape acceptance.
- Missing 1C embedded tokens for host-fill stage, host-first height, non-sticky summary/CTA, static critical colors and light elevation must fail before 1C acceptance.

## 19. Запреты

- Не писать `#E6007E` или другие HEX в JSX/TSX/CSS компонентов.
- Не использовать brand palette напрямую вместо semantic tokens.
- Не создавать component-local color maps.
- Не хранить portrait-only `min-height`, `height`, `padding` and `font-size` constants in components/screens when they affect customer layout.
- Не наследовать desktop/tablet centered `stage.maxWidth` в 1C embedded profile.
- Не строить customer-critical CTA/help/summary на `position: sticky` в 1C embedded profile.
- Не делать `color-mix`, heavy shadows или gradient glow единственным способом различить critical surfaces в 1C embedded profile.
- Не менять тему через inline style без token mapping layer.
- Не давать quick branding произвольный CSS.
- Не делать production theme editor или custom theme UI обязательной частью MVP.
- Не делать dark theme обязательной для MVP, но не закрывать путь для `bolars-dark-optional`.
