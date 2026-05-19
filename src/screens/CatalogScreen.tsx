import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { categories, products } from '../data/products';
import { productsByCategory, popularProducts } from '../services/catalog';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Button, Screen } from '../components/ui';

export const CatalogScreen = () => {
  const { addProduct, dispatch, state, demo } = useTerminalStore();
  const [category, setCategory] = useState(state.name === 'catalog' ? state.categoryId ?? 'Популярные' : 'Популярные');
  const visibleProducts = useMemo(
    () => (category === 'Популярные' ? popularProducts(demo.edgeCasesEnabled) : productsByCategory(category, demo.edgeCasesEnabled)),
    [category, demo.edgeCasesEnabled]
  );
  const categoryList = ['Популярные', ...categories.filter((item) => item !== 'Сценарии')];

  return (
    <Screen>
      <Header compact />
      <section className="screen-body catalog-layout">
        <nav className="panel catalog-nav scroll-y flex flex-col gap-3 p-4">
          <Button className="catalog-nav-button catalog-nav-button-muted" variant="secondary" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В корзину
          </Button>
          {categoryList.map((item) => (
            <button
              aria-pressed={category === item}
              className={`catalog-nav-button ${category === item ? 'catalog-nav-button-active' : 'catalog-nav-button-muted'}`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
          <button
            className="catalog-nav-button catalog-nav-button-muted mt-auto text-[18px] disabled:opacity-45"
            onClick={() => setCategory('Сценарии')}
            disabled={!demo.edgeCasesEnabled}
            type="button"
          >
            {demo.edgeCasesEnabled ? 'Demo edge cases' : 'Edge cases выключены'}
          </button>
        </nav>
        <div className="scroll-y min-w-0">
          <div className="mb-4">
            <div className="text-[18px] font-bold text-slate-500">Каталог товаров</div>
            <div className="text-[36px] font-black">{category}</div>
          </div>
          <div className="product-grid">
            {(category === 'Сценарии' && demo.edgeCasesEnabled ? products.filter((item) => item.category === 'Сценарии') : visibleProducts).map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addProduct} />
            ))}
          </div>
        </div>
      </section>
    </Screen>
  );
};
