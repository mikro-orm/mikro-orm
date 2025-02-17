import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  plugins: [
    swc.vite({
      jsc: { target: 'es2022' },
      sourceMaps: true,
    }),
  ],
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
      { find: '@mikro-orm/mongo-highlighter', replacement: new URL('/node_modules/@mikro-orm/mongo-highlighter', import.meta.url).pathname },
      { find: '@mikro-orm/sql-highlighter', replacement: new URL('/node_modules/@mikro-orm/sql-highlighter', import.meta.url).pathname },
      { find: 'mikro-orm', replacement: new URL('./packages/mikro-orm/src', import.meta.url).pathname },
      { find: /^@mikro-orm\/(.*)$/, replacement: new URL('./packages/$1/src', import.meta.url).pathname },
    ],
    retry: process.env.RETRY_TESTS ? 3 : 0,
  },
});
