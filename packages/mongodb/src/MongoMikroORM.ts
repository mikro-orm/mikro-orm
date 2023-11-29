import { defineConfig, MikroORM, type Options, type IDatabaseDriver } from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver';

/**
 * @inheritDoc
 */
export class MongoMikroORM extends MikroORM<MongoDriver> {

  private static DRIVER = MongoDriver;

  /**
   * @inheritDoc
   */
  static override async init<D extends IDatabaseDriver = MongoDriver>(options?: Options<D>): Promise<MikroORM<D>> {
    return super.init(options);
  }

  /**
   * @inheritDoc
   */
  static override initSync<D extends IDatabaseDriver = MongoDriver>(options: Options<D>): MikroORM<D> {
    return super.initSync(options);
  }

}

export type MongoOptions = Options<MongoDriver>;

/* istanbul ignore next */
export function defineMongoConfig(options: MongoOptions) {
  return defineConfig({ driver: MongoDriver, ...options });
}
