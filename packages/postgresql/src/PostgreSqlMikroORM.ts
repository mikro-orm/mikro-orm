import { defineConfig, MikroORM } from '@mikro-orm/core';
import type { Options, Configuration, IDatabaseDriver } from '@mikro-orm/core';
import { PostgreSqlDriver } from './PostgreSqlDriver';

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM extends MikroORM<PostgreSqlDriver> {

  private static DRIVER = PostgreSqlDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = PostgreSqlDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return MikroORM.init(options, connect);
  }

}

export type PostgreSqlOptions = Options<PostgreSqlDriver>;

/* istanbul ignore next */
export function definePostgreSqlConfig(options: PostgreSqlOptions) {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}
