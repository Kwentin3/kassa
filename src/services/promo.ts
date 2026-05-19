import { promoSlides } from '../data/promoSlides';
import type { PromoSlide } from '../types';

export const enabledPromoSlides = (): PromoSlide[] =>
  promoSlides.filter((slide) => slide.isEnabled && !slide.brokenAsset);

export const nextPromoSlide = (currentId?: string): PromoSlide => {
  const slides = enabledPromoSlides();
  if (slides.length === 0) return promoSlides[0];
  const index = Math.max(0, slides.findIndex((slide) => slide.id === currentId));
  return slides[(index + 1) % slides.length];
};
