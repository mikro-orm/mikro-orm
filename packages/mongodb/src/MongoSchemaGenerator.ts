import type { Dictionary, EntityMetadata, EntityProperty } from '@mikro-orm/core';
import { AbstractSchemaGenerator, Utils } from '@mikro-orm/core';
import type { MongoDriver } from './MongoDriver';

export class MongoSchemaGenerator extends AbstractSchemaGenerator<MongoDriver> {

  async createSchema(options: CreateSchemaOptions = {}): Promise<void> {
    options.ensureIndexes ??= true;
    const existing = await this.connection.listCollections();
    const metadata = this.getOrderedMetadata();

    const promises = metadata
      .filter(meta => !existing.includes(meta.collection))
      .map(meta => this.connection.createCollection(meta.collection));

    if (options.ensureIndexes) {
      await this.ensureIndexes({ ensureCollections: false });
    }

    await Promise.all(promises);
  }

  async dropSchema(): Promise<void> {
    const db = this.connection.getDb();
    const collections = await db.listCollections().toArray();
    const existing = collections.map(c => c.name);
    const metadata = this.getOrderedMetadata();
    const promises = metadata
      .filter(meta => existing.includes(meta.collection))
      .map(meta => this.connection.dropCollection(meta.collection));

    await Promise.all(promises);
  }

  async updateSchema(options: CreateSchemaOptions = {}): Promise<void> {
    await this.createSchema(options);
  }

  async refreshDatabase(options: CreateSchemaOptions = {}): Promise<void> {
    options.ensureIndexes ??= true;

    await super.refreshDatabase();

    if (options.ensureIndexes) {
      await this.ensureIndexes();
    }
  }

  async ensureIndexes(options: EnsureIndexesOptions = {}): Promise<void> {
    options.ensureCollections ??= true;

    if (options.ensureCollections) {
      await this.createSchema({ ensureIndexes: false });
    }

    const promises: Promise<string>[] = [];

    for (const meta of Object.values(this.metadata.getAll())) {
      promises.push(...this.createIndexes(meta));
      promises.push(...this.createUniqueIndexes(meta));

      for (const prop of meta.props) {
        promises.push(...this.createPropertyIndexes(meta, prop, 'index'));
        promises.push(...this.createPropertyIndexes(meta, prop, 'unique'));
      }
    }

    await Promise.all(promises);
  }

  private createIndexes(meta: EntityMetadata) {
    const promises: Promise<string>[] = [];
    meta.indexes.forEach(index => {
      let fieldOrSpec: string | Dictionary;
      const properties = Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames));
      const collection = this.connection.getCollection(meta.name!);

      if (index.options && properties.length === 0) {
        return promises.push(collection.createIndex(index.options));
      }

      if (index.type) {
        const spec: Dictionary<string> = {};
        properties.forEach(prop => spec[prop] = index.type!);
        fieldOrSpec = spec;
      } else {
        fieldOrSpec = properties.reduce((o, i) => { o[i] = 1; return o; }, {});
      }

      promises.push(collection.createIndex(fieldOrSpec, {
        name: index.name,
        unique: false,
        ...(index.options || {}),
      }));
    });

    return promises;
  }

  private createUniqueIndexes(meta: EntityMetadata) {
    const promises: Promise<string>[] = [];
    meta.uniques.forEach(index => {
      const properties = Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames));
      const fieldOrSpec = properties.reduce((o, i) => { o[i] = 1; return o; }, {});
      promises.push(this.connection.getCollection(meta.name!).createIndex(fieldOrSpec, {
        name: index.name,
        unique: true,
        ...(index.options || {}),
      }));
    });

    return promises;
  }

  private createPropertyIndexes(meta: EntityMetadata, prop: EntityProperty, type: 'index' | 'unique') {
    if (!prop[type]) {
      return [];
    }

    const fieldOrSpec = prop.fieldNames.reduce((o, i) => { o[i] = 1; return o; }, {});

    return [this.connection.getCollection(meta.name!).createIndex(fieldOrSpec, {
      name: (Utils.isString(prop[type]) ? prop[type] : undefined) as string,
      unique: type === 'unique',
      sparse: prop.nullable === true,
    })];
  }

}

export interface CreateSchemaOptions {
  /** create indexes? defaults to true */
  ensureIndexes?: boolean;
  /** not valid for mongo driver */
  wrap?: boolean;
  /** not valid for mongo driver */
  schema?: string;
}

export interface EnsureIndexesOptions {
  ensureCollections?: boolean;
}
