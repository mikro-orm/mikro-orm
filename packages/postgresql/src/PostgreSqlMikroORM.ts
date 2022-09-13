import { MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from './PostgreSqlDriver';

/**
 * @inheritDoc
 */
export class PostgreSqlMikroORM extends MikroORM<PostgreSqlDriver> {

  private static DRIVER = PostgreSqlDriver;

}

export type PostgreSqlOptions = Options<PostgreSqlDriver>;
