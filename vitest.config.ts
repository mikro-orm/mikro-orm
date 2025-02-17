import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [swc.vite({
    jsc: { target: 'es2022' },
    sourceMaps: true,
  })],
  esbuild: {
    target: 'es2022',
    keepNames: true,
  },
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'cobertura'],
      include: [
        'packages/*/src/**/*.ts',
      ],
      exclude: [
        'packages/cli/src/cli.ts',
        'packages/cli/src/esm.ts',
        'packages/mikro-orm/src/index.ts',
      ],
    },
    reporters: ['default'],
    setupFiles: [
      './tests/setup.ts',
    ],
    globalSetup: './tests/globalSetup.ts',
    clearMocks: true,
    disableConsoleIntercept: true,
    isolate: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    alias: [
      { find: '@mikro-orm/mongo-highlighter', replacement: resolve('/node_modules/@mikro-orm/mongo-highlighter') },
      { find: '@mikro-orm/sql-highlighter', replacement: resolve('/node_modules/@mikro-orm/sql-highlighter') },
      { find: 'mikro-orm', replacement: resolve(__dirname, './packages/mikro-orm/src') },
      { find: /^@mikro-orm\/(.*)$/, replacement: resolve(__dirname, './packages/$1/src') },
    ],
    retry: process.env.RETRY_TESTS ? 3 : 0,
  },
});
