import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options, Configuration, IDatabaseDriver } from '@mikro-orm/core';
import { SqliteDriver } from './SqliteDriver';

/**
 * @inheritDoc
 */
export class SqliteMikroORM extends MikroORM<SqliteDriver> {

  private static DRIVER = SqliteDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = SqliteDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return MikroORM.init(options, connect);
  }

}

export type SqliteOptions = Options<SqliteDriver>;

/* istanbul ignore next */
export function defineSqliteConfig(options: SqliteOptions) {
  return defineConfig({ driver: SqliteDriver, ...options });
}
