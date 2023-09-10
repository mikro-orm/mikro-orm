import { defineConfig, type IDatabaseDriver, MikroORM, type Options } from '@mikro-orm/core';
import { MySqlDriver } from './MySqlDriver';

/**
 * @inheritDoc
 */
export class MySqlMikroORM extends MikroORM<MySqlDriver> {
  private static DRIVER = MySqlDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MySqlDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MySqlDriver>(options: Options<D>): MikroORM<D> {
    return super.initSync(options);
  }
}

export type MySqlOptions = Options<MySqlDriver>;

/* istanbul ignore next */
export function defineMySqlConfig(options: MySqlOptions) {
  return defineConfig({ driver: MySqlDriver, ...options });
}
