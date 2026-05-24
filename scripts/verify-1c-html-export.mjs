import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourcePath = resolve(projectRoot, 'dist-1c/bolars-self-checkout.html');
const publishPath = resolve(projectRoot, 'dist/bolars/self-checkout-mvp-1c.html');
const shouldPublish = process.argv.includes('--publish');

const checks = [
  {
    label: 'ES module script',
    pattern: /type\s*=\s*["']module["']/i
  },
  {
    label: 'external script',
    pattern: /<script\b(?=[^>]*\bsrc\s*=)[^>]*>/i
  },
  {
    label: 'external stylesheet',
    pattern: /<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])[^>]*>/i
  },
  {
    label: 'optional chaining or nullish coalescing',
    pattern: /\?\.|\?\?/
  },
  {
    label: 'fetch dependency',
    pattern: /\bfetch\s*\(/
  },
  {
    label: 'hashed external asset reference',
    pattern: /\/assets\/|(?:href|src)\s*=\s*["'][^"']+\.(?:js|css)(?:["'?])/i
  }
];

const html = await readFile(sourcePath, 'utf8');
const failures = checks.filter((check) => check.pattern.test(html)).map((check) => check.label);

if (failures.length > 0) {
  throw new Error(`1C HTML export is not V8WebKit-safe: ${failures.join(', ')}`);
}

if (shouldPublish) {
  await mkdir(dirname(publishPath), { recursive: true });
  await copyFile(sourcePath, publishPath);
  console.log(`1C HTML export verified and published: ${publishPath}`);
} else {
  console.log(`1C HTML export verified: ${sourcePath}`);
}
