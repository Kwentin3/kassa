import { createEmptySnapshot } from './defaults';
import { BaseRuntimeAdapter, maskSensitive, payloadSummary, type RuntimeRouteContext } from './baseAdapter';
import type { ApplyStatus, CommandResult, OutboundCommandRecord, RuntimeDebugState, SelfCheckoutCommand } from './types';

const MAX_PENDING_COMMANDS = 20;

export class OneCInterfaceAdapter extends BaseRuntimeAdapter {
  private records: OutboundCommandRecord[] = [];
  private queueOverflow = false;

  constructor(routeContext: RuntimeRouteContext) {
    super('onec', routeContext);
    this.snapshot = createEmptySnapshot('onec');
  }

  override async dispatch(command: SelfCheckoutCommand): Promise<CommandResult> {
    this.expireOldCommands();
    const pending = this.records.filter((record) => !['snapshotReceived', 'acknowledged', 'failed', 'timeout'].includes(record.status));
    if (pending.length >= MAX_PENDING_COMMANDS) {
      this.queueOverflow = true;
      const error = { code: 'queueOverflow' as const, message: 'Outbound command queue is full.' };
      this.records.push({ command, status: 'failed', queuedAt: new Date().toISOString(), completedAt: new Date().toISOString(), error });
      return { ok: false, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion, error };
    }

    if (command.type === 'startPayment' && pending.some((record) => record.command.type === 'startPayment')) {
      const error = { code: 'runtimeBusy' as const, message: 'Payment command already pending.' };
      this.records.push({ command, status: 'failed', queuedAt: new Date().toISOString(), completedAt: new Date().toISOString(), error });
      return { ok: false, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion, error };
    }

    this.records.push({ command, status: 'queued', queuedAt: new Date().toISOString() });
    this.notify({ type: 'commandAccepted', commandId: command.commandId, commandType: command.type });
    return { ok: true, commandId: command.commandId, snapshotVersion: this.snapshot.snapshotVersion };
  }

  drainOutboundCommandsJson(): string {
    this.expireOldCommands();
    const now = new Date().toISOString();
    const commands = this.records
      .filter((record) => record.status === 'queued')
      .map((record) => {
        record.status = 'drainedByOneC';
        record.drainedAt = now;
        return record.command;
      });
    return JSON.stringify({ ok: true, commands, drainedAt: now });
  }

  peekOutboundStatusJson(): string {
    this.expireOldCommands();
    return JSON.stringify({ ok: true, ...this.recordsToQueueState(this.records, this.queueOverflow), updatedAt: new Date().toISOString() });
  }

  override receiveStateSnapshot(snapshotJsonString: string): ApplyStatus {
    const status = super.receiveStateSnapshot(snapshotJsonString);
    if (status.ok && this.snapshot.lastProcessedCommandId) {
      const record = this.records.find((item) => item.command.commandId === this.snapshot.lastProcessedCommandId);
      if (record) {
        record.status = this.snapshot.lastCommandResult?.ok === false ? 'failed' : 'snapshotReceived';
        record.completedAt = new Date().toISOString();
        record.error = this.snapshot.lastCommandResult?.error;
      }
    }
    return status;
  }

  override getDebugState(): RuntimeDebugState {
    this.expireOldCommands();
    const base = super.getDebugState();
    const lastRecord = this.records[this.records.length - 1];
    return {
      ...base,
      adapter: {
        ...base.adapter,
        adapterKind: 'onec',
        previewMode: false,
        outboundCommandsMode: 'queued',
        pendingOutboundCount: this.recordsToQueueState(this.records, this.queueOverflow).pendingCount
      },
      outboundQueue: this.recordsToQueueState(this.records, this.queueOverflow),
      lastOutboundCommand: lastRecord
        ? {
            type: lastRecord.command.type,
            commandId: lastRecord.command.commandId,
            issuedAt: lastRecord.command.issuedAt,
            payloadSummary: payloadSummary(lastRecord.command),
            deliveryStatus: lastRecord.status
          }
        : null
    };
  }

  getSafeRecords() {
    return this.records.map((record) => ({
      ...record,
      command: {
        ...record.command,
        payload: maskSensitive(record.command.payload)
      }
    }));
  }

  private expireOldCommands() {
    const now = Date.now();
    for (const record of this.records) {
      if (['queued', 'drainedByOneC', 'processing'].includes(record.status) && now - Date.parse(record.queuedAt) > 30000) {
        record.status = 'timeout';
        record.completedAt = new Date().toISOString();
      }
    }
  }
}
