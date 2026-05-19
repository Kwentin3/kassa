import type { Product } from '../types';

const productImageTags: Record<string, string[]> = {
  'milk-25': ['milk', 'dairy'],
  kefir: ['kefir', 'dairy'],
  yogurt: ['yogurt', 'berries'],
  cheese: ['cheese', 'dairy'],
  'bread-rye': ['rye-bread', 'bakery'],
  'bread-white': ['bread', 'bakery'],
  croissant: ['croissant', 'bakery'],
  bun: ['cinnamon-roll', 'bakery'],
  apple: ['red-apple', 'fruit'],
  banana: ['banana', 'fruit'],
  orange: ['orange', 'fruit'],
  pear: ['pear', 'fruit'],
  tomato: ['tomato', 'vegetable'],
  cucumber: ['cucumber', 'vegetable'],
  potato: ['potato', 'vegetable'],
  carrot: ['carrot', 'vegetable'],
  water: ['water-bottle'],
  cola: ['soda-can'],
  'juice-apple': ['apple-juice'],
  'coffee-cup': ['coffee-cup'],
  salad: ['salad'],
  soup: ['soup'],
  sandwich: ['sandwich'],
  cutlet: ['lunch-box', 'meal'],
  'bag-small': ['shopping-bag'],
  'bag-big': ['shopping-bag'],
  eggs: ['eggs'],
  rice: ['rice'],
  pasta: ['spaghetti', 'pasta'],
  sugar: ['sugar'],
  tea: ['tea-box'],
  chocolate: ['chocolate'],
  cookies: ['cookies'],
  chips: ['potato-chips'],
  nuts: ['nuts'],
  icecream: ['ice-cream'],
  dumplings: ['dumplings'],
  detergent: ['dish-soap'],
  napkins: ['napkins'],
  watermelon: ['watermelon'],
  energy: ['energy-drink'],
  'promo-missing': ['barcode', 'product'],
  unavailable: ['empty-shelf', 'product'],
  'unknown-label': ['barcode', 'label'],
  'loyalty-card': ['loyalty-card']
};

const categoryTags: Record<string, string[]> = {
  Молочные: ['dairy'],
  Выпечка: ['bakery'],
  Фрукты: ['fruit'],
  Овощи: ['vegetable'],
  Напитки: ['drink'],
  'Готовая еда': ['ready-meal'],
  Пакеты: ['shopping-bag'],
  Бакалея: ['grocery'],
  Сладости: ['sweets'],
  Снеки: ['snack'],
  Заморозка: ['frozen-food'],
  Дом: ['home-goods'],
  Сценарии: ['barcode', 'product'],
  Лояльность: ['loyalty-card']
};

export const stableImageLock = (id: string): number =>
  [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) + 1000;

export const productImageTagsFor = (product: Product): string[] =>
  productImageTags[product.id] ?? categoryTags[product.category] ?? ['grocery', 'product'];

export const productImageUrl = (product: Product): string => {
  const tags = productImageTagsFor(product).map((tag) => encodeURIComponent(tag)).join(',');
  return `https://loremflickr.com/640/480/${tags}?lock=${stableImageLock(product.id)}`;
};
