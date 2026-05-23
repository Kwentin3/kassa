# BOLARS TZ Documentation Divergence Audit

Дата: 2026-05-23

Источник сверки: опорное ТЗ, переданное пользователем в чате 2026-05-23, `Интерфейс терминала кассы самообслуживания. Цветовая тема: БОЛАРС`.

Область аудита:

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/README.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`

## Summary

Подготовленный пакет в целом правильно удерживает scan-first кассовый flow, отсутствие товарной карточки, theme-driven UI и runtime boundary. Основные расхождения касаются не визуального слоя, а точности канонического ТЗ и полноты product/runtime деталей:

- repo-ограничение `mock-only` попало в каноническое ТЗ как будто это требование исходного ТЗ;
- пропущено поведение стартового экрана по касанию;
- неполно перенесён таймаут неактивности;
- неполно перенесён список системных состояний;
- theme profiles расширены сильнее, чем требует исходное ТЗ;
- search/cart/runtime contracts не полностью отражают поля и конфигурацию из исходного ТЗ.

## Findings

### High: каноническое ТЗ смешало исходные продуктовые требования с repo mock-only ограничением

Опорное ТЗ описывает продуктовый сценарий с 1С-поиском, системой лояльности и эквайрингом как внешними контурами сценария: поиск выполняется средствами 1С, телефон проверяется в системе лояльности, оплата инициируется через эквайринг. При этом frontend не должен напрямую обращаться к этим контурам.

В подготовленном каноническом ТЗ `mock-only` записан как характеристика продукта: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:28`. В PRD это усилено формулировкой, что реальные 1C/backend/payment не входят в MVP: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:43`, `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:44`, а также mock-only разделом: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:275`, `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:277`. Индекс тоже фиксирует, что real payment / real 1C не закрыты MVP: `docs/README.md:62`.

Почему это расхождение: исходное ТЗ не говорит, что продуктовый MVP является mock-only. Оно говорит, что UI не владеет бизнес-логикой и должен работать через внешнюю систему/роутер/эквайринг. Mock-only является текущим repo/implementation constraint, но не должен менять canonical upstream requirements.

Рекомендация: в `TZ_BOLARS_SELF_CHECKOUT_v0.4.md` убрать `mock-only` из определения продукта и заменить на нейтральное: внешние контуры скрыты за runtime port; в текущем frontend MVP они могут быть смоделированы mock adapter. PRD может оставить mock-only как implementation assumption, но не как замену продуктового требования.

### High: не перенесено поведение стартового экрана по касанию

Опорное ТЗ, раздел 6.3: если покупатель нажимает на экран, открывается экран корзины. Это отдельный вход в пустую корзину, не равный scan и не равный manual search.

Подготовленный PRD описывает только scan-first вход: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:105`-`docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:109`. Screen composition для start screen перечисляет выходы только через `scanCode`, manual search и help: `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:35`-`docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:41`. Runtime mandatory command subset не содержит команды/намерения для `touchStartScreen`, `startPurchase` или `openCartFromStart`: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:524`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:544`.

Рекомендация: добавить в ТЗ/PRD/screen spec явное поведение `tap start screen -> cart empty/active`, а в runtime contract зарезервировать typed command, например `startPurchase()` или `openCartFromStart()`.

### High: таймаут неактивности перенесён неполно

Опорное ТЗ, раздел 11, задаёт не только факт таймаута, но и default `5 минут`, список действий, считающихся активностью, и важное правило: если операция оплаты уже отправлена в эквайринг и система ждёт ответ от платёжного устройства, автоматический сброс не должен ломать процесс оплаты.

В подготовленном каноническом ТЗ таймаут указан только как состояние: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:117`. В PRD он также присутствует на уровне scope/states: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:81`, `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:271`. Runtime contract содержит поле `inactivityWarningSeconds`, но без default, activity sources и payment guard semantics: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:424`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:435`.

Рекомендация: добавить отдельный timeout contract: default `5 минут`, список activity events из опорного ТЗ, запрет ломать already-sent acquiring transaction, и поведение timeout warning/reset.

### Medium: системные состояния из опорного ТЗ перенесены неполно

Опорное ТЗ, раздел 14, включает состояния: терминал свободен, покупка начата, покупка отменена, маркированный товар / Честный знак требует решения, активная тема загружена, тема не загружена или с ошибкой, используется цветовой профиль по умолчанию.

Текущий список обязательных состояний в каноническом ТЗ короче и заканчивается на таймауте: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:95`-`docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:117`. PRD повторяет укороченный набор: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:249`-`docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:271`.

Рекомендация: расширить состояния в ТЗ/PRD и runtime/acceptance checklist: terminal free, purchase started/cancelled, marked product unresolved branch, active theme loaded, theme load error, default profile fallback.

### Medium: theme profile scope расширен сверх исходного ТЗ

Опорное ТЗ, раздел 4.6, минимально требует предусмотреть три профиля: `Bolars Light`, `Bolars Contrast`, `Custom`; для MVP можно реализовать только `БОЛАРС Светлая`, не закрывая возможность расширения.

Theme contract формулирует как минимум пять профилей плюс optional dark: `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md:24`-`docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md:33`. Acceptance checklist требует поддержку `bolars-light-clean` и `bolars-light-promo`: `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md:29`-`docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md:33`. Runtime union также включает эти профили: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:441`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:456`.

Рекомендация: привести обязательный минимум к исходному ТЗ: MVP required `bolars-light-default`, contract-reserved `bolars-light-contrast`, `custom`, optional dark. `clean` и `promo` можно оставить как future examples, но не как mandatory acceptance.

### Medium: search contract не полностью отражает исходное ТЗ

Опорное ТЗ, разделы 7.3 и 12.3, требует: поиск по наименованию, артикулу и цифрам штрих-кода; поиск выполняется средствами 1С; список кандидатов может показывать штрих-код или часть идентификатора; должны быть управляемы max candidates, формат отображения кандидата и поведение выбора.

Runtime `SearchCandidate` не содержит barcode/identifier display field: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:274`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:283`. `UiConfigState` содержит только `searchMinLength`, без search fields, max candidates и candidate display format: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:424`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:435`. PRD configurability summary также оставляет только manual search/min length на высоком уровне: `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:231`-`docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md:247`.

Рекомендация: добавить в PRD/runtime contract поля `searchFields`, `searchMaxCandidates`, `candidateIdentifier`, `candidateDisplayFormat` и явно указать, что source of search в product target - 1С/runtime adapter.

### Medium: cart line anatomy недоописана относительно исходного ТЗ

Опорное ТЗ, раздел 7.4, требует для каждой строки: номер позиции, наименование, количество, кнопки минус/плюс, удаление, сумма по строке. Раздел 7.5 уточняет, что для MVP количество целое, если отдельно не принято решение о весовых или дробных товарах.

Screen composition описывает cart list на уровне зон, но не фиксирует номер позиции: `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:68`-`docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:75`. Runtime `CartLine` не содержит `positionNumber`/`ordinal` и не фиксирует integer-only MVP quantity: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:203`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:219`.

Рекомендация: добавить `positionNumber` или явно описать, что UI выводит ordinal из ordered `cartLines`; добавить MVP rule `quantity` is integer unless weighted/fractional support is separately approved.

### Low: cancel confirmation labels and empty-cart behavior are under-specified

Опорное ТЗ, раздел 3.2, задаёт точное поведение: при пустой корзине `Отменить покупку` возвращает на старт; при непустой корзине открывает modal с текстом `Отменить покупку и очистить корзину?` и кнопками `Да, отменить`, `Вернуться к покупке`.

Prepared docs capture the confirmation concept, but not the exact default modal copy and empty-cart behavior in one place. Screen spec says safe action `Вернуться к покупке`, but destructive label is not fixed: `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:162`-`docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:170`. Runtime modal state has only title/message and no action labels: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:395`.

Рекомендация: preserve source default strings in UI dictionary/config and acceptance checklist; document empty-cart cancel as direct reset.

### Low: default user-facing payment/error texts are not preserved as defaults

Опорное ТЗ задаёт конкретные default texts: `Код не распознан. Обратитесь к сотруднику.`, `Скидка не найдена`, `Приложите карту к терминалу оплаты`, `Ожидаем оплату...`, `Оплата прошла успешно`, `Оплата не прошла`, `Попробуйте ещё раз или обратитесь к сотруднику`.

Prepared docs mostly describe generic recoverable states and configurable texts. Examples exist for some texts, but there is no default dictionary contract. For example, acceptance only says unknown code shows recoverable warning: `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md:65`; payment waiting has the instruction in screen spec: `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md:271`.

Рекомендация: add a default RU copy table or dictionary contract seeded from the opорное ТЗ, while keeping text override configurable.

## Positive Coverage

The prepared package correctly preserves these core points from the opорное ТЗ:

- scan-first checkout, not internet shop/catalog: `docs/README.md:52`-`docs/README.md:56`;
- no product detail modal/card: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:121`-`docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:124`;
- runtime boundary and no direct UI calls to 1C/payment/scanner/search: `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:39`-`docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md:49`;
- theme/token discipline and no direct HEX in components: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:177`-`docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:202`;
- open questions for Честный знак and brandbook remain open: `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:395`-`docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md:402`.

## Recommended Fix Order

1. Fix canonical TZ first: remove mock-only as product fact, restore missing source sections and states.
2. Update PRD to distinguish product target from current mock implementation assumption.
3. Update runtime contract for start touch, timeout semantics, search config, cart ordinal/integer quantity.
4. Reduce mandatory theme profiles to match source MVP/minimum scope.
5. Add default RU text dictionary table.
6. Re-sync acceptance checklist and `docs/out` copies after canonical docs are corrected.
