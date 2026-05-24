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

  it('keeps BOLARS text scale as a header control and applies semantic scale variables', () => {
    expect(css).toContain('.bolars-brand-tools');
    expect(css).not.toContain('.bolars-accessibility-rail');
    expect(css).not.toContain('.bolars-start-scale-card');
    expect(css).toContain('--bolars-type-scale-body');
    expect(css).toContain('--bolars-type-scale-display');
    expect(css).toContain('--bolars-type-scale-control');
    expect(css).toContain('.bolars-scale-option-extraLarge');
    expect(css).toContain('font-size: var(--bolars-hero-font)');
  });

  it('keeps BOLARS theme surfaces tokenized for profile-specific controls', () => {
    expect(css).toContain('--bolars-container-bg');
    expect(css).toContain('--bolars-field-bg');
    expect(css).toContain('--bolars-button-bg');
    expect(css).toContain('--bolars-primary-bg');
    expect(css).toContain('background: var(--bolars-button-bg)');
    expect(css).toContain('background: var(--bolars-container-bg)');
  });

  it('keeps BOLARS button surfaces centralized and visibly pressable', () => {
    expect(css).toContain('Central BOLARS button-surface contract');
    expect(css).toContain('--bolars-button-surface-fill');
    expect(css).toContain('--bolars-button-card-fill');
    expect(css).toContain('--bolars-button-primary-fill');
    expect(css).toContain('--bolars-button-shadow-pressed');
    expect(css).toContain('--bolars-button-hover-transform');
    expect(css).toContain('--bolars-button-pressed-transform');
    expect(css).toContain('.bolars-primary-action:active:not(:disabled)');
    expect(css).toContain('.bolars-quantity-control button:active:not(:disabled)');
    expect(css).toContain('.bolars-package-grid button');
    expect(css).toContain('background-color: var(--bolars-button-card-fill)');
    expect(css).toContain('background-color: var(--bolars-button-primary-fill)');
    expect(css).toContain('@media (hover: hover) and (pointer: fine)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('keeps the debug panel from blocking customer actions', () => {
    expect(css).toContain('.bolars-debug-panel {');
    expect(css).toContain('pointer-events: none');
    expect(css).toContain('.bolars-debug-panel summary');
    expect(css).toContain('pointer-events: auto');
  });
});
