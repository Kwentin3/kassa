import { describe, expect, it } from 'vitest';
import { findProductByCode, normalizeText, searchProducts } from '../services/catalog';

describe('catalog service', () => {
  it('normalizes cyrillic text and finds partial matches', () => {
    expect(normalizeText('  ЁГУРТ, Ягодный! ')).toBe('егурт ягодный');
    const results = searchProducts('мол');
    expect(results.some((product) => product.name.includes('Молоко'))).toBe(true);
  });

  it('finds products by barcode', () => {
    expect(findProductByCode('4600001000011')?.id).toBe('milk-25');
  });

  it('hides edge-case products when demo edge cases are disabled', () => {
    expect(searchProducts('энергетик', undefined, true).some((product) => product.requiresStaffApproval)).toBe(true);
    expect(searchProducts('энергетик', undefined, false)).toEqual([]);
  });
});
