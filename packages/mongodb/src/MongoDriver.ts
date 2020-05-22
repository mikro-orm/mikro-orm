import { ClientSession, ObjectId } from 'mongodb';
import {
  DatabaseDriver,
  EntityData,
  AnyEntity,
  FilterQuery,
  EntityMetadata,
  EntityProperty,
  Configuration,
  Utils,
  ReferenceType,
  FindOneOptions,
  FindOptions,
  QueryResult,
  Transaction,
  IDatabaseDriver,
  EntityManager,
  EntityManagerType,
  Dictionary,
  ValidationError,
} from '@mikro-orm/core';
import { MongoConnection } from './MongoConnection';
import { MongoPlatform } from './MongoPlatform';
import { MongoEntityManager } from './MongoEntityManager';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  [EntityManagerType]: MongoEntityManager<this>;

  protected readonly connection = new MongoConnection(this.config);
  protected readonly platform = new MongoPlatform();

  constructor(config: Configuration) {
    super(config, ['mongodb']);
  }

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new MongoEntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOptions<T>, ctx?: Transaction<ClientSession>): Promise<T[]> {
    where = this.renameFields(entityName, where);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, options.limit, options.offset, options.fields, ctx));

    return res.map((r: T) => this.mapResult<T>(r, this.metadata.get(entityName))!);
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T> = { populate: [], orderBy: {} }, ctx?: Transaction<ClientSession>): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, 1, undefined, options.fields, ctx));

    return this.mapResult<T>(res[0], this.metadata.get(entityName));
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<number> {
    where = this.renameFields(entityName, where);
    return this.rethrow(this.getConnection('read').countDocuments(entityName, where, ctx));
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    data = this.renameFields(entityName, data);
    return this.rethrow(this.getConnection('write').insertOne(entityName, data as { _id: any }, ctx));
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where);
    data = this.renameFields(entityName, data);

    return this.rethrow(this.getConnection('write').updateMany(entityName, where as FilterQuery<T>, data as { _id: any }, ctx));
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where);

    return this.rethrow(this.getConnection('write').deleteMany(entityName, where, ctx));
  }

  async aggregate(entityName: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    return this.rethrow(this.getConnection('read').aggregate(entityName, pipeline, ctx));
  }

  async createCollections(): Promise<void> {
    const promises = Object.values(this.metadata.getAll())
      .map(meta => this.getConnection('write').createCollection(meta.collection));

    await this.rethrow(Promise.all(promises));
  }

  async dropCollections(): Promise<void> {
    const db = this.getConnection('write').getDb();
    const collections = await this.rethrow(db.listCollections().toArray());
    const existing = collections.map(c => c.name);
    const promises = Object.values(this.metadata.getAll())
      .filter(meta => existing.includes(meta.collection))
      .map(meta => this.getConnection('write').dropCollection(meta.collection));

    await this.rethrow(Promise.all(promises));
  }

  async ensureIndexes(): Promise<void> {
    await this.rethrow(this.createCollections());
    const promises: Promise<string>[] = [];

    for (const meta of Object.values(this.metadata.getAll())) {
      promises.push(...this.createIndexes(meta));
      promises.push(...this.createUniqueIndexes(meta));

      for (const prop of Object.values(meta.properties)) {
        promises.push(...this.createPropertyIndexes(meta, prop, 'index'));
        promises.push(...this.createPropertyIndexes(meta, prop, 'unique'));
      }
    }

    await this.rethrow(Promise.all(promises));
  }

  private createIndexes(meta: EntityMetadata) {
    const promises: Promise<string>[] = [];
    meta.indexes.forEach(index => {
      let fieldOrSpec: string | Dictionary;
      const properties = Utils.flatten(Utils.asArray(index.properties).map(prop => meta.properties[prop].fieldNames));
      const collection = this.getConnection('write').getCollection(meta.name);

      if (index.options && properties.length === 0) {
        return promises.push(collection.createIndex(index.options));
      }

      if (index.type) {
        const spec: Dictionary<string> = {};
        properties.forEach(prop => spec[prop] = index.type!);
        fieldOrSpec = spec;
      } else {
        fieldOrSpec = properties;
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
      promises.push(this.getConnection('write').getCollection(meta.name).createIndex(properties, {
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

    return [this.getConnection('write').getCollection(meta.name).createIndex(prop.fieldNames, {
      name: (Utils.isString(prop[type]) ? prop[type] : undefined) as string,
      unique: type === 'unique',
      sparse: prop.nullable === true,
    })];
  }

  private inlineEmbeddables<T>(meta: EntityMetadata<T>, data: T): void {
    Object.keys(data).forEach(k => {
      if (Utils.isOperator(k)) {
        Utils.asArray(data[k]).forEach(payload => this.inlineEmbeddables(meta, payload));
      }
    });

    Object.values<EntityProperty>(meta.properties).forEach(prop => {
      if (prop.reference === ReferenceType.EMBEDDED && Utils.isObject(data[prop.name])) {
        const props = prop.embeddedProps;

        Object.keys(data[prop.name]).forEach(kk => {
          const operator = Object.keys(data[prop.name]).some(f => Utils.isOperator(f));

          if (operator) {
            throw ValidationError.cannotUseOperatorsInsideEmbeddables(meta.name, prop.name, data);
          }

          data[props[kk].name] = data[prop.name][props[kk].embedded![1]];
        });
        delete data[prop.name];
      }
    });
  }

  private renameFields<T>(entityName: string, data: T): T {
    data = Object.assign({}, data); // copy first
    Utils.renameKey(data, 'id', '_id');
    const meta = this.metadata.get(entityName, false, false);

    if (meta) {
      this.inlineEmbeddables(meta, data);
    }

    Object.keys(data).forEach(k => {
      if (meta?.properties[k]) {
        const prop = meta.properties[k];

        if (prop.fieldNames) {
          Utils.renameKey(data, k, prop.fieldNames[0]);
        }

        let isObjectId: boolean;

        if (prop.reference === ReferenceType.SCALAR) {
          isObjectId = prop.type.toLowerCase() === 'objectid';
        } else {
          const meta2 = this.metadata.get(prop.type);
          const pk = meta2.properties[meta2.primaryKeys[0]];
          isObjectId = pk.type.toLowerCase() === 'objectid';
        }

        if (isObjectId) {
          data[k] = this.convertObjectIds(data[k]);
        }
      }
    });

    return data;
  }

  private convertObjectIds<T extends ObjectId | Dictionary | any[]>(data: T): T {
    if (data instanceof ObjectId) {
      return data;
    }

    if (Utils.isString(data) && data.match(/^[0-9a-f]{24}$/i)) {
      return new ObjectId(data) as T;
    }

    if (Array.isArray(data)) {
      return data.map((item: any) => this.convertObjectIds(item)) as T;
    }

    if (Utils.isObject(data)) {
      Object.keys(data).forEach(k => {
        data[k] = this.convertObjectIds(data[k]);
      });
    }

    return data;
  }

  private buildFilterById<T extends AnyEntity<T>>(entityName: string, id: string): FilterQuery<T> {
    const meta = this.metadata.get(entityName);


    if (meta.properties[meta.primaryKeys[0]].type.toLowerCase() === 'objectid') {
      return { _id: new ObjectId(id) } as FilterQuery<T>;
    }


    return { _id: id } as FilterQuery<T>;
  }

}
