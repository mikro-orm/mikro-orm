import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options, Configuration, IDatabaseDriver } from '@mikro-orm/core';
import { MariaDbDriver } from './MariaDbDriver';

/**
 * @inheritDoc
 */
export class MariaDbMikroORM extends MikroORM<MariaDbDriver> {

  private static DRIVER = MariaDbDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = MariaDbDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return super.init(options, connect);
  }

}

export type MariaDbOptions = Options<MariaDbDriver>;

/* istanbul ignore next */
export function defineMariaDbConfig(options: MariaDbOptions) {
  return defineConfig({ driver: MariaDbDriver, ...options });
}
