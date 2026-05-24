import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

type HtmlAsset = {
  type: 'asset';
  fileName: string;
  source: string | Uint8Array;
};

type CssAsset = HtmlAsset;

type JsChunk = {
  type: 'chunk';
  fileName: string;
  code: string;
};

type BundleItem = HtmlAsset | CssAsset | JsChunk;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const assetSourceToString = (source: HtmlAsset['source']): string => (typeof source === 'string' ? source : Buffer.from(source).toString('utf8'));

const isHtmlAsset = (item: BundleItem): item is HtmlAsset => item.type === 'asset' && item.fileName.endsWith('.html');

const isCssAsset = (item: BundleItem): item is CssAsset => item.type === 'asset' && item.fileName.endsWith('.css');

const isJsChunk = (item: BundleItem): item is JsChunk => item.type === 'chunk';

const wrapClassicBrowserScript = (code: string): string => `<script>
(function (run) {
  if (document.readyState === 'loading') {
    if (document.addEventListener) {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      window.attachEvent('onload', run);
    }
  } else {
    run();
  }
})(function () {
${code}
});
</script>`;

const inlineHtmlAssetsPlugin = (): Plugin => ({
  name: 'inline-html-assets-for-1c-handoff',
  enforce: 'post',
  generateBundle(_, bundle) {
    const items = Object.values(bundle) as BundleItem[];
    const htmlAssets = items.filter(isHtmlAsset);
    const inlinedFileNames = new Set<string>();

    for (const htmlAsset of htmlAssets) {
      let html = assetSourceToString(htmlAsset.source);

      for (const item of items) {
        if (!isCssAsset(item)) continue;
        const fileName = item.fileName.replace(/\\/g, '/');
        const sourcePattern = `(?:\\./|/)?${escapeRegExp(fileName)}`;
        const stylesheetPattern = new RegExp(`<link\\b(?=[^>]*\\brel=["']stylesheet["'])(?=[^>]*\\bhref=["']${sourcePattern}["'])[^>]*>`, 'g');
        if (!stylesheetPattern.test(html)) continue;
        html = html.replace(stylesheetPattern, () => `<style>\n${assetSourceToString(item.source)}\n</style>`);
        inlinedFileNames.add(item.fileName);
      }

      for (const item of items) {
        if (!isJsChunk(item)) continue;
        const fileName = item.fileName.replace(/\\/g, '/');
        const sourcePattern = `(?:\\./|/)?${escapeRegExp(fileName)}`;
        const scriptPattern = new RegExp(`<script\\b(?=[^>]*\\bsrc=["']${sourcePattern}["'])[^>]*></script>`, 'g');
        if (!scriptPattern.test(html)) continue;
        html = html.replace(scriptPattern, () => wrapClassicBrowserScript(item.code));
        inlinedFileNames.add(item.fileName);
      }

      htmlAsset.source = html;
    }

    for (const fileName of inlinedFileNames) {
      delete bundle[fileName];
    }

    const leftovers = Object.values(bundle).filter((item) => !(item.type === 'asset' && item.fileName.endsWith('.html')));
    if (leftovers.length > 0) {
      this.error(`1C HTML export must contain only HTML, but Vite emitted: ${leftovers.map((item) => item.fileName).join(', ')}`);
    }
  }
});

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [react(), tailwindcss(), inlineHtmlAssetsPlugin()],
  build: {
    outDir: 'dist-1c',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2015',
    cssCodeSplit: false,
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    rollupOptions: {
      input: resolve(projectRoot, 'bolars-self-checkout.html'),
      output: {
        inlineDynamicImports: true
      }
    }
  }
});
