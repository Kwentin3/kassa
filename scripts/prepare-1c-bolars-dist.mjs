import { copyFile, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourcePath = resolve(projectRoot, 'dist-1c/bolars-self-checkout.html');
const targetDir = resolve(projectRoot, 'dist-1c/bolars');
const targetPath = resolve(targetDir, 'index.html');

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await copyFile(sourcePath, targetPath);

console.log(`Prepared KioskRunner showcase output: ${targetPath}`);
