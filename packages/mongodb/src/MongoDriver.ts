import type { ClientSession } from 'mongodb';
import { ObjectId } from 'bson';
import type {
  EntityData, AnyEntity, FilterQuery, Configuration, FindOneOptions, FindOptions,
  QueryResult, Transaction, IDatabaseDriver, EntityManager, Dictionary, PopulateOptions,
  CountOptions, EntityDictionary, EntityField, NativeInsertUpdateOptions, NativeInsertUpdateManyOptions,
} from '@mikro-orm/core';
import {
  DatabaseDriver, Utils, ReferenceType, EntityManagerType,
} from '@mikro-orm/core';
import { MongoConnection } from './MongoConnection';
import { MongoPlatform } from './MongoPlatform';
import { MongoEntityManager } from './MongoEntityManager';
import type { CreateSchemaOptions } from './MongoSchemaGenerator';

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

  async find<T extends AnyEntity<T>, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<EntityData<T>[]> {
    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, options.limit, options.offset, fields, options.ctx));

    return res.map(r => this.mapResult<T>(r, this.metadata.find(entityName)!)!);
  }

  async findOne<T extends AnyEntity<T>, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T, P> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const res = await this.rethrow(this.getConnection('read').find<T>(entityName, where, options.orderBy, 1, undefined, fields, options.ctx));

    return this.mapResult<T>(res[0], this.metadata.find(entityName)!);
  }

  async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: CountOptions<T> = {}, ctx?: Transaction<ClientSession>): Promise<number> {
    where = this.renameFields(entityName, where, true);
    return this.rethrow(this.getConnection('read').countDocuments(entityName, where, ctx));
  }

  async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    data = this.renameFields(entityName, data);
    return this.rethrow(this.getConnection('write').insertOne<T>(entityName, data as T, options.ctx));
  }

  async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    data = data.map(d => this.renameFields(entityName, d));
    const meta = this.metadata.find(entityName);
    /* istanbul ignore next */
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id';
    const res = await this.rethrow(this.getConnection('write').insertMany<T>(entityName, data as any[], options.ctx));
    res.rows = res.insertedIds!.map(id => ({ [pk]: id }));

    return res;
  }

  async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);
    data = this.renameFields(entityName, data);

    return this.rethrow(this.getConnection('write').updateMany(entityName, where as FilterQuery<T>, data as T, options.ctx));
  }

  async nativeUpdateMany<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    data = data.map(row => this.renameFields(entityName, row));
    return this.rethrow(this.getConnection('write').bulkUpdateMany(entityName, where, data as T[], options.ctx));
  }

  async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options: { ctx?: Transaction<ClientSession> } = {}): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);

    return this.rethrow(this.getConnection('write').deleteMany(entityName, where, options.ctx));
  }

  async aggregate(entityName: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    return this.rethrow(this.getConnection('read').aggregate(entityName, pipeline, ctx));
  }

  getPlatform(): MongoPlatform {
    return this.platform;
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

  /**
   * @deprecated use `orm.getSchemaGenerator().createSchema()` instead
   */
  async createCollections(): Promise<void> {
    await this.platform.getSchemaGenerator(this).createSchema();
  }

  /**
   * @deprecated use `orm.getSchemaGenerator().dropSchema()` instead
   */
  async dropCollections(): Promise<void> {
    await this.platform.getSchemaGenerator(this).dropSchema();
  }

  /**
   * @deprecated use `orm.getSchemaGenerator().refreshDatabase()` instead
   */
  async refreshCollections(options: CreateSchemaOptions = {}): Promise<void> {
    await this.platform.getSchemaGenerator(this).refreshDatabase(options);
  }

  /**
   * @deprecated use `orm.getSchemaGenerator().ensureIndexes()` instead
   */
  async ensureIndexes(): Promise<void> {
    await this.platform.getSchemaGenerator(this).ensureIndexes();
  }

}
