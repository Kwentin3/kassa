import type { BrandConfig } from '../types';

export const brands: BrandConfig[] = [
  {
    id: 'demo-market',
    storeName: 'Витрина Маркет',
    logoText: 'ВМ',
    primaryColor: '#0f766e',
    accentColor: '#f59e0b',
    backgroundColor: '#f5f3ee',
    welcomeText: 'Добро пожаловать',
    tagline: 'Быстрая покупка без очереди',
    terminalNumber: 'T-01',
    idleBackground: 'fresh'
  },
  {
    id: 'city-food',
    storeName: 'City Food',
    logoText: 'CF',
    primaryColor: '#1d4ed8',
    accentColor: '#16a34a',
    backgroundColor: '#eef6ff',
    welcomeText: 'Городской магазин рядом',
    tagline: 'Сканируйте товары и оплачивайте сами',
    terminalNumber: 'T-12',
    idleBackground: 'city'
  },
  {
    id: 'farm-point',
    storeName: 'Ферма Point',
    logoText: 'FP',
    primaryColor: '#3f6212',
    accentColor: '#dc2626',
    backgroundColor: '#f4f1e7',
    welcomeText: 'Свежие продукты каждый день',
    tagline: 'Выберите товары, мы всё посчитаем',
    terminalNumber: 'T-07',
    idleBackground: 'farm'
  }
];
