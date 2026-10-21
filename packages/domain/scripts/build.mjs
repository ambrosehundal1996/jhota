import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

// One ESM file so Node on Vercel can import @jota/domain. tsc emit uses
// extensionless relative imports, which crash serverless functions at load time.
await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  packages: 'external',
  logLevel: 'info',
});

const dts = spawnSync('npx', ['tsc', '-p', 'tsconfig.build.json', '--emitDeclarationOnly'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (dts.status !== 0) process.exit(dts.status ?? 1);
