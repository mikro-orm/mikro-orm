import { defineConfig, MikroORM, type Options, type IDatabaseDriver } from '@mikro-orm/core';
import { PostgreSqlDriver } from './PostgreSqlDriver';

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM extends MikroORM<PostgreSqlDriver> {

  private static DRIVER = PostgreSqlDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = PostgreSqlDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

}

export type PostgreSqlOptions = Options<PostgreSqlDriver>;

/* istanbul ignore next */
export function definePostgreSqlConfig(options: PostgreSqlOptions) {
  return defineConfig({ driver: PostgreSqlDriver, ...options });
}
