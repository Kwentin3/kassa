export const DEFAULT_BOLARS_THEME_PROFILE_ID = 'bolars-light-default';

export const BOLARS_SELECTABLE_THEME_PROFILE_IDS = [
  'bolars-light-default',
  'bolars-light-contrast',
  'bolars-light-clean',
  'bolars-light-promo'
] as const;

export const BOLARS_RESERVED_THEME_PROFILE_IDS = ['bolars-dark-optional', 'custom'] as const;

export type BolarsSelectableThemeProfileId = (typeof BOLARS_SELECTABLE_THEME_PROFILE_IDS)[number];
export type BolarsThemeProfileId = BolarsSelectableThemeProfileId | (typeof BOLARS_RESERVED_THEME_PROFILE_IDS)[number];

export const BOLARS_THEME_PROFILE_OPTIONS: Array<{ id: BolarsSelectableThemeProfileId; label: string }> = [
  { id: 'bolars-light-default', label: 'Default' },
  { id: 'bolars-light-contrast', label: 'Contrast' },
  { id: 'bolars-light-clean', label: 'Clean' },
  { id: 'bolars-light-promo', label: 'Promo' }
];

const SELECTABLE_THEME_PROFILE_SET = new Set<string>(BOLARS_SELECTABLE_THEME_PROFILE_IDS);
const KNOWN_THEME_PROFILE_SET = new Set<string>([...BOLARS_SELECTABLE_THEME_PROFILE_IDS, ...BOLARS_RESERVED_THEME_PROFILE_IDS]);

export const isBolarsThemeProfileId = (value: string | null | undefined): value is BolarsThemeProfileId => Boolean(value && KNOWN_THEME_PROFILE_SET.has(value));

export const isSelectableBolarsThemeProfileId = (value: string | null | undefined): value is BolarsSelectableThemeProfileId =>
  Boolean(value && SELECTABLE_THEME_PROFILE_SET.has(value));

export const resolveBolarsThemeProfileId = (value: string | null | undefined): BolarsSelectableThemeProfileId =>
  isSelectableBolarsThemeProfileId(value) ? value : DEFAULT_BOLARS_THEME_PROFILE_ID;

const bolarsThemeTokens = {
  'bolars-light-default': {
    '--bolars-brand-primary': '#E6007E',
    '--bolars-brand-primary-dark': '#A9005F',
    '--bolars-logo-black': '#111111',
    '--bolars-white': '#FFFFFF',
    '--bolars-background': '#F6F6F6',
    '--bolars-surface': '#FFFFFF',
    '--bolars-border': '#DADADA',
    '--bolars-text-primary': '#1A1A1A',
    '--bolars-text-secondary': '#666666',
    '--bolars-info': '#00A6C8',
    '--bolars-success': '#25A64A',
    '--bolars-promo': '#C9E600',
    '--bolars-warning': '#F5A623',
    '--bolars-error': '#D93025'
  },
  'bolars-light-contrast': {
    '--bolars-brand-primary': '#C9006E',
    '--bolars-brand-primary-dark': '#7F0048',
    '--bolars-logo-black': '#000000',
    '--bolars-white': '#FFFFFF',
    '--bolars-background': '#FFFFFF',
    '--bolars-surface': '#FFFFFF',
    '--bolars-border': '#8E8E8E',
    '--bolars-text-primary': '#000000',
    '--bolars-text-secondary': '#2F2F2F',
    '--bolars-info': '#007EA0',
    '--bolars-success': '#137A2F',
    '--bolars-promo': '#A9C800',
    '--bolars-warning': '#B86F00',
    '--bolars-error': '#B00020'
  },
  'bolars-light-clean': {
    '--bolars-brand-primary': '#D00072',
    '--bolars-brand-primary-dark': '#8E0052',
    '--bolars-logo-black': '#171717',
    '--bolars-white': '#FFFFFF',
    '--bolars-background': '#FAFAFA',
    '--bolars-surface': '#FFFFFF',
    '--bolars-border': '#E6E6E6',
    '--bolars-text-primary': '#202020',
    '--bolars-text-secondary': '#707070',
    '--bolars-info': '#149CB8',
    '--bolars-success': '#258F45',
    '--bolars-promo': '#D7EA4A',
    '--bolars-warning': '#E39A22',
    '--bolars-error': '#C9342B'
  },
  'bolars-light-promo': {
    '--bolars-brand-primary': '#E6007E',
    '--bolars-brand-primary-dark': '#97004F',
    '--bolars-logo-black': '#101010',
    '--bolars-white': '#FFFFFF',
    '--bolars-background': '#F8FAEE',
    '--bolars-surface': '#FFFFFF',
    '--bolars-border': '#D8DFD1',
    '--bolars-text-primary': '#181818',
    '--bolars-text-secondary': '#59605A',
    '--bolars-info': '#00A6C8',
    '--bolars-success': '#229E46',
    '--bolars-promo': '#C9E600',
    '--bolars-warning': '#F2A321',
    '--bolars-error': '#D93025'
  }
} satisfies Record<BolarsSelectableThemeProfileId, Record<string, string>>;

export const bolarsLightDefaultTokens = bolarsThemeTokens[DEFAULT_BOLARS_THEME_PROFILE_ID];

export const getBolarsThemeTokens = (profileId: string | null | undefined): Record<string, string> =>
  bolarsThemeTokens[resolveBolarsThemeProfileId(profileId)];
