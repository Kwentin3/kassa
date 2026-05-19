import { products } from '../data/products';
import type { Product } from '../types';

export const normalizeText = (value: string): string =>
  value
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const searchableText = (product: Product): string =>
  normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      product.barcode,
      product.sku,
      product.packageSize,
      ...product.aliases,
      ...product.tags
    ]
      .filter(Boolean)
      .join(' ')
  );

export const findProductByCode = (code: string): Product | undefined => {
  const value = code.trim();
  return products.find((product) => product.barcode === value || product.sku.toLocaleLowerCase() === value.toLocaleLowerCase());
};

export const searchProducts = (query: string, source: Product[] = products): Product[] => {
  const normalized = normalizeText(query);
  if (normalized.length < 2) return [];
  return source.filter((product) => searchableText(product).includes(normalized)).slice(0, 18);
};

export const productsByCategory = (category: string): Product[] =>
  products.filter((product) => product.category === category && !product.hasPriceError);

export const popularProducts = (): Product[] =>
  products.filter((product) => product.tags.includes('популярное')).slice(0, 10);
