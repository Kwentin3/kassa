# Product Image Assets Update

Дата: 2026-05-19  
Статус: implemented, tested and deployed

## Что изменено

- Карточки товаров больше не используют только пустые декоративные фреймы.
- Добавлен demo image source layer: `src/services/productImages.ts`.
- Для каждого товара строится детерминированный HTTPS URL по product/category tags и `lock`.
- Источник demo-изображений: `https://loremflickr.com`, tag-based image endpoint.
- Если внешний image asset не загрузился, карточка показывает прежний безопасный fallback с initials товара.
- В runtime нет `http://` product-image URL; mixed content не должен появляться из этого слоя.

## Почему так

- Не раздуваем репозиторий бинарными картинками.
- Не добавляем CMS/backend/media storage.
- Сохраняем mock-only рамку MVP.
- Можно быстро заменить источник на локальные ассеты или backend media adapter позже.

## Проверки

- `npm run typecheck`: passed.
- `npm run test:run`: passed, 8 files / 24 tests.
- `npm run build`: passed.
- Smoke одного image endpoint: `https://loremflickr.com/640/480/milk,dairy?lock=1637` вернул HTTPS redirect to cached image.
- Server deploy: `kassa-web` rebuilt and restarted on `roman@192.168.7.64`.
- `https://kassa.speechbattle.com`: `200 OK`.
- Current JS bundle includes `https://loremflickr.com/640/480/` image source.
- `index.html` has no `http://` links.
- Product image source uses HTTPS URLs only; remaining `http://` strings in the bundled JS are static XML/SVG namespace or localhost fallback strings, not product image requests.

## Ограничения

- Это demo image source, не production DAM/media pipeline.
- Качество и точность картинок зависят от внешнего tag-based источника.
- Для полностью контролируемого client demo можно позже заменить на локальный `/public/product-images/*` набор.
