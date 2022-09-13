import { MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { MySqlDriver } from './MySqlDriver';

/**
 * @inheritDoc
 */
export class MySqlMikroORM extends MikroORM<MySqlDriver> {

  private static DRIVER = MySqlDriver;

}

export type MySqlOptions = Options<MySqlDriver>;
