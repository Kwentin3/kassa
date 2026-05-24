import { describe, expect, it } from 'vitest';
import { createRouteContext } from '../runtime/baseAdapter';
import { BOLARS_ROUTE } from '../runtime/defaults';
import { createStandaloneRuntimeUrl } from '../standaloneRuntimeUrl';

describe('BOLARS standalone HTML runtime URL', () => {
  it('keeps 1C/debug query parameters while normalizing the route away from the local file path', () => {
    const runtimeUrl = createStandaloneRuntimeUrl(
      'file:///C:/handoff/bolars-self-checkout.html?debug=1&adapter=onec&theme=bolars-light-contrast&runId=onec-demo#handoff'
    );
    const routeContext = createRouteContext(runtimeUrl);

    expect(routeContext.route).toBe(BOLARS_ROUTE);
    expect(routeContext.debug).toBe(true);
    expect(routeContext.runId).toBe('onec-demo');
    expect(routeContext.themeProfileId).toBe('bolars-light-contrast');
    expect(routeContext.presentationProfile).toBe('embeddedOneC');
    expect(routeContext.url.searchParams.get('adapter')).toBe('onec');
    expect(routeContext.url.hash).toBe('#handoff');
  });

  it('marks the published 1C html artifact as embedded while keeping the canonical runtime route', () => {
    const runtimeUrl = createStandaloneRuntimeUrl('file:///C:/handoff/self-checkout-mvp-1c.html?debug=1&preview=1&scenario=cartOneItem');
    const routeContext = createRouteContext(runtimeUrl);

    expect(routeContext.route).toBe(BOLARS_ROUTE);
    expect(routeContext.presentationProfile).toBe('embeddedOneC');
    expect(routeContext.url.searchParams.get('runtimeProfile')).toBe('embeddedOneC');
    expect(routeContext.url.searchParams.get('scenario')).toBe('cartOneItem');
  });
});
