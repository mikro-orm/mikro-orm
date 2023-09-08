import { defineConfig, MikroORM, type Options, type Configuration, type IDatabaseDriver } from '@mikro-orm/core';
import { MongoDriver } from './MongoDriver';

/**
 * @inheritDoc
 */
export class MongoMikroORM extends MikroORM<MongoDriver> {

  private static DRIVER = MongoDriver;

  /**
   * @inheritDoc
   */
  static async init<D extends IDatabaseDriver = MongoDriver>(options?: Options<D> | Configuration<D>, connect = true): Promise<MikroORM<D>> {
    return super.init(options, connect);
  }

}

export type MongoOptions = Options<MongoDriver>;

/* istanbul ignore next */
export function defineMongoConfig(options: MongoOptions) {
  return defineConfig({ driver: MongoDriver, ...options });
}
