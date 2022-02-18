import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testTimeout: 30000,
  preset: 'ts-jest',
  collectCoverage: false,
  collectCoverageFrom: [
    '<rootDir>/packages/*/src/**/*.ts',
  ],
  moduleNameMapper: {
    '@mikro-orm/mongo-highlighter': '<rootDir>/node_modules/@mikro-orm/mongo-highlighter',
    '@mikro-orm/sql-highlighter': '<rootDir>/node_modules/@mikro-orm/sql-highlighter',
    '@mikro-orm/(.*)/package.json': '<rootDir>/packages/$1/package.json',
    '@mikro-orm/(.*)': '<rootDir>/packages/$1/src',
  },
  modulePathIgnorePatterns: [
    'dist/package.json',
    '<rootDir>/package.json',
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/packages/cli/src/cli.ts',
    '<rootDir>/packages/better-sqlite',
  ],
  setupFiles: [
    '<rootDir>/tests/setup.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tests/tsconfig.json',
    },
  },
};

export default config;
