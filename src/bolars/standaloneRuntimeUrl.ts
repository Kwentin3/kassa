import { BOLARS_ROUTE } from './runtime/defaults';

const PUBLIC_CONTEXT_ORIGIN = 'https://kassa.speechbattle.com';

export const createStandaloneRuntimeUrl = (href: string): string => {
  const source = new URL(href);
  const runtimeUrl = new URL(BOLARS_ROUTE, PUBLIC_CONTEXT_ORIGIN);
  runtimeUrl.search = source.search;
  runtimeUrl.hash = source.hash;
  if (source.pathname.endsWith('/self-checkout-mvp-1c.html')) {
    runtimeUrl.searchParams.set('runtimeProfile', 'embeddedOneC');
  }
  return runtimeUrl.toString();
};
