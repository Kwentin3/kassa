import type { PromoSlide } from '../types';

export const promoSlides: PromoSlide[] = [
  {
    id: 'season',
    title: 'Сезонные фрукты',
    subtitle: 'Яблоки, бананы и цитрусовые в каталоге',
    badge: 'Акция недели',
    imageTone: 'fruit',
    ctaText: 'Коснитесь экрана, чтобы начать покупку',
    durationSec: 8,
    isEnabled: true
  },
  {
    id: 'bakery',
    title: 'Свежая выпечка',
    subtitle: 'Добавьте круассан или хлеб без сканирования',
    badge: 'Популярное',
    imageTone: 'bakery',
    ctaText: 'Начать покупку',
    durationSec: 8,
    isEnabled: true
  },
  {
    id: 'lunch',
    title: 'Готовый обед',
    subtitle: 'Салаты, супы и напитки для быстрого выбора',
    badge: 'Новинки',
    imageTone: 'lunch',
    ctaText: 'Коснитесь экрана',
    durationSec: 8,
    isEnabled: true
  },
  {
    id: 'broken-demo',
    title: 'Fallback promo',
    subtitle: 'Этот слайд имитирует битый рекламный ассет',
    badge: 'Demo',
    imageTone: 'broken',
    ctaText: 'Начать покупку',
    durationSec: 8,
    isEnabled: true,
    brokenAsset: true
  }
];
