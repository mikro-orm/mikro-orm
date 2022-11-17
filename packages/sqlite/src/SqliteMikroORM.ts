import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { SqliteDriver } from './SqliteDriver';

/**
 * @inheritDoc
 */
export class SqliteMikroORM extends MikroORM<SqliteDriver> {
  private static DRIVER = SqliteDriver;
}

export type SqliteOptions = Options<SqliteDriver>;

/* istanbul ignore next */
export function defineSqliteConfig(options: SqliteOptions) {
  return defineConfig({ driver: SqliteDriver, ...options });
}
