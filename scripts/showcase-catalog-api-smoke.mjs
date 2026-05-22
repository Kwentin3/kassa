import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const targetUrl = process.env.SHOWCASE_SMOKE_URL
  ?? 'http://127.0.0.1:4173/diagnostics/1c-html-shell/?mode=showcase&runId=local-catalog-smoke&terminalLabel=local';
const fixtureUrl = new URL('../docs/integrations/1c-html-shell/fixtures/showcase-catalog.1c.sample.json', import.meta.url);
const sampleCatalog = JSON.parse(await readFile(fixtureUrl, 'utf8'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeMailboxCatalog() {
  return {
    contractVersion: '0.1',
    source: '1c',
    generatedAt: '2026-05-21T12:30:00',
    catalogId: 'showcase-mailbox-smoke',
    currency: 'RUB',
    groups: [
      {
        id: 'group-mailbox',
        parentId: null,
        title: 'Mailbox группа',
        sortOrder: 10,
        visible: true,
        image: null,
        icon: null
      }
    ],
    products: [
      {
        id: 'product-mailbox-001',
        groupId: 'group-mailbox',
        title: 'Товар из DOM mailbox',
        shortTitle: 'Mailbox товар',
        price: 77,
        currency: 'RUB',
        image: null,
        badges: ['Mailbox'],
        available: true,
        visible: true,
        requiresStaff: false,
        ageRestrictedMock: false,
        sortOrder: 10,
        unit: 'шт',
        quantityStep: 1
      }
    ]
  };
}

function withDirectorySlash(urlText) {
  try {
    const url = new URL(urlText);
    if (url.pathname.endsWith('/diagnostics/1c-html-shell')) {
      url.pathname = `${url.pathname}/`;
      return url.toString();
    }
  } catch {
  }
  return urlText;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
const browserErrors = [];

page.on('pageerror', (error) => {
  browserErrors.push(error.message);
});
page.on('console', (message) => {
  if (message.type() === 'error') {
    browserErrors.push(message.text());
  }
});

try {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  try {
    await page.waitForFunction(() => window.Showcase && typeof window.Showcase.receiveCatalog === 'function', null, { timeout: 2500 });
  } catch (error) {
    const retryUrl = withDirectorySlash(targetUrl);
    if (retryUrl === targetUrl) {
      throw error;
    }
    await page.goto(retryUrl, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Showcase && typeof window.Showcase.receiveCatalog === 'function');
  }
  await page.waitForFunction(() => window.Showcase && window.Showcase.ready === true);

  const runtimeInfo = await page.evaluate(() => window.Showcase.getRuntimeInfo());
  assert(runtimeInfo.ready === true, 'window.Showcase should be ready');
  assert(runtimeInfo.mode === 'showcase', `Expected showcase mode, got ${runtimeInfo.mode}`);
  assert(runtimeInfo.catalogStatus.source === 'mock', 'Initial catalog source should be mock');

  const mockStatus = JSON.parse(await page.evaluate(() => window.Showcase.getCatalogStatusJson()));
  assert(mockStatus.ok === true, 'Initial mock catalog status should be ok');
  assert(mockStatus.source === 'mock', 'Initial catalog status source should be mock');
  assert(mockStatus.productsAccepted === 32, `Expected 32 base mock products, got ${mockStatus.productsAccepted}`);

  assert(await page.locator('#showcase-debug-panel').count() === 0, 'Debug panel should be hidden by default');
  await page.locator('#showcase-debug-toggle').check();
  await page.waitForSelector('#showcase-debug-panel');
  const initialDebugText = await page.locator('#showcase-debug-panel').textContent();
  assert(initialDebugText.includes('Runtime'), 'Debug panel should show runtime section');
  assert(initialDebugText.includes('JSON'), 'Debug panel should state read-only JSON diagnostics');

  const directResult = await page.evaluate((payload) => window.Showcase.receiveCatalog(payload), JSON.stringify(sampleCatalog));
  assert(directResult.ok === true, `Direct catalog result should be ok: ${JSON.stringify(directResult)}`);
  assert(directResult.catalogId === 'showcase-sample-1c', 'Direct catalogId mismatch');
  assert(directResult.groupsAccepted === 2, `Expected 2 groups accepted, got ${directResult.groupsAccepted}`);
  assert(directResult.productsAccepted === 4, `Expected 4 products accepted, got ${directResult.productsAccepted}`);
  assert(directResult.productsSkipped === 2, `Expected 2 products skipped, got ${directResult.productsSkipped}`);

  const directDebugText = await page.locator('#showcase-debug-panel').textContent();
  assert(directDebugText.includes('showcase-sample-1c'), 'Debug panel should show direct catalogId');
  assert(directDebugText.includes('productsAccepted'), 'Debug panel should show accepted product count label');
  assert(directDebugText.includes('catalog applied'), 'Debug panel should show catalog applied event');

  const directUi = await page.evaluate(() => ({
    categories: [...document.querySelectorAll('.showcase-category-button')].map((node) => node.textContent.trim()),
    cards: [...document.querySelectorAll('.showcase-product-card')].map((node) => node.textContent.trim()),
    textareaCount: document.querySelectorAll('#showcase-page textarea').length,
    fileInputCount: document.querySelectorAll('#showcase-page input[type="file"]').length,
    placeholderCount: [...document.querySelectorAll('.showcase-product-image')].filter((node) => node.textContent.includes('Нет фото')).length
  }));
  assert(directUi.categories.includes('Напитки'), 'Direct catalog category Напитки should be visible');
  assert(directUi.categories.includes('Выпечка'), 'Direct catalog category Выпечка should be visible');
  assert(!directUi.categories.includes('Скрытая группа'), 'Invisible group should be hidden');
  assert(directUi.cards.some((text) => text.includes('Вода питьевая')), 'Visible product should render');
  assert(directUi.cards.some((text) => text.includes('Товар требует сотрудника')), 'requiresStaff product should render');
  assert(directUi.cards.some((text) => text.includes('Возрастное ограничение')), 'ageRestrictedMock product should render');
  assert(!directUi.cards.some((text) => text.includes('Скрытый товар')), 'visible=false product should be hidden');
  assert(!directUi.cards.some((text) => text.includes('Недоступный товар')), 'available=false product should be hidden');
  assert(directUi.placeholderCount > 0, 'No-image product should render placeholder');
  assert(directUi.textareaCount === 0, 'Showcase page should not expose catalog textarea import');
  assert(directUi.fileInputCount === 0, 'Showcase page should not expose catalog file import');

  await page.locator('.showcase-product-card[data-id="product-water-001"]').click();
  await page.waitForFunction(() => document.querySelector('.showcase-cart-items')?.textContent.includes('Вода питьевая'));

  const secondResult = await page.evaluate((payload) => window.Showcase.receiveCatalog(payload), JSON.stringify(sampleCatalog));
  assert(secondResult.ok === true, 'Second catalog apply should be ok');
  const cartAfterReplace = await page.locator('.showcase-cart-items').first().textContent();
  assert(cartAfterReplace.includes('Корзина пуста'), 'Demo cart should be cleared after catalog replacement');

  await page.getByRole('button', { name: 'Выпечка' }).click();
  const longTitleCard = await page.locator('.showcase-product-card[data-id="product-long-title-002"]').boundingBox();
  assert(longTitleCard && longTitleCard.height <= 320, `Long title card should stay bounded, got ${longTitleCard?.height}`);

  const invalidResult = await page.evaluate(() => window.Showcase.receiveCatalog('{invalid-json'));
  assert(invalidResult.ok === false, 'Invalid JSON should return ok=false');
  assert(invalidResult.errors.includes('catalog-json-invalid'), 'Invalid JSON should report catalog-json-invalid');
  await page.waitForFunction(() => document.body.textContent.includes('Очень длинное название товара'));

  const mailboxCatalog = makeMailboxCatalog();
  await page.evaluate((payload) => {
    const node = document.getElementById('showcase-catalog-mailbox');
    node.textContent = payload;
    node.setAttribute('data-updated-at', String(Date.now()));
  }, JSON.stringify(mailboxCatalog));
  await page.waitForFunction(() => {
    const node = document.getElementById('showcase-catalog-result-mailbox');
    try {
      const result = JSON.parse(node?.textContent || '{}');
      return result.ok === true && result.catalogId === 'showcase-mailbox-smoke';
    } catch {
      return false;
    }
  });

  const mailboxStatus = JSON.parse(await page.evaluate(() => window.Showcase.getCatalogStatusJson()));
  assert(mailboxStatus.ok === true, 'Mailbox catalog status should be ok');
  assert(mailboxStatus.catalogId === 'showcase-mailbox-smoke', 'Mailbox catalogId mismatch');
  await page.waitForFunction(() => document.body.textContent.includes('Товар из DOM mailbox'));

  const finalRuntimeInfo = await page.evaluate(() => window.Showcase.getRuntimeInfo());
  assert(finalRuntimeInfo.catalogStatus.source === '1c', 'Final catalog source should be 1c');
  assert(finalRuntimeInfo.catalogStatus.catalogId === 'showcase-mailbox-smoke', 'Final runtime catalogId mismatch');

  assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join('\n')}`);

  console.log(JSON.stringify({
    ok: true,
    targetUrl,
    directResult,
    mailboxStatus,
    runtimeInfo: finalRuntimeInfo
  }, null, 2));
} finally {
  await browser.close();
}
