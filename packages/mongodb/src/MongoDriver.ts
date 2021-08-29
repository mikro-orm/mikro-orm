import type { ClientSession } from 'mongodb';
import { ObjectId } from 'mongodb';
import type { EntityData, AnyEntity, FilterQuery, EntityMetadata, EntityProperty, Configuration, FindOneOptions, FindOptions,
  QueryResult, Transaction, IDatabaseDriver, EntityManager, Dictionary, PopulateOptions, CountOptions, EntityDictionary, EntityField } from '@mikro-orm/core';
import {
  DatabaseDriver, Utils, ReferenceType, EntityManagerType,
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

  async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOptions<T> = {}, ctx?: Transaction<ClientSession>): Promise<EntityData<T>[]> {
    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, options.limit, options.offset, fields, ctx));

    return res.map(r => this.mapResult<T>(r, this.metadata.find(entityName)!)!);
  }

  async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T> = { populate: [], orderBy: {} }, ctx?: Transaction<ClientSession>): Promise<EntityData<T> | null> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, 1, undefined, fields, ctx));

    return this.mapResult<T>(res[0], this.metadata.find(entityName)!);
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: CountOptions<T> = {}, ctx?: Transaction<ClientSession>): Promise<number> {
    where = this.renameFields(entityName, where, true);
    return this.rethrow(this.getConnection('read').countDocuments(entityName, where, ctx));
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    data = this.renameFields(entityName, data);
    return this.rethrow(this.getConnection('write').insertOne<T>(entityName, data as T, ctx));
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], ctx?: Transaction<ClientSession>, processCollections = true): Promise<QueryResult<T>> {
    data = data.map(d => this.renameFields(entityName, d));
    return this.rethrow(this.getConnection('write').insertMany<T>(entityName, data as any[], ctx));
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);
    data = this.renameFields(entityName, data);

    return this.rethrow(this.getConnection('write').updateMany(entityName, where as FilterQuery<T>, data as T, ctx));
  }

  async nativeUpdateMany<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], ctx?: Transaction<ClientSession>, processCollections?: boolean): Promise<QueryResult<T>> {
    data = data.map(row => this.renameFields(entityName, row));
    return this.rethrow(this.getConnection('write').bulkUpdateMany(entityName, where, data as T[], ctx));
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction<ClientSession>): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);

    return this.rethrow(this.getConnection('write').deleteMany(entityName, where, ctx));
  }

  async aggregate(entityName: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    return this.rethrow(this.getConnection('read').aggregate(entityName, pipeline, ctx));
  }

  async createCollections(): Promise<void> {
    const existing = await this.getConnection('write').listCollections();
    const metadata = Object.values(this.metadata.getAll()).filter(meta => {
      const isRootEntity = meta.root.className === meta.className;
      return isRootEntity && !meta.embeddable;
    });

    const promises = metadata
      .filter(meta => !existing.includes(meta.collection))
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

      for (const prop of meta.props) {
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
      const collection = this.getConnection('write').getCollection(meta.name!);

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
      promises.push(this.getConnection('write').getCollection(meta.name!).createIndex(fieldOrSpec, {
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

    return [this.getConnection('write').getCollection(meta.name!).createIndex(fieldOrSpec, {
      name: (Utils.isString(prop[type]) ? prop[type] : undefined) as string,
      unique: type === 'unique',
      sparse: prop.nullable === true,
    })];
  }

  private renameFields<T>(entityName: string, data: T, where = false): T {
    data = Object.assign({}, data); // copy first
    Utils.renameKey(data, 'id', '_id');
    const meta = this.metadata.find(entityName);

    if (meta) {
      this.inlineEmbeddables(meta, data, where);
    }

    Object.keys(data).forEach(k => {
      if (Utils.isGroupOperator(k)) {
        /* istanbul ignore else */
        if (Array.isArray(data[k])) {
          data[k] = data[k].map((v: any) => this.renameFields(entityName, v));
        } else {
          data[k] = this.renameFields(entityName, data[k]);
        }

        return;
      }

      if (meta?.properties[k]) {
        const prop = meta.properties[k];
        let isObjectId = false;

        if (prop.reference === ReferenceType.SCALAR) {
          isObjectId = prop.type.toLowerCase() === 'objectid';
        } else if (prop.reference !== ReferenceType.EMBEDDED) {
          const meta2 = this.metadata.find(prop.type)!;
          const pk = meta2.properties[meta2.primaryKeys[0]];
          isObjectId = pk.type.toLowerCase() === 'objectid';
        }

        if (isObjectId) {
          data[k] = this.convertObjectIds(data[k]);
        }

        if (prop.fieldNames) {
          Utils.renameKey(data, k, prop.fieldNames[0]);
        }
      }

      if (Utils.isPlainObject(data[k]) && '$re' in data[k]) {
        data[k] = new RegExp(data[k].$re);
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
      return (data as T[]).map((item: any) => this.convertObjectIds(item)) as T;
    }

    if (Utils.isObject(data)) {
      Object.keys(data).forEach(k => {
        data[k] = this.convertObjectIds(data[k]);
      });
    }

    return data;
  }

  private buildFilterById<T extends AnyEntity<T>>(entityName: string, id: string): FilterQuery<T> {
    const meta = this.metadata.find(entityName)!;

    if (meta.properties[meta.primaryKeys[0]].type.toLowerCase() === 'objectid') {
      return { _id: new ObjectId(id) } as FilterQuery<T>;
    }

    return { _id: id } as FilterQuery<T>;
  }

  protected buildFields<T extends AnyEntity<T>, P extends string = never>(entityName: string, populate: PopulateOptions<T>[], fields?: readonly EntityField<T, P>[]): string[] | undefined {
    const meta = this.metadata.find<T>(entityName)!;
    const lazyProps = meta.props.filter(prop => prop.lazy && !populate.some(p => p.field === prop.name || p.all));
    const ret: string[] = [];

    if (fields) {
      for (const field of fields) {
        if (Utils.isPlainObject(field) || field.toString().includes('.')) {
          continue;
        }

        let prop = meta.properties[field as keyof T & string];

        /* istanbul ignore else */
        if (prop) {
          prop = prop.serializedPrimaryKey ? meta.getPrimaryProps()[0] : prop;
          ret.push(prop.fieldNames[0]);
        } else {
          ret.push(field as keyof T & string);
        }
      }

      ret.unshift(...meta.primaryKeys.filter(pk => !fields.includes(pk)));
    } else if (lazyProps.filter(p => !p.formula).length > 0) {
      const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate));
      ret.push(...Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames)));
    }

    return ret.length > 0 ? ret : undefined;
  }

}
