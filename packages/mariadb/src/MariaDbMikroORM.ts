import { defineConfig, type IDatabaseDriver, MikroORM, type Options } from '@mikro-orm/core';
import { MariaDbDriver } from './MariaDbDriver';

/**
 * @inheritDoc
 */
export class MariaDbMikroORM extends MikroORM<MariaDbDriver> {
  private static DRIVER = MariaDbDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MariaDbDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MariaDbDriver>(options: Options<D>): MikroORM<D> {
    return super.initSync(options);
  }
}

export type MariaDbOptions = Options<MariaDbDriver>;

/* istanbul ignore next */
export function defineMariaDbConfig(options: MariaDbOptions) {
  return defineConfig({ driver: MariaDbDriver, ...options });
}
