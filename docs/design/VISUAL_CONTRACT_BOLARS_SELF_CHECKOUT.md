# Visual Contract: BOLARS Self-Checkout

Статус: draft 0.1
Дата: 2026-05-23
Назначение: визуальный контракт будущего portrait-first интерфейса кассы самообслуживания в теме БОЛАРС.
Основание: эскизы БОЛАРС, `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`, этап prototype MVP и runtime/adapter boundary.

## 1. Назначение

Этот документ фиксирует визуальные решения из эскизов БОЛАРС в техническом виде для следующего implementation agent. Контракт описывает композицию, иерархию, зоны, состояния и запреты. Он не реализует frontend; prototype MVP может использовать `MockAdapter`, но визуальный контракт сохраняет продуктовую границу с runtime/1С/лояльностью/эквайрингом.

Цель: получить scan-first kiosk UI, который можно собрать из theme tokens, runtime state snapshot и typed user-intent commands без хардкода бренда и без бизнес-логики в UI-компонентах.

## Related Documents

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md` - каноническое upstream ТЗ.
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md` - продуктовая рамка MVP.
- `docs/AGENT_START_HERE.md` - implementation handoff и первый срез.
- `docs/README.md` - индекс документации и порядок чтения.
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md` - theme/tokens contract.
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md` - runtime boundary.
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md` - экранная композиция.
- `docs/design/VISUAL_ACCEPTANCE_CHECKLIST_BOLARS.md` - критерии приёмки.

## 2. Проанализированные эскизы

Источник: `D:\Users\Roman\Desktop\Эскизы для терминала кассы самообслуживания\тема боларс`

Все найденные PNG имеют размер `941x1672`, что пропорционально целевому viewport `1080x1920`.

| Файл | Роль в контракте |
| --- | --- |
| `стартовый экран 23 мая 2026 г., 10_05_21 (1).png` | Start screen: брендовая шапка, центральная scan-инструкция, scanner visual, action cards, A/A+/A++, help. |
| `корзина  23 мая 2026 г., 10_05_21 (2).png` | Cart screen: рабочий список товаров, поиск, scan hint, quantity controls, sticky summary CTA, manager badge. |
| `подтверждение заказа 23 мая 2026 г., 10_05_21 (3).png` | Payment setup: проверка заказа, пакеты, скидки/телефон, финальная сумма, `Оплатить`. |
| `оплата  23 мая 2026 г., 10_05_21 (4).png` | Payment waiting/error family: сумма, инструкция приложить карту, крупный status, preview заказа, retry/return actions. |
| `завершение  23 мая 2026 г., 10_05_21 (5).png` | Final success: green success mark, благодарность, receipt preview, countdown reset. |

## 3. Базовый Viewport

- Базовый дизайн: `1080x1920`, portrait.
- Эскизы: `941x1672`, масштаб около `0.871` от целевого viewport.
- Контракт реализации: проектировать от `1080x1920`, затем адаптировать через токены, а не через fixed screenshot dimensions.
- `1080x1920` - design target, не единственный допустимый размер. Не прибивать layout к скриншоту абсолютными пикселями.
- Отличающиеся HTML-shell/WebView viewport должны сохранять stage, readable hierarchy, sticky CTA/help и отсутствие horizontal scroll.
- Root viewport должен поддерживать `100dvh` с fallback на `100vh`.
- Горизонтальный scroll в customer flow запрещён.
- Основная scroll-зона находится внутри body screen area; sticky CTA и sticky help не должны исчезать без явного scroll contract.

## 4. Kiosk-First Принципы

- Это терминал самообслуживания, а не web admin и не интернет-магазин.
- Основной пользователь стоит перед экраном; критичные тексты и суммы читаются с расстояния.
- Рабочие элементы нажимаются пальцем: primary touch target не меньше `72px`, secondary не меньше `56px`.
- Кнопки `+`, `-`, quantity field, package cards, CTA и help должны иметь явные normal/pressed/disabled/focus states.
- Один экран = одно доминирующее намерение: сканировать, проверить, оплатить, дождаться, завершить.
- Декоративные эффекты не должны мешать кассовому сценарию.
- Все бизнес-решения приходят из runtime state snapshot; UI только показывает состояние и отправляет typed commands.

## 5. Scan-First Принципы

- Первый экран должен явно просить поднести штрих-код товара к сканеру.
- Касание стартового экрана открывает корзину без добавленного товара.
- После первого scan пользователь попадает в `Ваши покупки`.
- На cart screen сканирование остаётся основным продолжением сценария: scan hint должен быть видим выше списка.
- Поиск является fallback, а не каталогом. Поиск запускается после `4+` символов.
- Выбор search candidate сразу добавляет товар в корзину через runtime command.
- Отдельная карточка товара или модальное описание товара не открываются.
- UI не определяет, является ли код товаром, скидочной картой или картой менеджера. Это делает runtime.

## 6. Общая Композиционная Модель

### 6.1 Stage

- Root stage: светлый фон с лёгкой фактурой или plain fallback.
- Внутренние отступы: `32-48px` по горизонтали на `1080px`.
- Карточки: белая поверхность, мягкая тень, радиус `24-32px` для крупных зон.
- Рабочие экраны спокойнее стартового: меньше промо-изображений, больше структуры.

### 6.2 Header

Есть два header variants:

| Variant | Где используется | Роль | Высота на 1080x1920 |
| --- | --- | --- | --- |
| `brandHeader` | старт, ожидание оплаты, финал | logo БОЛАРС + clock/date, сильный брендовый сигнал | примерно `180-210px` |
| `workHeader` | корзина, подготовка к оплате | title + cancel + text scale + manager badge | примерно `130-160px` |

Header визуально чёрный, с белым текстом и magenta/cyan акцентами. Нижние углы могут быть скруглены, но это должен быть token.

### 6.3 Content

- Start: центральная scan-инструкция занимает верхнюю половину body.
- Cart: search + scan hint + список товаров + sticky summary.
- Payment setup: order review + packages + discount + primary payment CTA.
- Payment waiting: amount card + payment instruction visual + compact order preview.
- Final: success confirmation + receipt visual + countdown reset.

### 6.4 Bottom Zone

- В рабочих экранах нижняя зона содержит primary CTA или help.
- На cart/payment setup CTA визуально доминирует и не конкурирует с cancel/help.
- Help остаётся доступной, но не становится primary action.

## 7. Постоянные Зоны Интерфейса

| Зона | Правило |
| --- | --- |
| Brand zone | На стартовом, ожидании оплаты и финале logo БОЛАРС крупный и узнаваемый. На рабочих экранах можно заменить title + compact controls. |
| Clock/date | Допустимы в brandHeader; не должны оттягивать внимание от сценария. |
| Text scale | `A`, `A+`, `A++` доступны на стартовом и рабочих экранах. Состояние приходит из `state.textScale`. |
| Help | Крупная карточка/кнопка помощи внизу или sticky area. Не смешивать с CTA оплаты. |
| Manager badge | Показывать только если `state.manager.status === 'bound'`. UI не привязывает менеджера сам. |
| Scanner hint | Cyan scanner/search/payment hints. Не использовать cyan для основной оплаты или ошибок. |
| Summary/total | Сумма крупная, чаще magenta или cyan profile token. Итог должен читаться быстрее списка товаров. |

## 8. Экранная Анатомия MVP-Экранов

### 8.1 Стартовый Экран

- `brandHeader`: logo слева, clock/date справа.
- Hero instruction: `Добро пожаловать!` в magenta, основной текст `Поднесите штрих-код товара к сканеру` крупным чёрным.
- Scanner visual: cyan corner brackets, magenta barcode, короткий functional scan line.
- Brand/product imagery: строительные смеси по бокам, не перекрывают инструкцию.
- Action cards: `Сканировать товар` и `Найти товар вручную`; scan card идёт первой.
- Text scale card: отдельный горизонтальный блок `A/A+/A++`.
- Help card: отдельный нижний блок.

### 8.2 Корзина / Ваши Покупки

- `workHeader`: title `Ваши покупки`, cancel purchase, text scale, manager badge.
- Search bar: крупная полоса, hint `Поиск начнется после 4+ символов`.
- Scan continuation hint: напоминание, что можно продолжать сканировать.
- Product rows: большие белые строки с image, name, package, article, quantity controls, line amount, delete.
- Recently changed row: cyan border/background wash + small status label.
- Summary card: count, total, green primary CTA `Перейти к оплате`.
- Help row: внизу, ниже summary.

### 8.3 Подготовка к Оплате

- `workHeader`: title `Оплата`, cancel, text scale, manager badge.
- Order review card: compact список товаров, итог, скидка, сумма к оплате.
- Package card: три package actions, outline magenta.
- Discounts/bonuses card: инструкция сканировать карту или ввести телефон; phone input + keypad action.
- Applied discount status: green success chip/card, не перекрывает поле телефона.
- Final total band: крупная итоговая сумма.
- Bottom CTA: full-width green `Оплатить`.

### 8.4 Ожидание Оплаты

- `brandHeader`: logo + clock.
- Payment title: `Оплата`, order number.
- Amount card: крупная сумма и количество позиций.
- Central instruction: визуал терминала оплаты, карта/телефон, cyan framing.
- Status: `Ожидаем оплату...` или processing state.
- Order preview: несколько товаров + collapsed `ещё N позиций`.
- Secondary actions: retry/return используются для failed/timeout variants; в чистом waiting state они могут быть hidden/disabled по `paymentState`.

### 8.5 Финальный Экран

- `brandHeader`: logo + clock.
- Success mark: крупный green circle/check.
- Main text: `Спасибо за покупку!` крупным чёрным.
- Receipt preview: декоративный, но данные берутся из state snapshot.
- Countdown reset card: `Возврат на стартовый экран через N сек` + progress.
- После timeout UI вызывает только `resetToStart(reason)` или получает automatic runtime state; cart очистку решает runtime.

## 9. Визуальная Иерархия

1. Основная инструкция или текущий статус.
2. Сумма к оплате.
3. Primary CTA.
4. Товары и quantity controls.
5. Search/manual fallback.
6. Help/cancel/secondary actions.
7. Brand decoration.

Magenta активно используется для brand, amount, selected/accent, delete/cancel outline. Green используется только для успешного/оплатного действия. Cyan используется для scanner/search/payment guidance. Black используется для header и primary text.

## 10. Правила Крупных Touch-Элементов

- Primary CTA: высота `96-112px`, full-width или крупный блок справа в summary.
- Cart row quantity controls: кнопки `+`/`-` не меньше `56x56px`, quantity field не меньше `72x56px`.
- Package actions: не меньше `96px` по высоте, понятная зона нажатия.
- Help/cancel cards: не меньше `72px` по высоте.
- Нажатие не должно менять layout. Допустимы короткие `translateY(1-2px)`, shadow reduction, border emphasis.
- Disabled state должен быть визуально явным.

## 11. Правила Читаемости

- Title/header text: `32-44px`.
- Hero instruction: `56-72px`.
- Product name: `26-34px`, максимум 2 строки в row.
- Line price: `32-40px`.
- Main total: `56-76px`.
- Secondary copy: `22-28px`.
- Текст не должен обрезаться в CTA и quantity controls.
- `normal`, `large`, `extraLarge` задаются через `textScale` и tokens, а не CSS override в компонентах.

## 12. Focus, Keyboard и Accessibility

- Все interactive элементы имеют `:focus-visible`.
- Focus ring использует отдельный token, визуально заметный на white/black/magenta/green surfaces.
- Inputs имеют label или aria-label.
- Buttons остаются buttons, поля остаются inputs; не строить интерактив через div без семантики.
- UI должен быть операбелен без мыши: scan/manual input, search, quantity, payment CTA, cancel modal.

## 13. Подсветка Добавленного или Изменённого Товара

- Runtime возвращает `cartLine.lastChange`.
- UI подсвечивает строку через tokenized `recentChange` state: cyan border, pale cyan background, optional status chip.
- Подсветка короткая и функциональная: `1200-1800ms`, без layout shift.
- Для повторного сканирования label может быть `Количество увеличено`.
- Для нового товара label может быть `Только что добавлено`.
- UI не решает, новая это строка или increment; он отображает snapshot.

## 14. Ошибки и Предупреждения

- Ошибка не должна выглядеть как technical crash.
- Barcode not found: понятное сообщение, fallback на scan again/search/help.
- Unknown code: нейтральное предупреждение, runtime решает тип кода.
- Payment failed: cart не очищается, сумма и состав заказа остаются доступны.
- Cancel purchase: destructive action всегда через confirmation modal, если cart не пустая.
- Timeout inactivity: закрывает текущую покупку и возвращает терминал на старт по runtime snapshot; warning modal/card допустим только если сконфигурирован и не ломает оплату.
- Error color используется дозированно; primary CTA не становится красной кроме подтверждения destructive action.

## 15. Финальный Экран

- Успех должен быть однозначным: green check + благодарность.
- Receipt preview не должен обещать реальную фискализацию в mock mode.
- Countdown видим и понятен.
- После завершения runtime возвращает terminal к стартовому экрану.
- UI не очищает cart самостоятельно.

## 16. Технические Fallbacks

- `backdrop-filter`: если недоступен, использовать обычный затемняющий overlay + shadow.
- `blur`: если недоступен, использовать solid surface с opacity.
- Heavy shadow: если performance слабый, заменить на border + light elevation.
- Complex/long animation: заменить на static state или короткий opacity transition.
- `100dvh`: fallback на `100vh`.
- Container queries: fallback на breakpoint tokens.
- Motion: уважать `prefers-reduced-motion: reduce`; оставить только terminal feedback без scale/translate.

## 17. Запреты и Анти-Паттерны

- Не делать интернет-магазин, каталог или product detail modal.
- Не переносить старую showcase-модель "каталог товаров как главный экран" в BOLARS MVP.
- Не делать мелкую табличную кассу.
- Не хардкодить HEX в компонентах.
- Не обращаться из UI-компонентов напрямую к backend, 1C, scanner-router, эквайрингу, поиску.
- Не считать цены, скидки, итоги, тип кода или payment outcome в UI.
- Не смешивать help, cancel и primary CTA в одну визуальную иерархию.
- Не использовать декоративные анимации, мешающие сканированию или оплате.
- Не скрывать search/help fallback.
- Не очищать cart при ошибке оплаты.
- Не расширять рабочий экран на desktop без portrait/stage contract.
