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
});
