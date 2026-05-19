import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { productImageTagsFor, productImageUrl, stableImageLock } from '../services/productImages';

describe('product image source', () => {
  it('builds deterministic https image urls for the catalog', () => {
    const urls = products.map((product) => productImageUrl(product));

    expect(urls).toHaveLength(products.length);
    expect(urls.every((url) => url.startsWith('https://loremflickr.com/640/480/'))).toBe(true);
    expect(urls.every((url) => url.includes('?lock='))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('uses product-specific tags before category fallback', () => {
    const milk = products.find((product) => product.id === 'milk-25')!;
    expect(productImageTagsFor(milk)).toEqual(['milk', 'dairy']);
    expect(stableImageLock(milk.id)).toBe(stableImageLock(milk.id));
  });
});
