import { MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { SqliteDriver } from './SqliteDriver';

/**
 * @inheritDoc
 */
export class SqliteMikroORM extends MikroORM<SqliteDriver> {

  private static DRIVER = SqliteDriver;

}

export type SqliteOptions = Options<SqliteDriver>;
