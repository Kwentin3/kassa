import { BOLARS_ROUTE } from './defaults';
import { BaseRuntimeAdapter } from './baseAdapter';
import { OneCInterfaceAdapter } from './onecInterfaceAdapter';
import type { RuntimeAdapterFactoryResult } from './adapterFactory';

export type BolarsSelfCheckoutApi = {
  getRuntimeInfo: () => Record<string, unknown>;
  getRuntimeInfoJson: () => string;
  receiveStateSnapshot: (snapshotJsonString: string) => string;
  receiveRuntimeConfig: (configJsonString: string) => string;
  receiveCatalog: (catalogJsonString: string) => string;
  getLastApplyStatusJson: () => string;
  getDebugStateJson: () => string;
  drainOutboundCommandsJson: () => string;
  peekOutboundStatusJson: () => string;
};

declare global {
  interface Window {
    BolarsSelfCheckout?: BolarsSelfCheckoutApi;
  }
}

export const exposeBolarsSelfCheckoutApi = (factoryResult: RuntimeAdapterFactoryResult): BolarsSelfCheckoutApi => {
  const runtime = factoryResult.runtime as BaseRuntimeAdapter;
  const onec = factoryResult.runtime instanceof OneCInterfaceAdapter ? factoryResult.runtime : null;

  const api: BolarsSelfCheckoutApi = {
    getRuntimeInfo: () => ({
      apiVersion: '0.1',
      ready: true,
      mode: 'bolars-self-checkout-mvp',
      debug: factoryResult.debugMode,
      route: BOLARS_ROUTE,
      buildId: factoryResult.routeContext.buildId,
      runtimePortStatus: 'ready',
      adapterKind: factoryResult.adapterKind,
      lastSnapshotVersion: factoryResult.runtime.getState().snapshotVersion
    }),
    getRuntimeInfoJson: () => JSON.stringify(api.getRuntimeInfo()),
    receiveStateSnapshot: (snapshotJsonString: string) => JSON.stringify(runtime.receiveStateSnapshot(snapshotJsonString)),
    receiveRuntimeConfig: () =>
      JSON.stringify({
        ok: true,
        kind: 'config',
        warnings: ['receiveRuntimeConfig is reserved; first slice reads config from snapshot.'],
        updatedAt: new Date().toISOString()
      }),
    receiveCatalog: () =>
      JSON.stringify({
        ok: true,
        kind: 'catalog',
        warnings: ['receiveCatalog is reserved for preload/search data and is not a cart runtime path.'],
        updatedAt: new Date().toISOString()
      }),
    getLastApplyStatusJson: () => JSON.stringify(runtime.getLastApplyStatus()),
    getDebugStateJson: () => JSON.stringify(runtime.getDebugState()),
    drainOutboundCommandsJson: () => onec?.drainOutboundCommandsJson() ?? JSON.stringify({ ok: true, commands: [], drainedAt: new Date().toISOString(), mode: factoryResult.adapterKind === 'preview' ? 'previewLocal' : 'notOneCAdapter' }),
    peekOutboundStatusJson: () => onec?.peekOutboundStatusJson() ?? JSON.stringify({ ok: true, pendingCount: 0, queuedCount: 0, drainedCount: 0, processingCount: 0, failedCount: 0, timeoutCount: 0, queueOverflow: false, mode: factoryResult.adapterKind === 'preview' ? 'previewLocal' : 'notOneCAdapter' })
  };

  window.BolarsSelfCheckout = api;
  return api;
};
