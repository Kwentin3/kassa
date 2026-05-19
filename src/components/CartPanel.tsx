import { Minus, Plus, Trash2, Undo2 } from 'lucide-react';
import { products } from '../data/products';
import { useTerminalStore } from '../state/store';
import { Button } from './ui';

export const CartPanel = () => {
  const { cart, lastRemoved, changeQty, removeItem, undoRemove, selectCartTotal, selectCartCount } = useTerminalStore();
  return (
    <aside className="cart-panel flex h-full flex-col border-l border-slate-200 bg-white p-5">
      <div>
        <div className="text-[18px] font-bold text-slate-500">Корзина</div>
        <div className="text-[34px] font-black">{selectCartCount()} шт.</div>
      </div>
      <div className="hide-scrollbar mt-4 flex-1 space-y-3 overflow-auto">
        {cart.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-[20px] font-semibold text-slate-500">
            Корзина пуста. Отсканируйте товар или найдите его вручную.
          </div>
        )}
        {cart.map((item) => {
          const product = products.find((entry) => entry.id === item.productId)!;
          return (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.productId}>
              <div className="flex justify-between gap-3">
                <div>
                  <div className="text-[19px] font-black leading-tight">{product.name}</div>
                  <div className="mt-1 text-[15px] font-semibold text-slate-500">{product.packageSize} · {item.unitPrice} ₽</div>
                </div>
                <button className="rounded-lg p-3 text-red-600 hover:bg-red-50" onClick={() => removeItem(item.productId)} aria-label="Удалить позицию">
                  <Trash2 size={24} />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="rounded-lg bg-white p-3 shadow-sm" onClick={() => changeQty(item.productId, -1)} aria-label="Уменьшить количество">
                    <Minus size={22} />
                  </button>
                  <div className="min-w-12 text-center text-[24px] font-black">{item.quantity}</div>
                  <button className="rounded-lg bg-white p-3 shadow-sm" onClick={() => changeQty(item.productId, 1)} aria-label="Увеличить количество">
                    <Plus size={22} />
                  </button>
                </div>
                <div className="text-[24px] font-black">{item.unitPrice * item.quantity} ₽</div>
              </div>
            </div>
          );
        })}
      </div>
      {lastRemoved && (
        <Button variant="secondary" className="mb-3 w-full" onClick={undoRemove}>
          <Undo2 size={22} /> Вернуть удалённый товар
        </Button>
      )}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-end justify-between">
          <span className="text-[20px] font-bold text-slate-500">Итого</span>
          <span className="text-[42px] font-black">{selectCartTotal()} ₽</span>
        </div>
      </div>
    </aside>
  );
};
