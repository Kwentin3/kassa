import { describe, expect, it } from 'vitest';
import { findProductByCode, normalizeText, searchProducts } from '../services/catalog';

describe('catalog service', () => {
  it('normalizes cyrillic text and finds partial matches', () => {
    expect(normalizeText('  ЁГУРТ, Ягодный! ')).toBe('еxpect-placeholder'.replace('xpect-placeholder', 'гурт ягодный'));
    const results = searchProducts('мол');
    expect(results.some((product) => product.name.includes('Молоко'))).toBe(true);
  });

  it('finds products by barcode', () => {
    expect(findProductByCode('4600001000011')?.id).toBe('milk-25');
  });
});
