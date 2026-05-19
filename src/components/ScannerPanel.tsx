import { Camera, Keyboard, ScanLine, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserScannerAdapter, type ScannerError } from '../services/scanner';
import { useTerminalStore } from '../state/store';
import { Button, TextInput } from './ui';

export const ScannerPanel = () => {
  const { demo, addCode, setScannerMode, dispatch } = useTerminalStore();
  const [code, setCode] = useState('4600001000011');
  const [cameraError, setCameraError] = useState<ScannerError | null>(null);
  const scanner = useMemo(() => new BrowserScannerAdapter(), []);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (demo.scannerMode !== 'camera') return undefined;
    setCameraError(null);
    scanner.start('camera', 'camera-reader', addCode, setCameraError);
    return () => {
      scanner.stop();
    };
  }, [addCode, demo.scannerMode, scanner]);

  useEffect(() => {
    if (demo.scannerMode === 'keyboard') inputRef.current?.focus();
  }, [demo.scannerMode]);

  const submit = () => {
    if (!code.trim()) return;
    addCode(code.trim());
  };

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[18px] font-bold text-slate-500">Добавление товара</div>
          <div className="text-[28px] font-black">Сканируйте или введите код</div>
        </div>
        <div className="flex gap-2">
          <Button variant={demo.scannerMode === 'camera' ? 'primary' : 'secondary'} className="min-h-[54px] px-4 text-[17px]" onClick={() => setScannerMode('camera')}>
            <Camera size={20} /> Камера
          </Button>
          <Button variant={demo.scannerMode === 'mock_input' ? 'primary' : 'secondary'} className="min-h-[54px] px-4 text-[17px]" onClick={() => setScannerMode('mock_input')}>
            <ScanLine size={20} /> Код
          </Button>
          <Button variant={demo.scannerMode === 'keyboard' ? 'primary' : 'secondary'} className="min-h-[54px] px-4 text-[17px]" onClick={() => setScannerMode('keyboard')}>
            <Keyboard size={20} /> USB
          </Button>
        </div>
      </div>

      {demo.scannerMode === 'camera' && (
        <div className="mt-4 grid grid-cols-[1fr_320px] gap-4">
          <div id="camera-reader" className="flex min-h-[230px] items-center justify-center rounded-lg border border-slate-200 bg-slate-900 text-white">
            <div className="text-center text-[20px] font-bold">
              Камера demo scanner
              <div className="mt-2 text-[16px] font-semibold text-slate-300">Нужен HTTPS и разрешение камеры</div>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-[18px] font-semibold text-slate-600">
            {cameraError ? (
              <>
                <div className="text-red-700">Камера недоступна: {cameraError}</div>
                <div className="mt-3">Используйте ввод кода, поиск или каталог.</div>
              </>
            ) : (
              <>Если камера не распознает код, демонстрация продолжится через fallback.</>
            )}
          </div>
        </div>
      )}

      {(demo.scannerMode === 'mock_input' || demo.scannerMode === 'keyboard') && (
        <form
          className="mt-4 flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextInput ref={inputRef} value={code} onChange={(event) => setCode(event.target.value)} aria-label="Код товара" className="flex-1" />
          <Button type="submit">
            <ScanLine size={24} /> Добавить
          </Button>
        </form>
      )}

      <div className="mt-4 flex gap-3">
        <Button variant="secondary" onClick={() => dispatch({ type: 'OPEN_SEARCH' })}>
          <Search size={24} /> Найти товар вручную
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'OPEN_CATALOG' })}>
          Открыть каталог
        </Button>
      </div>
    </section>
  );
};
