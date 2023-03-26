import { defineConfig, MikroORM, type Options, type IDatabaseDriver } from '@mikro-orm/core';
import { SqliteDriver } from './SqliteDriver';

/**
 * @inheritDoc
 */
export class SqliteMikroORM extends MikroORM<SqliteDriver> {

  private static DRIVER = SqliteDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = SqliteDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = SqliteDriver>(options: Options<D>): MikroORM<D> {
    return super.initSync(options);
  }

}

export type SqliteOptions = Options<SqliteDriver>;

/* istanbul ignore next */
export function defineSqliteConfig(options: SqliteOptions) {
  return defineConfig({ driver: SqliteDriver, ...options });
}
