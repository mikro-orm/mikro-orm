import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options, Configuration, IDatabaseDriver } from '@mikro-orm/core';
import { MySqlDriver } from './MySqlDriver';

/**
 * @inheritDoc
 */
export class MySqlMikroORM extends MikroORM<MySqlDriver> {

  private static DRIVER = MySqlDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = MySqlDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return MikroORM.init(options, connect);
  }

}

export type MySqlOptions = Options<MySqlDriver>;

/* istanbul ignore next */
export function defineMySqlConfig(options: MySqlOptions) {
  return defineConfig({ driver: MySqlDriver, ...options });
}
