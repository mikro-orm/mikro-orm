import type { Collection } from 'mongodb';
import {
  type CreateSchemaOptions,
  type Dictionary,
  type EntityKey,
  type EntityMetadata,
  type EntityProperty,
  type MikroORM,
  Utils,
  inspect,
} from '@mikro-orm/core';
import { AbstractSchemaGenerator } from '@mikro-orm/core/schema';
import type { MongoDriver } from './MongoDriver.js';
import type { MongoEntityManager } from './MongoEntityManager.js';

/** Schema generator for MongoDB that manages collections and indexes. */
export class MongoSchemaGenerator extends AbstractSchemaGenerator<MongoDriver> {
  static register(orm: MikroORM): void {
    orm.config.registerExtension(
      '@mikro-orm/schema-generator',
      () => new MongoSchemaGenerator(orm.em as MongoEntityManager),
    );
  }

  override async create(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.connection.ensureConnection();
    options.ensureIndexes ??= true;
    const existing = await this.connection.listCollections();
    const metadata = this.getOrderedMetadata();

    /* v8 ignore next */
    const promises = metadata
      .filter(meta => !existing.includes(meta.collection))
      .map(meta =>
        this.connection.createCollection(meta.class).catch(err => {
          const existsErrorMessage = `Collection ${this.config.get('dbName')}.${meta.collection} already exists.`;

          // ignore errors about the collection already existing
          if (!(err.name === 'MongoServerError' && err.message.includes(existsErrorMessage))) {
            throw err;
          }
        }),
      );

    if (options.ensureIndexes) {
      await this.ensureIndexes({ ensureCollections: false });
    }

    await Promise.all(promises);
  }

  override async drop(options: { dropMigrationsTable?: boolean } = {}): Promise<void> {
    await this.connection.ensureConnection();
    const existing = await this.connection.listCollections();
    const metadata = this.getOrderedMetadata();

    if (options.dropMigrationsTable) {
      metadata.push({ collection: this.config.get('migrations').tableName } as any);
    }

    const promises = metadata
      .filter(meta => existing.includes(meta.collection))
      .map(meta => this.connection.dropCollection(meta.class));

    await Promise.all(promises);
  }

  override async update(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.create(options);
  }

  override async ensureDatabase(): Promise<boolean> {
    return false;
  }

  override async refresh(options: MongoCreateSchemaOptions = {}): Promise<void> {
    await this.ensureDatabase();
    await this.drop();
    await this.create(options);
  }

  async dropIndexes(options?: {
    skipIndexes?: { collection: string; indexName: string }[];
    collectionsWithFailedIndexes?: string[];
  }): Promise<void> {
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

        /* v8 ignore next */
        if (
          !isIdIndex &&
          !options?.skipIndexes?.find(idx => idx.collection === collection.name && idx.indexName === index.name)
        ) {
          promises.push(this.executeQuery(db.collection(collection.name), 'dropIndex', index.name));
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
      await this.create({ ensureIndexes: false });
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

  private mapIndexProperties<T>(index: { properties?: EntityKey<T> | EntityKey<T>[] }, meta: EntityMetadata<any>) {
    return Utils.flatten(
      Utils.asArray(index.properties).map(propName => {
        const rootPropName = propName.split('.')[0];
        const prop = meta.properties[rootPropName];

        if (propName.includes('.')) {
          return [prop.fieldNames[0] + propName.substring(propName.indexOf('.'))];
        }

        return prop?.fieldNames ?? propName;
      }),
    );
  }

  private createIndexes(meta: EntityMetadata): [string, Promise<string>][] {
    const res: [string, Promise<string>][] = [];
    meta.indexes.forEach(index => {
      let fieldOrSpec: string | Dictionary;
      const properties = this.mapIndexProperties(index, meta);
      const collection = this.connection.getCollection(meta.class);

      if (Array.isArray(index.options) && index.options.length === 2 && properties.length === 0) {
        // The array-form escape hatch passes raw [spec, options] to the driver; fold `where`
        // into the options dict (on a clone, to avoid mutating the user's metadata).
        const opts = { ...index.options[1] };
        this.applyPartialFilter(opts, index.where, index.name, meta.className);
        res.push([collection.collectionName, collection.createIndex(index.options[0], opts)]);
        return;
      }

      if (index.options && properties.length === 0) {
        // The plain escape hatch forwards `index.options` as the sole argument; there is
        // no options slot for `partialFilterExpression`, so warn instead of silently dropping.
        if (index.where != null) {
          this.config
            .getLogger()
            .warn(
              'schema',
              `Index '${index.name ?? '(unnamed)'}' on entity '${meta.className}': \`where\` was ignored because \`options\` is used as the raw index spec and leaves no slot for \`partialFilterExpression\` — pass \`options: [spec, { partialFilterExpression }]\` (array form) to combine both.`,
            );
        }
        res.push([collection.collectionName, collection.createIndex(index.options)]);
        return;
      }

      if (index.type) {
        if (index.type === 'fulltext') {
          index.type = 'text';
        }

        const spec: Dictionary<string> = {};
        properties.forEach(prop => (spec[prop] = index.type!));
        fieldOrSpec = spec;
      } else {
        fieldOrSpec = properties.reduce((o, i) => {
          o[i] = 1;
          return o;
        }, {} as Dictionary);
      }

      // MongoDB uses 'hidden' for invisible indexes
      const indexOptions: Dictionary = {
        name: index.name,
        unique: false,
        ...index.options,
      };

      if (index.invisible) {
        indexOptions.hidden = true;
      }

      this.applyPartialFilter(indexOptions, index.where, index.name, meta.className);

      res.push([collection.collectionName, this.executeQuery(collection, 'createIndex', fieldOrSpec, indexOptions)]);
    });

    return res;
  }

  /**
   * An explicit `options.partialFilterExpression` wins over `where` — this preserves the
   * long-standing `options: { partialFilterExpression }` escape hatch.
   */
  private applyPartialFilter(
    options: Dictionary,
    where: unknown,
    indexName: string | undefined,
    entityName: string,
  ): void {
    if (where == null) {
      return;
    }

    if (options.partialFilterExpression != null) {
      this.config
        .getLogger()
        .warn(
          'schema',
          `Index '${indexName ?? '(unnamed)'}' on entity '${entityName}': both \`where\` and \`options.partialFilterExpression\` are set; \`options.partialFilterExpression\` wins.`,
        );
      return;
    }

    if (typeof where === 'string') {
      throw new Error(
        `Index '${indexName ?? '(unnamed)'}' on entity '${entityName}': string \`where\` is not supported on MongoDB; pass an object/FilterQuery (it maps to MongoDB's \`partialFilterExpression\`).`,
      );
    }

    options.partialFilterExpression = where;
  }

  private async executeQuery(collection: Collection, method: keyof Collection, ...args: unknown[]) {
    const now = Date.now();
    return (collection[method] as any)(...args).then((res: unknown) => {
      Utils.dropUndefinedProperties(args);
      const query = `db.getCollection('${collection.collectionName}').${method}(${args.map(arg => inspect(arg)).join(', ')});`;
      this.config.getLogger().logQuery({
        level: 'info',
        query,
        took: Date.now() - now,
      });

      return res;
    });
  }

  private createUniqueIndexes(meta: EntityMetadata) {
    const res: [string, Promise<string>][] = [];
    meta.uniques.forEach(index => {
      const properties = this.mapIndexProperties(index, meta);
      const fieldOrSpec = properties.reduce((o, i) => {
        o[i] = 1;
        return o;
      }, {} as Dictionary);
      const collection = this.connection.getCollection(meta.class);
      const indexOptions: Dictionary = {
        name: index.name,
        unique: true,
        ...index.options,
      };
      this.applyPartialFilter(indexOptions, index.where, index.name, meta.className);
      res.push([collection.collectionName, this.executeQuery(collection, 'createIndex', fieldOrSpec, indexOptions)]);
    });

    return res;
  }

  private createPropertyIndexes(meta: EntityMetadata, prop: EntityProperty, type: 'index' | 'unique') {
    if (!prop[type] || !meta.collection) {
      return [];
    }

    const collection = this.connection.getCollection(meta.class);
    const fieldOrSpec = prop.embeddedPath
      ? prop.embeddedPath.join('.')
      : prop.fieldNames.reduce((o, i) => {
          o[i] = 1;
          return o;
        }, {} as Dictionary);

    return [
      [
        collection.collectionName,
        this.executeQuery(collection, 'createIndex', fieldOrSpec, {
          name: typeof prop[type] === 'string' ? prop[type] : undefined,
          unique: type === 'unique',
          sparse: prop.nullable === true,
        }),
      ],
    ] as [string, Promise<string>][];
  }
}

export interface MongoCreateSchemaOptions extends CreateSchemaOptions {
  /** create indexes? defaults to true */
  ensureIndexes?: boolean;
}

/** Options for the `ensureIndexes()` method of `MongoSchemaGenerator`. */
export interface EnsureIndexesOptions {
  ensureCollections?: boolean;
  retry?: boolean | string[];
  retryLimit?: number;
}
