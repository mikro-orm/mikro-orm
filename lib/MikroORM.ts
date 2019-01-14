import 'reflect-metadata';
import { Db, MongoClient } from 'mongodb';
import { EntityManager } from './EntityManager';
import { EntityMetadata } from './BaseEntity';

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

const defaultOptions = {
  entitiesDirs: [],
  strict: false,
  logger: () => undefined,
  baseDir: process.cwd(),
  clientUrl: 'mongodb://localhost:27017',
  debug: false,
};

export class MikroORM {

  public em: EntityManager;
  public options: MikroORMOptions;
  private client: MongoClient;
  private db: Db;

  static async init(options: Options): Promise<MikroORM> {
    const orm = new MikroORM(options);
    const db = await orm.connect();
    orm.em = new EntityManager(db, orm.options);

    return orm;
  }

  constructor(options: Options) {
    this.options = {
      ...defaultOptions,
      ...options,
    };

    if (!this.options.dbName) {
      throw new Error('No database specified, please fill in `dbName` option');
    }

    if (!this.options.entitiesDirs || this.options.entitiesDirs.length === 0) {
      throw new Error('No directories for entity discovery specified, please fill in `entitiesDirs` option');
    }
  };

  async connect(): Promise<Db> {
    this.client = await MongoClient.connect(this.options.clientUrl as string, { useNewUrlParser: true });
    this.db = this.client.db(this.options.dbName);
    const clientUrl = this.options.clientUrl.replace(/\/\/([^:]+):(\w+)@/, '//$1:*****@');
    this.options.logger(`MikroORM: successfully connected to database ${this.options.dbName} on ${clientUrl}`);

    return this.db;
  }

  isConnected(): boolean {
    return this.client.isConnected();
  }

  async close(force = false): Promise<void> {
    return this.client.close(force);
  }

}

export interface MikroORMOptions {
  dbName: string;
  entitiesDirs: string[];
  entitiesDirsTs?: string[];
  strict: boolean;
  logger: (message: string) => void;
  debug: boolean;
  baseDir: string;
  clientUrl: string;
}

export type Options = Pick<MikroORMOptions, Exclude<keyof MikroORMOptions, keyof typeof defaultOptions>> | MikroORMOptions;
