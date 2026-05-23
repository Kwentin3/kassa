# BOLARS Magenta Soft Theme Report

Дата: 2026-05-23
Статус: implemented, local verification passed

## Что Добавлено

Добавлен selectable theme profile:

```text
bolars-light-magenta-soft
```

Цель профиля: посмотреть вариант, где общий фон остаётся белым, а кнопки, поля и контейнеры получают лёгкий magenta tint.

## Палитра Профиля

- App background: `#FFFFFF`
- Container surface: `#FFF0F7`
- Field surface: `#FFEAF4`
- Button surface: `#FFE1F0`
- Button / primary text: `#3D0928`
- Brand magenta: `#E6007E`
- Border: `#F0B8D5`

## Контрактное Решение

Профиль не добавляет отдельный UI path. Он выбирается через `theme=` / `themeProfile=`, попадает в `snapshot.themeProfile` и применяется через CSS custom properties.

Для этой темы добавлены semantic surface tokens:

- `--bolars-container-surface`
- `--bolars-field-surface`
- `--bolars-button-surface`
- `--bolars-button-text`
- `--bolars-primary-action-bg`
- `--bolars-primary-action-text`
- `--bolars-primary-action-border`

Default/contrast/clean/promo профили получают значения, сохраняющие текущий внешний вид.

## Проверки

- `npm run typecheck`: passed.
- `npm run test:run`: passed.
- `npm run build`: passed.
- `npm run visual:cards`: passed.
- `npm run smoke:showcase-catalog`: passed.
- Local Playwright smoke for `theme=bolars-light-magenta-soft`: passed for preview/cart-many-items and customer start route.

## Что Не Менялось

- Business runtime не менялся.
- Scanner/payment/search/cart logic не менялись.
- Production theme editor не добавлялся.
- `custom` и `bolars-dark-optional` остаются reserved.
