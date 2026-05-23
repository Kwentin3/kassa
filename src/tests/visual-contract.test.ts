import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');

describe('visual contract css', () => {
  it('keeps product cards bounded instead of stretching single results', () => {
    expect(css).toContain('--product-card-width');
    expect(css).toContain('--product-card-max');
    expect(css).toContain('--product-image-height');
    expect(css).toContain('flex-wrap: wrap');
    expect(css).toContain('justify-content: flex-start');
    expect(css).toContain('width: var(--product-card-width)');
    expect(css).toContain('max-width: min(100%, var(--product-card-max))');
  });

  it('keeps product copy from expanding card dimensions', () => {
    expect(css).toContain('-webkit-line-clamp: 2');
    expect(css).toContain('text-overflow: ellipsis');
  });

  it('defines height-aware BOLARS landscape adaptation instead of portrait-only sizing', () => {
    expect(css).toContain('@media (orientation: landscape) and (max-height: 1100px)');
    expect(css).toContain('--bolars-brand-header-min: clamp');
    expect(css).toContain('--bolars-work-header-min: clamp');
    expect(css).toContain('--bolars-payment-visual-height: clamp');
    expect(css).toContain('height: calc(100dvh - var(--bolars-work-header-min))');
    expect(css).toContain('.bolars-payment-layout .bolars-main-column');
  });

  it('keeps BOLARS hidden states inside the adaptive stage', () => {
    expect(css).toContain('.bolars-screen-paymentSetup .bolars-help-card');
    expect(css).toContain('padding-block: min(var(--bolars-screen-pad), 20px)');
    expect(css).toContain('.bolars-payment-layout .bolars-review-panel');
    expect(css).toContain('max-height: 100%');
    expect(css).toContain('.bolars-screen-paymentWaiting .bolars-compact-order-items');
  });
});
