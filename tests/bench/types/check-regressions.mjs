import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const compiler = join(dirname(require.resolve('typescript/package.json')), 'bin/tsc');
const config = fileURLToPath(new URL('./regressions/tsconfig.json', import.meta.url));

// A separate compiler process preserves the evaluation-order-sensitive failure from #8665.
const result = spawnSync(process.execPath, ['--max-old-space-size=2048', compiler, '-p', config], {
  encoding: 'utf8',
  timeout: 60_000,
});

if (result.status !== 0) {
  process.stderr.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  console.error('Repository parameter type regression failed.', result.error ?? result.signal ?? result.status);
  process.exit(1);
}

console.log('Repository parameter type regression passed within a 2 GB compiler heap.');
