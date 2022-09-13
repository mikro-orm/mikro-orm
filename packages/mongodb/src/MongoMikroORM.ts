import { MikroORM } from '@mikro-orm/core';
import type { Options } from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver';

/**
 * @inheritDoc
 */
export class MongoMikroORM extends MikroORM<MongoDriver> {

  private static DRIVER = MongoDriver;

}

export type MongoOptions = Options<MongoDriver>;
