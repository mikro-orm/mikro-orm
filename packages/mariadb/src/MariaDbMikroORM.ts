import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { MariaDbDriver } from './MariaDbDriver';

/**
 * @inheritDoc
 */
export class MariaDbMikroORM extends MikroORM<MariaDbDriver> {

  private static DRIVER = MariaDbDriver;

}

export type MariaDbOptions = Options<MariaDbDriver>;

/* istanbul ignore next */
export function defineMariaDbConfig(options: MariaDbOptions) {
  return defineConfig({ driver: MariaDbDriver, ...options });
}
