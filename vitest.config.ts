import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

const root = fileURLToPath(new URL('./packages', import.meta.url)).replace(/\\/g, '/');

export default defineConfig({
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
          name: 'legacy',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/features/decorators/es'],
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
          name: 'es',
          include: ['tests/features/decorators/es/*.test.ts'],
        },
      },
    ],
    globals: true,
    coverage: {
      reporter: ['clover', 'json', 'lcov', 'text'],
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
      { find: 'mikro-orm', replacement: `${root}/mikro-orm/src` },
      { find: '@mikro-orm/core/file-discovery', replacement: `${root}/core/src/metadata/discover-entities.ts` },
      { find: '@mikro-orm/core/fs-utils', replacement: `${root}/core/src/utils/fs-utils.ts` },
      { find: '@mikro-orm/decorators/es', replacement: `${root}/decorators/src/es/index.ts` },
      { find: '@mikro-orm/decorators/legacy', replacement: `${root}/decorators/src/legacy/index.ts` },
      { find: /^@mikro-orm\/(.*)$/, replacement: `${root}/$1/src` },
    ],
    retry: process.env.RETRY_TESTS ? 1 : 0,
  },
});
