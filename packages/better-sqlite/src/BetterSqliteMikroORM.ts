import { MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { BetterSqliteDriver } from './BetterSqliteDriver';

/**
 * @inheritDoc
 */
export class BetterSqliteMikroORM extends MikroORM<BetterSqliteDriver> {

  private static DRIVER = BetterSqliteDriver;

}

export type BetterSqliteOptions = Options<BetterSqliteDriver>;
