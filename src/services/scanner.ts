import type { ScannerMode } from '../types';

export type ScannerError = 'permission_denied' | 'no_camera' | 'not_supported' | 'decode_timeout' | 'unknown';

export interface ScannerAdapter {
  start(mode: ScannerMode, elementId: string, onCode: (code: string) => void, onError: (error: ScannerError) => void): Promise<void>;
  stop(): Promise<void>;
}

export class BrowserScannerAdapter implements ScannerAdapter {
  private scanner: import('html5-qrcode').Html5Qrcode | null = null;

  async start(mode: ScannerMode, elementId: string, onCode: (code: string) => void, onError: (error: ScannerError) => void): Promise<void> {
    if (mode !== 'camera') return;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      onError('not_supported');
      return;
    }
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(elementId);
      this.scanner = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 180 } },
        (decodedText: string) => onCode(decodedText),
        () => undefined
      );
    } catch (error) {
      const text = String(error);
      if (text.toLowerCase().includes('permission')) onError('permission_denied');
      else if (text.toLowerCase().includes('camera')) onError('no_camera');
      else onError('unknown');
    }
  }

  async stop(): Promise<void> {
    if (!this.scanner) return;
    try {
      await this.scanner.stop();
      await this.scanner.clear();
    } finally {
      this.scanner = null;
    }
  }
}
