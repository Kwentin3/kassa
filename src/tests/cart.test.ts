import { describe, expect, it } from 'vitest';
import { products } from '../data/products';
import { addProductToCart, cartTotal, changeQuantity, removeProductFromCart } from '../services/cart';

describe('cart service', () => {
  it('adds products and increments repeated scans', () => {
    const milk = products.find((product) => product.id === 'milk-25')!;
    const items = addProductToCart(addProductToCart([], milk), milk);
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
    expect(cartTotal(items)).toBe(milk.price * 2);
  });

  it('changes quantity and removes items', () => {
    const milk = products.find((product) => product.id === 'milk-25')!;
    const items = addProductToCart([], milk);
    expect(changeQuantity(items, milk.id, -1)).toEqual([]);
    expect(removeProductFromCart(items, milk.id)).toEqual([]);
  });
});
