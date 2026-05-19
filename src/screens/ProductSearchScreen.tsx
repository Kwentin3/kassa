import { ArrowLeft, Delete } from 'lucide-react';
import { useMemo, useState } from 'react';
import { searchProducts } from '../services/catalog';
import { useTerminalStore } from '../state/store';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Button, Screen, TextInput } from '../components/ui';

const keys = ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б'];

export const ProductSearchScreen = () => {
  const { addProduct, dispatch, state } = useTerminalStore();
  const [query, setQuery] = useState(state.name === 'product_search' ? state.query : '');
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <Screen>
      <Header compact />
      <section className="grid h-[calc(100vh-104px)] grid-cols-[440px_1fr] gap-6 px-8 pb-8">
        <div className="panel flex flex-col p-5">
          <Button variant="secondary" className="mb-4 w-full" onClick={() => dispatch({ type: 'START_PURCHASE' })}>
            <ArrowLeft size={24} /> В корзину
          </Button>
          <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Молоко, банан, хлеб..." autoFocus />
          <div className="mt-4 grid grid-cols-5 gap-2">
            {keys.map((key) => (
              <button key={key} className="min-h-[58px] rounded-lg bg-slate-100 text-[22px] font-black" onClick={() => setQuery((value) => `${value}${key.toLocaleLowerCase('ru-RU')}`)}>
                {key}
              </button>
            ))}
            <button className="col-span-2 min-h-[58px] rounded-lg bg-slate-100 text-[22px] font-black" onClick={() => setQuery((value) => `${value} `)}>
              Пробел
            </button>
            <button className="col-span-2 min-h-[58px] rounded-lg bg-slate-100 text-[22px] font-black" onClick={() => setQuery('')}>
              Очистить
            </button>
            <button className="min-h-[58px] rounded-lg bg-slate-100 text-[22px] font-black" onClick={() => setQuery((value) => value.slice(0, -1))} aria-label="Удалить символ">
              <Delete className="mx-auto" />
            </button>
          </div>
        </div>
        <div className="overflow-auto">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="text-[18px] font-bold text-slate-500">Ручной поиск</div>
              <div className="text-[34px] font-black">{query.length < 2 ? 'Введите минимум 2 символа' : `Найдено: ${results.length}`}</div>
            </div>
            <Button variant="secondary" onClick={() => dispatch({ type: 'OPEN_CATALOG' })}>Каталог</Button>
          </div>
          {query.length >= 2 && results.length === 0 && (
            <div className="panel p-8 text-[24px] font-bold text-slate-600">
              Товар не найден. Измените запрос, откройте каталог или позовите сотрудника.
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 pb-8">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addProduct} />
            ))}
          </div>
        </div>
      </section>
    </Screen>
  );
};
