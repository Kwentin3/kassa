import type { CartItem, Product } from '../types';

export const addProductToCart = (items: CartItem[], product: Product): CartItem[] => {
  const existing = items.find((item) => item.productId === product.id);
  if (existing) {
    return items.map((item) =>
      item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
    );
  }
  return [
    ...items,
    {
      productId: product.id,
      quantity: 1,
      unitPrice: product.price,
      addedAt: new Date().toISOString()
    }
  ];
};

export const changeQuantity = (items: CartItem[], productId: string, delta: number): CartItem[] =>
  items
    .map((item) => (item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item))
    .filter((item) => item.quantity > 0);

export const removeProductFromCart = (items: CartItem[], productId: string): CartItem[] =>
  items.filter((item) => item.productId !== productId);

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export const cartCount = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity, 0);
