# BOLARS Theme Query Param Switcher Report

Дата: 2026-05-23
Статус: implemented, local verification passed

## Что Изменено

- Добавлен URL override темы через `theme=` и `themeProfile=`.
- Реализованы selectable light profiles:
  - `bolars-light-default`;
  - `bolars-light-contrast`;
  - `bolars-light-clean`;
  - `bolars-light-promo`.
- `custom` и `bolars-dark-optional` оставлены reserved: при выборе через URL runtime делает safe fallback на `bolars-light-default` и показывает debug warning.
- `RuntimeRouteContext` теперь хранит `themeProfileId`, источник выбора и warning.
- `MockAdapter`, `PreviewAdapter` и `OneCInterfaceAdapter` получают initial theme через тот же `SelfCheckoutRuntimePort` snapshot model.
- UI применяет тему только из `snapshot.themeProfile` через CSS custom properties, а не напрямую из query params.
- Preview panel получил theme selector, который меняет URL-параметр и перезагружает preview route; он не рендерит экраны в обход `PreviewAdapter`.
- Debug panel и `getRuntimeInfoJson()` показывают активный theme profile.

## Почему Так

Тема является частью runtime/config state, а не локальной настройкой компонента. Поэтому URL-параметр влияет только на initial runtime context. Дальше UI остаётся честным renderer-ом authoritative snapshot и не начинает сам выбирать CSS ветки по адресу.

Preview selector сделан route-driven: это подходит для visual acceptance и не превращает debug panel в production admin.

## Проверки

- `npm run typecheck`
- `npm run test:run`
- `npm run build`
- `npm run visual:cards`
- `npm run smoke:showcase-catalog`
- Local browser smoke on `127.0.0.1:4173`:
  - `?debug=1&preview=1&scenario=cartManyItems&theme=bolars-light-default`
  - `?debug=1&preview=1&scenario=cartManyItems&theme=bolars-light-contrast`
  - `?debug=1&preview=1&scenario=cartManyItems&theme=bolars-light-clean`
  - `?debug=1&preview=1&scenario=cartManyItems&theme=bolars-light-promo`
  - `?debug=1&preview=1&theme=bolars-dark-optional` fallback warning
  - customer route `?theme=bolars-light-contrast` without debug/preview overlays

Server smoke фиксируется в handoff после деплоя.

## Не Менялось

- Не добавлен production theme editor.
- Не добавлен custom theme UI.
- Не реализована обязательная dark theme.
- Не менялась бизнес-логика корзины, оплаты, поиска или 1С bridge.
- Старый showcase не используется как source of truth.
