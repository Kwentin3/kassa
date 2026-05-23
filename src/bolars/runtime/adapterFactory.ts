import { createRouteContext, type RuntimeRouteContext } from './baseAdapter';
import { MockAdapter } from './mockAdapter';
import { OneCInterfaceAdapter } from './onecInterfaceAdapter';
import { PreviewAdapter } from './previewAdapter';
import type { AdapterKind, SelfCheckoutRuntimePort, TextScale } from './types';

export type RuntimeAdapterFactoryResult = {
  runtime: SelfCheckoutRuntimePort;
  adapterKind: AdapterKind;
  previewMode: boolean;
  debugMode: boolean;
  routeContext: RuntimeRouteContext;
  warnings: string[];
  preview?: {
    scenarios: Array<{ id: string; label: string }>;
    selectScenario: (scenarioId: string, textScale?: TextScale) => void;
  };
};

export const createRuntimeAdapterFactory = (inputUrl: string | URL): RuntimeAdapterFactoryResult => {
  const routeContext = createRouteContext(inputUrl);
  const requested = routeContext.url.searchParams.get('adapter') as AdapterKind | null;
  const warnings: string[] = [];

  if (routeContext.url.searchParams.get('preview') === '1' && !routeContext.debug) {
    warnings.push('preview=1 ignored because debug=1 is required.');
  }

  if (routeContext.themeProfileWarning) {
    warnings.push(routeContext.themeProfileWarning);
  }

  let adapterKind: AdapterKind = 'mock';
  if (routeContext.preview || (routeContext.debug && requested === 'preview')) {
    adapterKind = 'preview';
  } else if (routeContext.debug && (requested === 'onec' || routeContext.runId?.startsWith('onec-'))) {
    adapterKind = 'onec';
  } else if (routeContext.debug && requested === 'mock') {
    adapterKind = 'mock';
  } else if (requested && !routeContext.debug) {
    warnings.push('adapter query ignored on customer route.');
  }

  if (adapterKind === 'preview') {
    const adapter = new PreviewAdapter(routeContext);
    return {
      runtime: adapter,
      adapterKind,
      previewMode: true,
      debugMode: routeContext.debug,
      routeContext,
      warnings,
      preview: {
        scenarios: adapter.getScenarios().map((scenario) => ({ id: scenario.id, label: scenario.label })),
        selectScenario: (scenarioId, textScale) => adapter.selectScenario(scenarioId, textScale)
      }
    };
  }

  if (adapterKind === 'onec') {
    return {
      runtime: new OneCInterfaceAdapter(routeContext),
      adapterKind,
      previewMode: false,
      debugMode: routeContext.debug,
      routeContext,
      warnings
    };
  }

  return {
    runtime: new MockAdapter(routeContext),
    adapterKind: 'mock',
    previewMode: false,
    debugMode: routeContext.debug,
    routeContext,
    warnings
  };
};
