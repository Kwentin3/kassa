import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const targetUrl = process.env.VISUAL_SMOKE_URL ?? 'https://kassa.speechbattle.com';
const screenshotPath = process.env.VISUAL_SMOKE_SCREENSHOT ?? '.deploy/visual-product-cards.png';

const startPurchase = 'Начать покупку';
const openCatalog = 'Открыть каталог';
const bags = 'Пакеты';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1907, height: 820 }, deviceScaleFactor: 1 });

try {
  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: startPurchase }).click();
  await page.getByRole('button', { name: openCatalog }).click();
  await page.getByRole('button', { name: bags }).click();
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.product-card')].map((el) => {
      const rect = el.getBoundingClientRect();
      const image = el.querySelector('.product-visual')?.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        imageHeight: Math.round(image?.height ?? 0),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        hasShadow: style.boxShadow !== 'none',
        transitionProperty: style.transitionProperty
      };
    });

    const content = document.querySelector('section.catalog-layout > div.scroll-y');
    return {
      cards,
      contentHasVerticalScroll: content ? content.scrollHeight > content.clientHeight : null,
      bodyHasVerticalScroll: document.documentElement.scrollHeight > document.documentElement.clientHeight
    };
  });

  if (result.cards.length !== 2) {
    throw new Error(`Expected 2 product cards in Pакеты category, got ${result.cards.length}`);
  }

  for (const card of result.cards) {
    if (card.width > 260) throw new Error(`Product card is too wide: ${card.width}px`);
    if (card.height > 360) throw new Error(`Product card is too tall: ${card.height}px`);
    if (card.imageHeight > 130) throw new Error(`Product thumbnail is too tall: ${card.imageHeight}px`);
    if (!card.hasShadow) throw new Error('Product card should have a depth shadow');
    if (!card.transitionProperty.includes('transform')) throw new Error('Product card should animate transform for press feedback');
  }

  if (result.contentHasVerticalScroll) throw new Error('Catalog product content should not scroll for two compact cards');
  if (result.bodyHasVerticalScroll) throw new Error('Body/document should not scroll in kiosk layout');

  await mkdir(screenshotPath.split('/').slice(0, -1).join('/'), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const firstAction = page.locator('.product-card .product-card-action').first();
  await firstAction.hover();
  await page.mouse.down();
  await page.waitForTimeout(80);
  result.pressedTransform = await page.locator('.product-card').first().evaluate((el) => window.getComputedStyle(el).transform);
  await page.mouse.up();

  if (result.pressedTransform === 'none') {
    throw new Error('Product card should visually compress while add CTA is pressed');
  }

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
