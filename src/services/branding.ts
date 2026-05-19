import type { BrandConfig } from '../types';

export const applyBrandTheme = (brand: BrandConfig): void => {
  const root = document.documentElement;
  root.style.setProperty('--brand-primary', brand.primaryColor);
  root.style.setProperty('--brand-accent', brand.accentColor);
  root.style.setProperty('--brand-bg', brand.backgroundColor);
};

const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '');
  const int = Number.parseInt(normalized, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};

const luminance = ([r, g, b]: [number, number, number]): number => {
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

export const hasReadableContrast = (foreground: string, background = '#ffffff'): boolean => {
  const l1 = luminance(hexToRgb(foreground));
  const l2 = luminance(hexToRgb(background));
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05) >= 3;
};
