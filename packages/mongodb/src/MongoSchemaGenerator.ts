import {
  AbstractSchemaGenerator,
  type CreateSchemaOptions,
  type Dictionary,
  type EntityMetadata,
  type EntityProperty,
  type MikroORM,
  Utils,
} from '@mikro-orm/core';
import type { MongoDriver } from './MongoDriver.js';
import type { MongoEntityManager } from './MongoEntityManager.js';

export class MongoSchemaGenerator extends AbstractSchemaGenerator<MongoDriver> {

  static register(orm: MikroORM): void {
    orm.config.registerExtension('@mikro-orm/schema-generator', () => new MongoSchemaGenerator(orm.em as MongoEntityManager));
  }

  override async createSchema(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.connection.ensureConnection();
    options.ensureIndexes ??= true;
    const existing = await this.connection.listCollections();
    const metadata = this.getOrderedMetadata();

    /* v8 ignore start */
    const promises = metadata
      .filter(meta => !existing.includes(meta.collection))
      .map(meta => this.connection.createCollection(meta.collection).catch(err => {
        const existsErrorMessage = `Collection ${this.config.get('dbName')}.${meta.collection} already exists.`;

        // ignore errors about the collection already existing
        if (!(err.name === 'MongoServerError' && err.message.includes(existsErrorMessage))) {
          throw err;
        }
      }));
    /* v8 ignore stop */

    if (options.ensureIndexes) {
      await this.ensureIndexes({ ensureCollections: false });
    }

    await Promise.all(promises);
  }

  override async dropSchema(options: { dropMigrationsTable?: boolean } = {}): Promise<void> {
    await this.connection.ensureConnection();
    const existing = await this.connection.listCollections();
    const metadata = this.getOrderedMetadata();

    if (options.dropMigrationsTable) {
      metadata.push({ collection: this.config.get('migrations').tableName } as any);
    }

    const promises = metadata
      .filter(meta => existing.includes(meta.collection))
      .map(meta => this.connection.dropCollection(meta.collection));

    await Promise.all(promises);
  }

  override async updateSchema(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.createSchema(options);
  }

  override async ensureDatabase(): Promise<boolean> {
    return false;
  }

  override async refreshDatabase(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.ensureDatabase();
    await this.dropSchema();
    await this.createSchema(options);
  }

  async dropIndexes(options?: { skipIndexes?: { collection: string; indexName: string }[]; collectionsWithFailedIndexes?: string[] }): Promise<void> {
    await this.connection.ensureConnection();
    const db = this.connection.getDb();
    const collections = await db.listCollections().toArray();
    const promises: Promise<unknown>[] = [];

    for (const collection of collections) {
      if (options?.collectionsWithFailedIndexes && !options.collectionsWithFailedIndexes.includes(collection.name)) {
        continue;
      }

      const indexes = await db.collection(collection.name).listIndexes().toArray();

      for (const index of indexes) {
        const isIdIndex = index.key._id === 1 && Utils.getObjectKeysSize(index.key) === 1;

        /* v8 ignore next 3 */
        if (!isIdIndex && !options?.skipIndexes?.find(idx => idx.collection === collection.name && idx.indexName === index.name)) {
          promises.push(db.collection(collection.name).dropIndex(index.name));
        }
      }
    }

    await Promise.all(promises);
  }

  override async ensureIndexes(options: EnsureIndexesOptions = {}): Promise<void> {
    await this.connection.ensureConnection();

    options.ensureCollections ??= true;
    options.retryLimit ??= 3;

    if (options.ensureCollections) {
      await this.createSchema({ ensureIndexes: false });
    }

    const promises: [string, Promise<string>][] = [];

    for (const meta of this.getOrderedMetadata()) {
      if (Array.isArray(options?.retry) && !options.retry.includes(meta.collection)) {
        continue;
      }

      promises.push(...this.createIndexes(meta));
      promises.push(...this.createUniqueIndexes(meta));

      for (const prop of meta.props) {
        promises.push(...this.createPropertyIndexes(meta, prop, 'index'));
        promises.push(...this.createPropertyIndexes(meta, prop, 'unique'));
      }
    }

    const res = await Promise.allSettled(promises.map(p => p[1]));

    if (res.some(r => r.status === 'rejected') && options.retry !== false) {
      const skipIndexes = [];
      const collectionsWithFailedIndexes = [];
      const errors = [];

      for (let i = 0; i < res.length; i++) {
        const r: Dictionary = res[i];
        if (r.status === 'rejected') {
          collectionsWithFailedIndexes.push(promises[i][0]);
          errors.push(r.reason);
        } else {
          skipIndexes.push({ collection: promises[i][0], indexName: r.value });
        }
      }

      await this.dropIndexes({ skipIndexes, collectionsWithFailedIndexes });

      if (options.retryLimit === 0) {
        const details = errors.map(e => e.message).join('\n');
        const message = `Failed to create indexes on the following collections: ${collectionsWithFailedIndexes.join(', ')}\n${details}`;

        throw new Error(message, { cause: errors });
      }

      await this.ensureIndexes({
        retry: collectionsWithFailedIndexes,
        retryLimit: options.retryLimit - 1,
      });
    }
  }

  private createIndexes(meta: EntityMetadata): [string, Promise<string>][] {
    const res: [string, Promise<string>][] = [];
    meta.indexes.forEach(index => {
      let fieldOrSpec: string | Dictionary;
      const properties = Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames));
      const collection = this.connection.getCollection(meta.className);

      if (Array.isArray(index.options) && index.options.length === 2 && properties.length === 0) {
        res.push([collection.collectionName, collection.createIndex(index.options[0], index.options[1])]);
        return;
      }

      if (index.options && properties.length === 0) {
        res.push([collection.collectionName, collection.createIndex(index.options)]);
        return;
      }

      if (index.type) {
        if (index.type === 'fulltext') {
          index.type = 'text';
        }

        const spec: Dictionary<string> = {};
        properties.forEach(prop => spec[prop] = index.type!);
        fieldOrSpec = spec;
      } else {
        fieldOrSpec = properties.reduce((o, i) => { o[i] = 1; return o; }, {} as Dictionary);
      }

      res.push([collection.collectionName, collection.createIndex(fieldOrSpec, {
        name: index.name,
        unique: false,
        ...index.options,
      })]);
    });

    return res;
  }

  private createUniqueIndexes(meta: EntityMetadata) {
    const res: [string, Promise<string>][] = [];
    meta.uniques.forEach(index => {
      const properties = Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames));
      const fieldOrSpec = properties.reduce((o, i) => { o[i] = 1; return o; }, {} as Dictionary);
      const collection = this.connection.getCollection(meta.className);
      res.push([collection.collectionName, collection.createIndex(fieldOrSpec, {
        name: index.name,
        unique: true,
        ...index.options,
      })]);
    });

    return res;
  }

  private createPropertyIndexes(meta: EntityMetadata, prop: EntityProperty, type: 'index' | 'unique') {
    if (!prop[type] || !meta.collection) {
      return [];
    }

    const collection = this.connection.getCollection(meta.className);
    const fieldOrSpec = prop.embeddedPath
      ? prop.embeddedPath.join('.')
      : prop.fieldNames.reduce((o, i) => { o[i] = 1; return o; }, {} as Dictionary);

    return [[collection.collectionName, collection.createIndex(fieldOrSpec, {
      name: (Utils.isString(prop[type]) ? prop[type] : undefined) as string,
      unique: type === 'unique',
      sparse: prop.nullable === true,
    })]] as unknown as [string, Promise<string>][];
  }

}

export interface MongoCreateSchemaOptions extends CreateSchemaOptions {
  /** create indexes? defaults to true */
  ensureIndexes?: boolean;
}

export interface EnsureIndexesOptions {
  ensureCollections?: boolean;
  retry?: boolean | string[];
  retryLimit?: number;
}
