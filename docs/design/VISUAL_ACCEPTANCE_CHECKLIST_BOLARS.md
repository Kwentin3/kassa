# Visual Acceptance Checklist: BOLARS Self-Checkout

Статус: draft 0.2
Дата: 2026-05-23
Назначение: чек-лист приёмки реализации portrait-first интерфейса кассы самообслуживания БОЛАРС.

Использовать вместе с:

- `docs/product/TZ_BOLARS_SELF_CHECKOUT_v0.4.md`
- `docs/product/PRD_BOLARS_SELF_CHECKOUT_MVP_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/README.md`
- `docs/contracts/BOLARS_WEB_1C_INTERFACE_ADAPTER_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_DEBUG_PANEL_CONTRACT.md`
- `docs/contracts/BOLARS_RUNTIME_ADAPTER_FACTORY_CONTRACT.md`
- `docs/contracts/BOLARS_MVP_PREVIEW_MODE_CONTRACT.md`
- `docs/architecture/BOLARS_LAYERED_ARCHITECTURE_AND_ADAPTERS.md`
- `docs/design/VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md`
- `docs/design/BOLARS_THEME_AND_TOKENS_CONTRACT.md`
- `docs/design/SCREEN_COMPOSITION_SPEC_BOLARS.md`
- `docs/contracts/SELF_CHECKOUT_RUNTIME_PORT_CONTRACT.md`

## 1. Viewport и Композиция

- [ ] Экран соответствует портретному терминалу `1080x1920`.
- [ ] `1080x1920` используется как design target, а не как жёсткий screenshot/pixel lock.
- [ ] Stage/tokens/layout contract сохраняет читаемость при отличающемся HTML-shell/WebView viewport.
- [ ] Эскизы БОЛАРС использованы как visual reference, а не как случайные картинки.
- [ ] Header, content, sticky CTA и help имеют явный layout contract.
- [ ] Нет горизонтального scroll в customer flow.
- [ ] Scroll-зона списка товаров не ломает header и нижнюю CTA-зону.
- [ ] Стартовый экран более брендовый; рабочие экраны спокойнее и утилитарнее.
- [ ] Бренд БОЛАРС узнаваем, но не мешает покупке.
- [ ] Customer visual screenshots сняты без debug/preview overlays.

## 1.1 Reference Fidelity Gate

Этот gate применяется перед визуальным refactor acceptance. Он проверяет не pixel-perfect копию, а обязательную композиционную близость к пяти raster reference sketches.

- [ ] Start/payment waiting/final используют black `brandHeader` с крупным БОЛАРС logo и optional clock/date.
- [ ] Cart/payment setup используют black `workHeader` с title, cancel, text scale and manager badge zone.
- [ ] Customer body surfaces преимущественно светлые; magenta используется как brand/accent/amount, а не как full-screen фон для всех экранов.
- [ ] Start содержит reference-style scan hero: magenta welcome, black instruction, cyan scanner brackets, barcode/payment visual language.
- [ ] Start содержит две action cards: scan first, manual search second.
- [ ] Start содержит отдельные text-scale and help cards when enabled.
- [ ] Cart содержит full-width search with `4+` hint.
- [ ] Cart содержит scan continuation/add-product card above product list.
- [ ] Cart product rows reserve image/thumbnail slot, even if real media uses placeholder fallback.
- [ ] Cart portrait composition uses bottom summary band with item count, total and green `Перейти к оплате`.
- [ ] Cart recent-change highlight uses cyan reference language, not green success language.
- [ ] Payment setup contains order-review card with product rows/thumbnails and subtotal/discount/payable total.
- [ ] Payment setup package actions are magenta-outline cards and include price when runtime supplies it.
- [ ] Payment setup discount block separates phone input/apply action/status and shows applied/not-found state near totals.
- [ ] Payment setup has cyan final-total band and full-width green `Оплатить` bottom CTA.
- [ ] Payment waiting contains top amount/order summary card, central payment terminal/card visual, instruction and compact order preview.
- [ ] Payment error preserves order context and shows retry/return recovery cards only when runtime permits.
- [ ] Final success contains green success mark, receipt preview and countdown card with seconds/progress.
- [ ] Final success is not accepted as a solid magenta page with only a centered message card.
- [ ] Preview screenshots can support scenario coverage, but clean customer screenshots are required for visual acceptance.

## 2. Theme и Tokens

- [ ] Нет хардкода цветов в компонентах.
- [ ] Все цвета идут через токены темы.
- [ ] HEX-значения находятся только в theme/profile config.
- [ ] Prototype MVP реализует `bolars-light-default`.
- [ ] Архитектурно зарезервированы `bolars-light-contrast` и `custom`.
- [ ] `bolars-dark-optional` не обязателен для MVP, но архитектурно не заблокирован.
- [ ] Первый implementation slice не содержит production theme editor, custom theme UI или обязательную dark theme.
- [ ] Mandatory theme profiles не расширены без отдельного решения.
- [ ] Размеры текста поддерживают `normal`, `large`, `extraLarge`.
- [ ] Spacing, radius, shadow/elevation не размазаны по компонентам.
- [ ] Focus, disabled, pressed, busy и highlight states используют tokens.

## 3. Тексты и Конфигурация

- [ ] Тексты идут через конфигурацию/словарь, а не через случайные literals в компонентах.
- [ ] Default RU copy присутствует и overrideable: `Поднесите штрих-код товара к сканеру`.
- [ ] Default RU copy присутствует и overrideable: `Для применения скидки отсканируйте карту или введите номер телефона`.
- [ ] Default RU copy присутствует и overrideable: `Скидка не найдена`.
- [ ] Default RU copy присутствует и overrideable: `Код не распознан. Обратитесь к сотруднику.`
- [ ] Default RU copy присутствует и overrideable: `Приложите карту к терминалу оплаты`.
- [ ] Default RU copy присутствует и overrideable: `Ожидаем оплату...`.
- [ ] Default RU copy присутствует и overrideable: `Оплата прошла успешно`.
- [ ] Default RU copy присутствует и overrideable: `Оплата не прошла`.
- [ ] Default RU copy присутствует и overrideable: `Попробуйте ещё раз или обратитесь к сотруднику`.
- [ ] Default RU copy присутствует и overrideable: `Спасибо за покупку!`.
- [ ] Default RU copy присутствует и overrideable: `До новых встреч`.
- [ ] Default RU copy присутствует и overrideable: `Отменить покупку и очистить корзину?`.
- [ ] Default RU copy присутствует и overrideable: `Да, отменить`.
- [ ] Default RU copy присутствует и overrideable: `Вернуться к покупке`.
- [ ] `uiConfig.searchMinLength` равен `4` для этого сценария.
- [ ] `uiConfig.finalAutoResetSeconds` управляет countdown финального экрана.
- [ ] `uiConfig.showManagerBadge` и `managerState` управляют manager badge.
- [ ] Mock/demo disclaimers не обещают реальные 1C/payment/KKT/fiscalization возможности.

## 4. Touch и Accessibility

- [ ] Рабочие кнопки крупные и подходят для touch.
- [ ] Primary CTA имеет высоту не меньше `96px` на базовом viewport.
- [ ] Secondary touch targets не меньше `56px`.
- [ ] Quantity controls `+`, `-`, value field нажимаются пальцем без промахов.
- [ ] Видимый keyboard focus есть у всех interactive элементов.
- [ ] Disabled и busy states визуально очевидны.
- [ ] Интерфейс можно пройти без мыши.
- [ ] При `prefers-reduced-motion` декоративные анимации отключены.

## 5. Start и Scan-First Flow

- [ ] Стартовый экран scan-first.
- [ ] BOLARS MVP не повторяет старый showcase/catalog flow.
- [ ] Каталог товаров не является главным экраном.
- [ ] Главная инструкция просит поднести штрих-код товара к сканеру.
- [ ] Касание стартового экрана открывает корзину без добавленного товара.
- [ ] Визуальная зона сканера использует cyan scanner hints.
- [ ] Manual search доступен, но не является главным сценарием.
- [ ] После успешного scan открывается экран `Ваши покупки`.
- [ ] Товар не найден по barcode показывает понятный fallback, а не technical crash.
- [ ] Код не распознан показывает recoverable warning.

## 6. Cart Flow

- [ ] Корзина является главным рабочим экраном.
- [ ] Покупатель может продолжать сканировать товары на cart screen.
- [ ] Поиск стартует после `4+` символов.
- [ ] Поиск использует наименование, артикул и цифры штрих-кода через runtime/search adapter.
- [ ] Кандидат поиска может показать артикул, штрих-код/идентификатор и цену, если runtime их вернул.
- [ ] Поиск имеет состояния `searching`, `found`, `notFound`, `error`.
- [ ] Кандидаты поиска найдены и отображаются крупно.
- [ ] Кандидаты поиска не найдены показывают fallback на scan/help.
- [ ] Выбор кандидата сразу добавляет товар в корзину.
- [ ] Отдельной карточки товара нет.
- [ ] Повторное сканирование увеличивает количество.
- [ ] Строка добавленного/изменённого товара подсвечивается.
- [ ] Товар удалён отражается через новый runtime snapshot.
- [ ] Количество изменено отражается через новый runtime snapshot.
- [ ] Нумпад открывается при нажатии на количество.
- [ ] Количество в MVP целочисленное, если весовые/дробные товары не утверждены отдельно.
- [ ] Нумпад имеет confirm/cancel/backspace/focus states.
- [ ] Кнопка отмены покупки открывает подтверждение, если корзина не пустая.
- [ ] Подтверждение отмены покупки не делает destructive action primary by default.

## 7. Payment Setup

- [ ] Экран подготовки к оплате показывает состав покупки.
- [ ] Экран оплаты содержит пакеты.
- [ ] Карточки пакетов являются action cards, а не декоративными блоками.
- [ ] Экран оплаты содержит скидку по карте/телефону.
- [ ] Скидка применена показывается green success state и меняет totals только из snapshot.
- [ ] Скидка не найдена показывается recoverable warning/error.
- [ ] Экран оплаты показывает менеджера, если он привязан.
- [ ] Manager binding не вычисляется UI-компонентом.
- [ ] Итоговая сумма крупная и визуально доминирует над деталями.
- [ ] `Оплатить` запускает только `startPayment()`.

## 8. Payment Waiting и Error

- [ ] Экран ожидания оплаты крупно показывает сумму и инструкцию.
- [ ] Waiting state не показывает duplicate `Оплатить`.
- [ ] `waitingForCard` и `processing` визуально различимы.
- [ ] Ошибка оплаты не очищает корзину.
- [ ] Ошибка оплаты показывает retry только если `paymentState.canRetry=true`.
- [ ] Возврат к подготовке оплаты сохраняет состав заказа.
- [ ] Payment technical errors переведены в пользовательские сообщения.
- [ ] Сценарии `failed`, `cancelled`, `timeout`, `unknown` покрыты mock mode.

## 9. Final Success

- [ ] Успешная оплата показывает однозначный green success state.
- [ ] Финальный экран показывает благодарность.
- [ ] Receipt preview не обещает реальную фискализацию без отдельного legal/integration scope.
- [ ] Финальный экран возвращает терминал на стартовый.
- [ ] Countdown reset видим и управляется runtime/config.
- [ ] UI не очищает cart самостоятельно.

## 10. Runtime Boundary

- [ ] Frontend общается с внешним миром только через `SelfCheckoutRuntimePort`.
- [ ] `MockAdapter` использует тот же `SelfCheckoutRuntimePort` API, что real `OneCInterfaceAdapter`.
- [ ] `OneCInterfaceAdapter` использует тот же `SelfCheckoutRuntimePort` API, что `MockAdapter`.
- [ ] `PreviewAdapter` использует тот же `SelfCheckoutRuntimePort` API, что `MockAdapter` и `OneCInterfaceAdapter`.
- [ ] `RuntimeAdapterFactory` выбирает adapter; UI components не создают adapters напрямую.
- [ ] Все user intentions отправляются typed commands.
- [ ] UI получает authoritative state snapshot.
- [ ] UI-компоненты не содержат бизнес-логики.
- [ ] UI не определяет: товар/скидочная карта/карта менеджера/unknown code.
- [ ] UI не считает цену, скидку, сумму, taxes или payable total.
- [ ] UI не решает, добавлять строку или увеличивать количество.
- [ ] UI не решает repeated scan.
- [ ] UI не решает, прошла ли оплата.
- [ ] UI не очищает cart после success/failure.
- [ ] 1C/backend/payment/scanner/search/theme adapters не импортируются screen/components layer.
- [ ] Web ↔ 1С details изолированы в `OneCInterfaceAdapter`, а не размазаны по screens/components.

## 11. Mock Mode

- [ ] Mock mode позволяет воспроизвести все основные состояния.
- [ ] Mock mode не создаёт отдельную UI-архитектуру и не подменяет product/runtime contract.
- [ ] Mock mode поддерживает product added.
- [ ] Mock mode поддерживает repeated scan quantity increment.
- [ ] Mock mode поддерживает product removed.
- [ ] Mock mode поддерживает quantity numpad.
- [ ] Mock mode поддерживает search searching/found/notFound/error.
- [ ] Mock mode поддерживает barcode not found.
- [ ] Mock mode поддерживает discount applied/not found.
- [ ] Mock mode поддерживает manager bound/rejected.
- [ ] Mock mode поддерживает unknown code.
- [ ] Mock mode поддерживает waiting/success/payment error.
- [ ] Mock mode поддерживает cancel confirmation.
- [ ] Mock mode поддерживает inactivity timeout.
- [ ] Таймаут неактивности имеет default `5 минут`, activity list и payment guard.
- [ ] Theme loaded/error/default profile states воспроизводимы в runtime/mock state.
- [ ] Честный знак / маркированный товар остаётся unresolved branch/state marker, без реального сценария и без UI-угадывания типа кода.

## 12. Technical Fallbacks

- [ ] `backdrop-filter` имеет fallback на solid overlay.
- [ ] Heavy shadows имеют fallback на border/light elevation.
- [ ] `100dvh` имеет fallback на `100vh`.
- [ ] Container-query-dependent layout имеет breakpoint fallback.
- [ ] Animations короткие и функциональные: row highlight, modal appear, payment status, success feedback.
- [ ] Нет декоративных анимаций, мешающих кассовому сценарию.

## 13. Implementation Evidence

Перед приёмкой implementation agent должен предоставить:

- [ ] Ссылки на компоненты/screens, которые соответствуют каждому MVP-экрану.
- [ ] Ссылку на theme config и token mapping.
- [ ] Ссылку на `SelfCheckoutRuntimePort` types/implementation.
- [ ] Тесты runtime/mock transitions для scan/search/cart/payment/discount/manager/cancel/timeout.
- [ ] Visual smoke screenshots `1080x1920` для start/cart/payment setup/payment waiting/payment error/final.
- [ ] Clean customer visual screenshots `1080x1920` for start/cart/payment setup/payment waiting/payment error/final without debug/preview overlays.
- [ ] Reference delta closure notes mapping implementation changes to `VISUAL_CONTRACT_BOLARS_SELF_CHECKOUT.md` section 18 and `SCREEN_COMPOSITION_SPEC_BOLARS.md` section 14.
- [ ] Runtime/mock transition evidence для scan product, repeated scan, search found/not found, quantity change, remove line, discount applied/not found, manager bound, payment success/error, inactivity timeout.
- [ ] Проверку отсутствия hardcoded HEX в components/screens.
- [ ] Проверку отсутствия прямых imports adapter/backend/1C/payment/search/scanner/theme из UI layer.

## 14. Web ↔ 1С Interface Adapter

- [ ] `/bolars/self-checkout-mvp` открывает новый BOLARS MVP отдельно от старого showcase.
- [ ] `/bolars/self-checkout-mvp?debug=1` открывает тот же MVP с debug panel.
- [ ] Старый showcase не перенесён на BOLARS MVP route.
- [ ] `window.BolarsSelfCheckout` существует в HTML page.
- [ ] `window.Showcase` не используется для нового BOLARS MVP.
- [ ] `getRuntimeInfo()` возвращает ready/mode/debug/route/build/adapter status.
- [ ] `receiveStateSnapshot(snapshotJsonString)` применяет authoritative snapshot и не считает бизнес-логику.
- [ ] `getLastApplyStatusJson()` возвращает parse/validation/render status.
- [ ] Outbound command channel отдаёт typed commands из `SelfCheckoutRuntimePort`.
- [ ] 1С может прочитать outbound commands через HTML document/window API без manual JSON import.
- [ ] Outbound command queue lifecycle виден в debug: `queued`, `drainedByOneC`, `processing`, `snapshotReceived`, `acknowledged`, `failed`, `timeout`, `unknown`.
- [ ] `drainOutboundCommandsJson()` не трактуется как успешное выполнение команды.
- [ ] CommandId correlation видна между last outbound command и last inbound snapshot/result.
- [ ] Stale snapshot rejected and visible in apply status.
- [ ] Unsupported screen/session mismatch/invalid snapshot не ломают UI и сохраняют последний валидный snapshot.
- [ ] Queue overflow/timeout visible in debug.
- [ ] 1С/runtime возвращает новый snapshot после команды.
- [ ] Debug panel показывает route/build, Web API status, last outbound command, last inbound snapshot, apply status и adapter status.
- [ ] Debug panel показывает outbound queue: pending, queued, drained, processing, failed, timeout, last unacked command, oldest pending age, last drain time.
- [ ] Debug panel visible only with `debug=1`.
- [ ] Debug panel не является customer UI, admin, manual JSON import или business operation launcher.
- [ ] `receiveCatalog` не используется как cart/runtime path, не добавляет товары в cart и не заменяет search commands.
- [ ] `getRuntimeInfoJson()` or equivalent string helper available if needed for 1С.
- [ ] URL/query params не содержат secrets, tokens, internal 1С links, ФИО, phones, e-mail или commercial customer data.
- [ ] Media delivery не считается частью этого contract до отдельного решения с 1С team.

## 15. Preview Mode and Adapter Factory

- [ ] `/bolars/self-checkout-mvp?debug=1&preview=1` opens preview controls.
- [ ] `preview=1` requires `debug=1`.
- [ ] Preview scenarios render all required MVP screens/states.
- [ ] Preview renders via `SelfCheckoutRuntimePort` snapshot, not direct component bypass.
- [ ] Preview controls use `PreviewAdapter`.
- [ ] Preview does not enqueue commands to `OneCInterfaceAdapter`.
- [ ] Preview does not call 1С, payment, KKT/fiscalization or Честный знак flows.
- [ ] Debug panel distinguishes `mock`, `preview`, `onec`, `unknown` adapters.
- [ ] Debug panel shows `previewMode`, selected preview screen/scenario and preview snapshot version.
- [ ] Visual smoke screenshots can be generated from preview scenarios.
- [ ] Preview mode cannot be accessed as customer workflow.
- [ ] Preview mode does not create production admin behavior.
- [ ] Adapter selection rules are covered: local/dev mock, `debug=1&preview=1` preview, allowed 1С shell onec.
