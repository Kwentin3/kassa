import { BaseRuntimeAdapter, type RuntimeRouteContext } from './baseAdapter';
import { getPreviewScenario, PREVIEW_SCENARIOS } from './previewScenarios';
import type { CommandResult, CurrentScreen, RuntimeDebugState, SelfCheckoutCommand, TextScale } from './types';

export class PreviewAdapter extends BaseRuntimeAdapter {
  private selectedScenarioId: string;
  private selectedTextScale: TextScale;

  constructor(routeContext: RuntimeRouteContext) {
    super('preview', routeContext);
    this.selectedScenarioId = routeContext.url.searchParams.get('scenario') ?? routeContext.url.searchParams.get('screen') ?? 'startIdle';
    this.selectedTextScale = (routeContext.url.searchParams.get('textScale') as TextScale | null) ?? 'normal';
    this.applySelectedScenario();
  }

  getScenarios() {
    return PREVIEW_SCENARIOS;
  }

  selectScenario(scenarioId: string, textScale: TextScale = this.selectedTextScale) {
    this.selectedScenarioId = scenarioId;
    this.selectedTextScale = textScale;
    this.applySelectedScenario();
  }

  override async dispatch(command: SelfCheckoutCommand): Promise<CommandResult> {
    if (command.type === 'setTextScale') {
      this.selectScenario(this.selectedScenarioId, command.payload.scale);
      return this.ok(command);
    }
    if (command.type === 'resetToStart') {
      this.selectScenario('startIdle');
      return this.ok(command);
    }
    this.applyCommandMetadata(command, { ok: true });
    this.setSnapshot({
      ...this.snapshot,
      lastProcessedCommandId: command.commandId,
      lastCommandResult: { ok: true, commandId: command.commandId, processedAt: new Date().toISOString() }
    });
    return { ok: true as const, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion };
  }

  override getDebugState(): RuntimeDebugState {
    const base = super.getDebugState();
    return {
      ...base,
      adapter: {
        ...base.adapter,
        adapterKind: 'preview',
        previewMode: true,
        selectedPreviewScreen: this.snapshot.currentScreen as CurrentScreen,
        selectedPreviewScenario: this.selectedScenarioId,
        previewSnapshotVersion: this.snapshot.snapshotVersion,
        outboundCommandsMode: 'local',
        previewWarning: 'Preview mode does not call 1С and does not perform business operations.'
      }
    };
  }

  private applySelectedScenario() {
    const scenario = getPreviewScenario(this.selectedScenarioId);
    this.selectedScenarioId = scenario.id;
    this.setSnapshot(scenario.createSnapshot(this.selectedTextScale));
  }
}
