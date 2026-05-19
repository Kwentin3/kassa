import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categories, products } from '../data/products';
import { productsByCategory, popularProducts } from '../services/catalog';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Button, Screen } from '../components/ui';

export const CatalogScreen = () => {
  const { addProduct, dispatch, state } = useTerminalStore();
  const [category, setCategory] = useState(state.name === 'catalog' ? state.categoryId ?? 'Популярные' : 'Популярные');
  const visibleProducts = useMemo(
    () => (category === 'Популярные' ? popularProducts() : productsByCategory(category)),
    [category]
  );
  const categoryList = ['Популярные', ...categories.filter((item) => item !== 'Сценарии')];

  return (
    <Screen>
      <Header compact />
      <section className="grid h-[calc(100vh-104px)] grid-cols-[310px_1fr] gap-6 px-8 pb-8">
        <nav className="panel flex flex-col gap-3 p-4">
          <Button variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В корзину
          </Button>
          {categoryList.map((item) => (
            <button
              className={`min-h-[58px] rounded-lg px-4 text-left text-[20px] font-black ${category === item ? 'bg-[var(--brand-primary)] text-white' : 'bg-slate-100 text-slate-800'}`}
              key={item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
          <button
            className="mt-auto min-h-[58px] rounded-lg bg-slate-200 px-4 text-left text-[18px] font-black"
            onClick={() => setCategory('Сценарии')}
          >
            Demo edge cases
          </button>
        </nav>
        <div className="overflow-auto">
          <div className="mb-4">
            <div className="text-[18px] font-bold text-slate-500">Каталог товаров</div>
            <div className="text-[36px] font-black">{category}</div>
          </div>
          <div className="grid grid-cols-4 gap-4 pb-8">
            {(category === 'Сценарии' ? products.filter((item) => item.category === 'Сценарии') : visibleProducts).map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addProduct} />
            ))}
          </div>
        </div>
      </section>
    </Screen>
  );
};
