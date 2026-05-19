import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');

describe('visual contract css', () => {
  it('keeps product cards bounded instead of stretching single results', () => {
    expect(css).toContain('--product-card-min');
    expect(css).toContain('--product-card-max');
    expect(css).toContain('--product-image-height');
    expect(css).toContain('repeat(auto-fill');
    expect(css).toContain('justify-content: start');
    expect(css).toContain('max-width: var(--product-card-max)');
  });

  it('keeps product copy from expanding card dimensions', () => {
    expect(css).toContain('-webkit-line-clamp: 2');
    expect(css).toContain('text-overflow: ellipsis');
  });
});
