import { Plus } from 'lucide-react';
import { productImageUrl } from '../services/productImages';
import type { Product } from '../types';
import { Button, ProductVisual, StatusPill } from './ui';

export const ProductCard = ({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) => {
  const blocked = product.isUnavailable || product.hasPriceError;
  return (
    <article className="panel product-card flex flex-col gap-3 p-3">
      <ProductVisual tone={product.imageTone} imageUrl={productImageUrl(product)} label={product.name} />
      <div className="product-card-copy">
        <h3 className="product-card-title text-[clamp(18px,1.8vw,21px)] font-black leading-tight">{product.name}</h3>
        <p className="product-card-meta mt-1 text-[15px] font-semibold text-slate-600">{product.brand} · {product.packageSize}</p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <div className="text-[clamp(22px,2.2vw,26px)] font-black">{product.price ? `${product.price} ₽` : 'Проверка'}</div>
        {product.requiresStaffApproval && <StatusPill>Сотрудник</StatusPill>}
        {blocked && <StatusPill>Demo error</StatusPill>}
      </div>
      <Button className="mt-auto w-full px-3 text-[18px]" variant={blocked ? 'secondary' : 'primary'} onClick={() => onAdd(product)}>
        <Plus size={24} /> Добавить
      </Button>
    </article>
  );
};
