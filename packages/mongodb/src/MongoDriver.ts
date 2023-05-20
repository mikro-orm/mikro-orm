import type { ClientSession } from 'mongodb';
import { ObjectId } from 'bson';
import type {
  EntityData, FilterQuery, Configuration, FindOneOptions, FindOptions,
  QueryResult, Transaction, IDatabaseDriver, EntityManager, Dictionary, PopulateOptions,
  CountOptions, EntityDictionary, EntityField, NativeInsertUpdateOptions, NativeInsertUpdateManyOptions,
} from '@mikro-orm/core';
import { DatabaseDriver, EntityManagerType, ReferenceType, Utils } from '@mikro-orm/core';
import { MongoConnection } from './MongoConnection';
import { MongoPlatform } from './MongoPlatform';
import { MongoEntityManager } from './MongoEntityManager';
import type { CreateSchemaOptions } from './MongoSchemaGenerator';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  [EntityManagerType]!: MongoEntityManager<this>;

  protected readonly connection = new MongoConnection(this.config);
  protected readonly platform = new MongoPlatform();

  constructor(config: Configuration) {
    super(config, ['mongodb']);
  }

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new MongoEntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async find<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, P> = {}): Promise<EntityData<T>[]> {
    if (this.metadata.find(entityName)?.virtual) {
      return this.findVirtual(entityName, where, options);
    }

    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const orderBy = Utils.asArray(options.orderBy).map(orderBy =>
      this.renameFields(entityName, orderBy, false),
    );
    const res = await this.rethrow(this.getConnection('read').find(entityName, where, orderBy, options.limit, options.offset, fields, options.ctx));

    return res.map(r => this.mapResult<T>(r, this.metadata.find<T>(entityName))!);
  }

  async findOne<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options: FindOneOptions<T, P> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    if (this.metadata.find(entityName)?.virtual) {
      const [item] = await this.findVirtual(entityName, where, options as FindOptions<T, any>);
      /* istanbul ignore next */
      return item ?? null;
    }

    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields);
    where = this.renameFields(entityName, where, true);
    const orderBy = Utils.asArray(options.orderBy).map(orderBy =>
      this.renameFields(entityName, orderBy, false),
    );
    const res = await this.rethrow(this.getConnection('read').find(entityName, where, orderBy, 1, undefined, fields, options.ctx));

    return this.mapResult<T>(res[0], this.metadata.find(entityName)!);
  }

  async findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any>): Promise<EntityData<T>[]> {
    const meta = this.metadata.find(entityName)!;

    if (meta.expression instanceof Function) {
      const em = this.createEntityManager<MongoDriver>(false);
      return meta.expression(em, where, options) as EntityData<T>[];
    }

    /* istanbul ignore next */
    return super.findVirtual(entityName, where, options);
  }

  async count<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T> = {}, ctx?: Transaction<ClientSession>): Promise<number> {
    /* istanbul ignore next */
    if (this.metadata.find(entityName)?.virtual) {
      return this.countVirtual(entityName, where, options);
    }

    where = this.renameFields(entityName, where, true);
    return this.rethrow(this.getConnection('read').countDocuments(entityName, where as object, ctx));
  }

  async nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    data = this.renameFields(entityName, data);
    return this.rethrow(this.getConnection('write').insertOne(entityName, data, options.ctx)) as Promise<QueryResult<T>>;
  }

  async nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    data = data.map(d => this.renameFields(entityName, d));
    const meta = this.metadata.find(entityName);
    /* istanbul ignore next */
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id';
    const res = await this.rethrow(this.getConnection('write').insertMany(entityName, data as any[], options.ctx));
    res.rows = res.insertedIds!.map(id => ({ [pk]: id }));

    return res as QueryResult<T>;
  }

  async nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);
    data = this.renameFields(entityName, data);

    return this.rethrow(this.getConnection('write').updateMany(entityName, where as object, data, options.ctx, options.upsert)) as Promise<QueryResult<T>>;
  }

  async nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    where = where.map(row => {
      if (Utils.isPlainObject(row)) {
        return this.renameFields(entityName, row, true);
      }

      return row;
    });
    data = data.map(row => this.renameFields(entityName, row));

    return this.rethrow(this.getConnection('write').bulkUpdateMany(entityName, where as FilterQuery<object>[], data as object[], options.ctx, options.upsert)) as Promise<QueryResult<T>>;
  }

  async nativeDelete<T extends object>(entityName: string, where: FilterQuery<T>, options: { ctx?: Transaction<ClientSession> } = {}): Promise<QueryResult<T>> {
    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);

    return this.rethrow(this.getConnection('write').deleteMany(entityName, where as object, options.ctx)) as Promise<QueryResult<T>>;
  }

  async aggregate(entityName: string, pipeline: any[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    return this.rethrow(this.getConnection('read').aggregate(entityName, pipeline, ctx));
  }

  getPlatform(): MongoPlatform {
    return this.platform;
  }

  private renameFields<T>(entityName: string, data: T, where = false, object = false): T {
    // copy to new variable to prevent changing the T type or doing as unknown casts
    const copiedData: Dictionary = Object.assign({}, data); // copy first
    Utils.renameKey(copiedData, 'id', '_id');
    const meta = this.metadata.find(entityName);

    if (meta) {
      this.inlineEmbeddables(meta, copiedData, where, object);
    }

    // If we had a query with $fulltext and some filter we end up with $and with $fulltext in it.
    // We will try to move $fulltext to top level.
    if ('$and' in copiedData) {
      for (let i = 0; i < copiedData.$and.length; i++) {
        const and = copiedData.$and[i];
        if ('$fulltext' in and) {
          if ('$fulltext' in copiedData) {
            throw new Error('Cannot merge multiple $fulltext conditions to top level of the query object.');
          }
          copiedData.$fulltext = and.$fulltext!;
          delete and.$fulltext;
        }
      }
    }

    // move search terms from data['$fulltext'] to mongo's structure: data['$text']['search']
    if ('$fulltext' in copiedData) {
      copiedData.$text = { $search: copiedData.$fulltext! };
      delete copiedData.$fulltext;
    }

    // mongo only allows the $text operator in the root of the object and will
    // search all documents where the field has a text index.
    if (Utils.hasNestedKey(copiedData, '$fulltext')) {
      throw new Error('Full text search is only supported on the top level of the query object.');
    }

    for (const key of Object.keys(copiedData)) {
      if (Utils.isGroupOperator(key)) {
        /* istanbul ignore else */
        if (Array.isArray(copiedData[key])) {
          copiedData[key] = copiedData[key].map((v: any) => this.renameFields(entityName, v));
        } else {
          copiedData[key] = this.renameFields(entityName, copiedData[key]);
        }

        continue;
      }

      if (meta?.properties[key]) {
        const prop = meta.properties[key];
        let isObjectId = false;

        switch (prop.reference) {
          case ReferenceType.SCALAR: {
            isObjectId = prop.type.toLowerCase() === 'objectid';
            break;
          }
          case ReferenceType.EMBEDDED: {
            if (copiedData[key] == null) {
              break;
            }
            if (prop.array && !where) {
              copiedData[key] = copiedData[key].map((item: Dictionary) => this.renameFields(prop.type, item, where, object || prop.object));
            } else {
              copiedData[key] = this.renameFields(prop.type, copiedData[key], where, object || prop.object);
            }
            break;
          }
          default: {
            const meta2 = this.metadata.find(prop.type)!;
            const pk = meta2.properties[meta2.primaryKeys[0]];
            isObjectId = pk.type.toLowerCase() === 'objectid';
          }
        }

        if (isObjectId) {
          copiedData[key] = this.convertObjectIds(copiedData[key]);
        }

        if (prop.fieldNames) {
          Utils.renameKey(copiedData, key, prop.fieldNames[0]);
        }
      }

      if (Utils.isPlainObject(copiedData[key]) && '$re' in copiedData[key]) {
        copiedData[key] = new RegExp(copiedData[key].$re);
      }
    }

    return copiedData as T;
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

  private buildFilterById<T extends { _id: any }>(entityName: string, id: string): FilterQuery<T> {
    const meta = this.metadata.find(entityName)!;

    if (meta.properties[meta.primaryKeys[0]].type.toLowerCase() === 'objectid') {
      return { _id: new ObjectId(id) } as FilterQuery<T>;
    }

    return { _id: id } as FilterQuery<T>;
  }

  protected buildFields<T extends object, P extends string = never>(entityName: string, populate: PopulateOptions<T>[], fields?: readonly EntityField<T, P>[]): string[] | undefined {
    const meta = this.metadata.find<T>(entityName);

    if (!meta) {
      return fields as string[];
    }

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
        } else if (field === '*') {
          const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate));
          ret.push(...Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames)));
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
