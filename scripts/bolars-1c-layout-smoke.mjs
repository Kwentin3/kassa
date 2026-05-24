import { chromium } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1 (KHTML, like Gecko) V8WebKit';
const artifactPath = path.resolve('dist/bolars/self-checkout-mvp-1c.html');

if (!existsSync(artifactPath)) {
  throw new Error(`1C HTML artifact is missing: ${artifactPath}. Run npm run build first.`);
}

const artifactUrl = pathToFileURL(artifactPath).href;

const viewports = [
  { name: '1cDiagnostic', width: 1628, height: 823 },
  { name: 'landscape1366', width: 1366, height: 768 },
  { name: 'landscape1280', width: 1280, height: 800 },
  { name: 'fullscreen1080p', width: 1920, height: 1080 },
  { name: 'portrait1080', width: 1080, height: 1920 }
];

const scenarios = [
  {
    id: 'startIdle',
    critical: ['.bolars-brand-header', '.bolars-scan-hero', '.bolars-start-actions', '.bolars-help-card']
  },
  {
    id: 'cartEmpty',
    critical: ['.bolars-work-header', '.bolars-search-region', '.bolars-scan-action-card', '.bolars-empty-cart', '.bolars-cart-summary-band']
  },
  {
    id: 'cartOneItem',
    critical: ['.bolars-work-header', '.bolars-search-region', '.bolars-scan-action-card', '.bolars-cart-line', '.bolars-cart-summary-band', '.bolars-primary-action']
  },
  {
    id: 'cartManyItems',
    critical: ['.bolars-work-header', '.bolars-search-region', '.bolars-scan-action-card', '.bolars-cart-line', '.bolars-cart-summary-band', '.bolars-primary-action']
  },
  {
    id: 'textScaleExtraLarge',
    critical: ['.bolars-work-header', '.bolars-search-region', '.bolars-scan-action-card', '.bolars-cart-line', '.bolars-cart-summary-band', '.bolars-primary-action']
  },
  {
    id: 'paymentSetup',
    critical: ['.bolars-work-header', '.bolars-review-panel', '.bolars-package-panel', '.bolars-discount-panel', '.bolars-final-total-band', '.bolars-pay-bottom']
  },
  {
    id: 'paymentWaiting',
    critical: ['.bolars-brand-header', '.bolars-payment-title-block', '.bolars-payment-amount-card', '.bolars-payment-visual', '.bolars-payment-waiting-line']
  },
  {
    id: 'paymentError',
    critical: ['.bolars-brand-header', '.bolars-status-card', '.bolars-total', '.bolars-start-actions']
  },
  {
    id: 'finalSuccess',
    critical: ['.bolars-brand-header', '.bolars-success-mark', '.bolars-receipt-preview', '.bolars-countdown-card']
  }
];

const failures = [];
const rows = [];

const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    screen: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow',
    userAgent
  });

  await context.addInitScript(() => {
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: () => {
        throw new Error('fetch is unavailable in the 1C compatibility profile');
      }
    });
    Object.defineProperty(window, 'PointerEvent', { configurable: true, value: undefined });
    try {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    } catch {
      // Some engines keep navigator fields non-configurable; absence is also checked in page metrics.
    }
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  for (const scenario of scenarios) {
    const url = `${artifactUrl}?debug=1&preview=1&scenario=${scenario.id}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForSelector('.bolars-root', { timeout: 30000 });
    await page.addStyleTag({ content: '.bolars-debug-panel,.bolars-preview-panel{display:none!important}' });
    await page.waitForTimeout(150);

    const metrics = await page.evaluate((selectors) => {
      const rectOf = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return { selector, missing: true };
        const rect = element.getBoundingClientRect();
        return {
          selector,
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          offBottom: Math.max(0, Math.round(rect.bottom - window.innerHeight)),
          offRight: Math.max(0, Math.round(rect.right - window.innerWidth))
        };
      };
      const stage = document.querySelector('.bolars-stage')?.getBoundingClientRect();
      const cta = document.querySelector('.bolars-cart-summary-band .bolars-primary-action');
      return {
        rootClass: document.querySelector('.bolars-root')?.className ?? '',
        bodyScrollWidth: document.body.scrollWidth,
        bodyScrollHeight: document.body.scrollHeight,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        stage: stage
          ? {
              x: Math.round(stage.x),
              width: Math.round(stage.width),
              right: Math.round(stage.right),
              leftGutter: Math.round(stage.x),
              rightGutter: Math.round(window.innerWidth - stage.right)
            }
          : null,
        ctaPosition: cta ? getComputedStyle(cta).position : null,
        fetchType: typeof window.fetch,
        pointerType: typeof window.PointerEvent,
        clipboardType: typeof navigator.clipboard,
        critical: selectors.map(rectOf)
      };
    }, scenario.critical);

    const label = `${viewport.name}/${scenario.id}`;
    rows.push({
      label,
      stageWidth: metrics.stage?.width,
      leftGutter: metrics.stage?.leftGutter,
      rightGutter: metrics.stage?.rightGutter,
      maxOffBottom: Math.max(...metrics.critical.map((item) => item.offBottom ?? 0))
    });

    if (!metrics.rootClass.includes('bolars-embed-onec')) failures.push(`${label}: root is missing bolars-embed-onec`);
    if (!metrics.stage) failures.push(`${label}: .bolars-stage is missing`);
    if (metrics.stage && Math.abs(metrics.stage.width - viewport.width) > 1) failures.push(`${label}: stage width ${metrics.stage.width} != viewport width ${viewport.width}`);
    if (metrics.stage && (Math.abs(metrics.stage.leftGutter) > 1 || Math.abs(metrics.stage.rightGutter) > 1)) {
      failures.push(`${label}: stage gutters left=${metrics.stage.leftGutter} right=${metrics.stage.rightGutter}`);
    }
    if (metrics.bodyScrollWidth > viewport.width + 1) failures.push(`${label}: horizontal scroll body=${metrics.bodyScrollWidth} viewport=${viewport.width}`);
    for (const item of metrics.critical) {
      if (item.missing) failures.push(`${label}: missing ${item.selector}`);
      if ((item.offBottom ?? 0) > 0) failures.push(`${label}: ${item.selector} offBottom=${item.offBottom}`);
      if ((item.offRight ?? 0) > 0) failures.push(`${label}: ${item.selector} offRight=${item.offRight}`);
    }
    if (metrics.ctaPosition === 'sticky') failures.push(`${label}: cart primary CTA is position: sticky`);
    if (metrics.fetchType !== 'function') failures.push(`${label}: fetch guard was not installed`);
    if (metrics.pointerType !== 'undefined') failures.push(`${label}: PointerEvent should be unavailable in 1C profile`);
  }

  if (consoleErrors.length > 0) {
    failures.push(`${viewport.name}: console/page errors: ${consoleErrors.join(' | ')}`);
  }

  await context.close();
}

await browser.close();

console.table(rows);

if (failures.length > 0) {
  console.error('1C layout smoke failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('1C layout smoke passed.');
