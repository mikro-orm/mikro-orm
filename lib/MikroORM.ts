import 'reflect-metadata';

import { EntityManager } from './EntityManager';
import { EntityMetadata } from './BaseEntity';
import { MongoDriver } from './drivers/MongoDriver';
import { IDatabaseDriver } from './drivers/IDatabaseDriver';

export function getMetadataStorage(entity?: string): { [entity: string]: EntityMetadata } {
  if (!(global as any)['MIKRO-ORM-STORAGE']) {
    (global as any)['MIKRO-ORM-STORAGE'] = {} as any;
  }

  const storage = (global as any)['MIKRO-ORM-STORAGE'];

  if (entity && !storage[entity]) {
    storage[entity] = {} as EntityMetadata;
  }

  return storage;
}

export class MikroORM {

  public em: EntityManager;
  private readonly driver: IDatabaseDriver;

  static async init(options: Options): Promise<MikroORM> {
    const orm = new MikroORM(options);
    const driver = await orm.connect();
    orm.em = new EntityManager(driver, orm.options);

    return orm;
  }

  constructor(public options: Options) {
    if (!this.options.dbName) {
      throw new Error('No database specified, please fill in `dbName` option');
    }

    if (!this.options.entitiesDirs || this.options.entitiesDirs.length === 0) {
      throw new Error('No directories for entity discovery specified, please fill in `entitiesDirs` option');
    }

    if (!this.options.driver) {
      this.options.driver = MongoDriver;
    }

    this.driver = new this.options.driver(this.options);

    if (!this.options.logger) {
      this.options.logger = (): void => null;
    }

    if (!this.options.baseDir) {
      this.options.baseDir = process.cwd();
    }

    if (!this.options.clientUrl) {
      this.options.clientUrl = this.driver.getDefaultClientUrl();
    }
  }

  async connect(): Promise<IDatabaseDriver> {
    await this.driver.connect();
    const clientUrl = this.options.clientUrl.replace(/\/\/([^:]+):(\w+)@/, '//$1:*****@');
    this.options.logger(`MikroORM: successfully connected to database ${this.options.dbName} on ${clientUrl}`);

    return this.driver;
  }

  isConnected(): boolean {
    return this.driver.isConnected();
  }

  async close(force = false): Promise<void> {
    return this.driver.close(force);
  }

}

export interface Options {
  dbName: string;
  entitiesDirs: string[];
  entitiesDirsTs?: string[];
  strict?: boolean;
  driver?: { new (options: Options): IDatabaseDriver };
  logger?: Function;
  debug?: boolean;
  baseDir?: string;
  clientUrl?: string;
  multipleStatements?: boolean;
}
