import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  // plugins: [
  //   swc.vite({
  //     jsc: { target: 'es2024' },
  //     sourceMaps: true,
  //   }),
  // ],
  esbuild: {
    target: 'es2024',
    keepNames: true,
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          swc.vite({
            jsc: { target: 'es2024' },
            sourceMaps: true,
          }),
        ],
        test: {
          name: 'all',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/features/es-decorators'],
        },
      },
      {
        extends: true,
        plugins: [
          swc.vite({
            jsc: {
              target: 'es2024',
              parser: {
                syntax: 'typescript',
                decorators: true,
              },
              transform: {
                decoratorVersion: '2022-03',
              },
            },
            sourceMaps: true,
          }),
        ],
        test: {
          name: 'es decorators',
          include: ['tests/features/es-decorators/*.test.ts'],
        },
      },
    ],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'cobertura'],
      include: [
        'packages/*/src/**/*.ts',
      ],
      exclude: [
        'packages/cli/src/cli.ts',
        'packages/mikro-orm/src/index.ts',
      ],
    },
    setupFiles: [
      './tests/setup.ts',
    ],
    globalSetup: './tests/globalSetup.ts',
    disableConsoleIntercept: true,
    clearMocks: true,
    isolate: false,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    alias: [
      { find: '@mikro-orm/mongo-highlighter', replacement: new URL('/node_modules/@mikro-orm/mongo-highlighter', import.meta.url).pathname },
      { find: '@mikro-orm/sql-highlighter', replacement: new URL('/node_modules/@mikro-orm/sql-highlighter', import.meta.url).pathname },
      { find: 'mikro-orm', replacement: new URL('./packages/mikro-orm/src', import.meta.url).pathname },
      { find: '@mikro-orm/core/file-discovery', replacement: new URL('/packages/core/src/metadata/discover-entities.ts', import.meta.url).pathname },
      { find: '@mikro-orm/decorators/es', replacement: new URL('/packages/decorators/src/es/index.ts', import.meta.url).pathname },
      { find: '@mikro-orm/decorators/legacy', replacement: new URL('/packages/decorators/src/legacy/index.ts', import.meta.url).pathname },
      { find: /^@mikro-orm\/(.*)$/, replacement: new URL('./packages/$1/src', import.meta.url).pathname },
    ],
    retry: process.env.RETRY_TESTS ? 3 : 0,
  },
});
