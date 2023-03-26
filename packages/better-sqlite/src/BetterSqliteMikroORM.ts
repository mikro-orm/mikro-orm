import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options, IDatabaseDriver } from '@mikro-orm/core';
import { BetterSqliteDriver } from './BetterSqliteDriver';

/**
 * @inheritDoc
 */
export class BetterSqliteMikroORM extends MikroORM<BetterSqliteDriver> {

  private static DRIVER = BetterSqliteDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = BetterSqliteDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = BetterSqliteDriver>(options: Options<D>): MikroORM<D> {
    return super.initSync(options);
  }

}

export type BetterSqliteOptions = Options<BetterSqliteDriver>;

/* istanbul ignore next */
export function defineBetterSqliteConfig(options: BetterSqliteOptions) {
  return defineConfig({ driver: BetterSqliteDriver, ...options });
}
