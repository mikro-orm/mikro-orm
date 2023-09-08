import { defineConfig, MikroORM, type Options, type Configuration, type IDatabaseDriver } from '@mikro-orm/core';
import { BetterSqliteDriver } from './BetterSqliteDriver';

/**
 * @inheritDoc
 */
export class BetterSqliteMikroORM extends MikroORM<BetterSqliteDriver> {

  private static DRIVER = BetterSqliteDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = BetterSqliteDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return super.init(options, connect);
  }

}

export type BetterSqliteOptions = Options<BetterSqliteDriver>;

/* istanbul ignore next */
export function defineBetterSqliteConfig(options: BetterSqliteOptions) {
  return defineConfig({ driver: BetterSqliteDriver, ...options });
}
