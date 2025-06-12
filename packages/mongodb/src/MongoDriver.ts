import { ObjectId, type ClientSession } from 'mongodb';
import {
  type Configuration,
  type CountOptions,
  DatabaseDriver,
  type Dictionary,
  type EntityData,
  type EntityDictionary,
  type EntityField,
  type EntityKey,
  EntityManagerType,
  type EntityName,
  type FilterQuery,
  type FindByCursorOptions,
  type FindOneOptions,
  type FindOptions,
  type NativeInsertUpdateManyOptions,
  type NativeInsertUpdateOptions,
  type PopulateOptions,
  type PopulatePath,
  type QueryResult,
  ReferenceKind,
  type Transaction,
  type UpsertManyOptions,
  type UpsertOptions,
  Utils,
} from '@mikro-orm/core';
import { MongoConnection } from './MongoConnection.js';
import { MongoPlatform } from './MongoPlatform.js';
import { MongoEntityManager } from './MongoEntityManager.js';

export class MongoDriver extends DatabaseDriver<MongoConnection> {

  override [EntityManagerType]!: MongoEntityManager<this>;

  protected override readonly connection = new MongoConnection(this.config);
  protected override readonly platform = new MongoPlatform();

  constructor(config: Configuration) {
    super(config, ['mongodb']);
  }

  override createEntityManager(useContext?: boolean): this[typeof EntityManagerType] {
    const EntityManagerClass = this.config.get('entityManager', MongoEntityManager);
    return new EntityManagerClass(this.config, this, this.metadata, useContext);
  }

  async find<T extends object, P extends string = never, F extends string = '*', E extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, P, F, E> = {}): Promise<EntityData<T>[]> {
    entityName = Utils.className(entityName);

    if (this.metadata.find(entityName)?.virtual) {
      return this.findVirtual(entityName, where, options);
    }

    const { first, last, before, after } = options as FindByCursorOptions<T>;
    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields, options.exclude as any[]);
    where = this.renameFields(entityName, where, true);
    const isCursorPagination = [first, last, before, after].some(v => v != null);

    if (isCursorPagination) {
      const andWhere = (cond1: FilterQuery<T>, cond2: FilterQuery<T>): FilterQuery<T> => {
        if (Utils.isEmpty(cond1)) {
          return cond2;
        }

        if (Utils.isEmpty(cond2)) {
          return cond1;
        }

        return { $and: [cond1, cond2] } as FilterQuery<T>;
      };
      const meta = this.metadata.find<T>(entityName)!;
      const { orderBy: newOrderBy, where: newWhere } = this.processCursorOptions(meta, options, options.orderBy!);
      const newWhereConverted = this.renameFields(entityName, newWhere as FilterQuery<T>, true);
      const orderBy = Utils.asArray(newOrderBy).map(order => this.renameFields(entityName, order, true));
      const res = await this.rethrow(this.getConnection('read').find(entityName, andWhere(where, newWhereConverted), orderBy, options.limit, options.offset, fields, options.ctx, options.logging));

      if (isCursorPagination && !first && !!last) {
        res.reverse();
      }

      return res.map(r => this.mapResult<T>(r, this.metadata.find<T>(entityName))!);
    }

    const orderBy = Utils.asArray(options.orderBy).map(orderBy =>
      this.renameFields(entityName, orderBy, true),
    );
    const res = await this.rethrow(this.getConnection('read').find(entityName, where, orderBy, options.limit, options.offset, fields, options.ctx));

    return res.map(r => this.mapResult<T>(r, this.metadata.find<T>(entityName))!);
  }

  async findOne<T extends object, P extends string = never, F extends string = PopulatePath.ALL, E extends string = never>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOneOptions<T, P, F, E> = { populate: [], orderBy: {} }): Promise<EntityData<T> | null> {
    entityName = Utils.className(entityName);

    if (this.metadata.find(entityName)?.virtual) {
      const [item] = await this.findVirtual(entityName, where, options as FindOptions<T, any, any, any>);
      /* v8 ignore next */
      return item ?? null;
    }

    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    const fields = this.buildFields(entityName, options.populate as unknown as PopulateOptions<T>[] || [], options.fields, options.exclude as any[]);
    where = this.renameFields(entityName, where, true);
    const orderBy = Utils.asArray(options.orderBy).map(orderBy =>
      this.renameFields(entityName, orderBy, true),
    );
    const res = await this.rethrow(this.getConnection('read').find(entityName, where, orderBy, 1, undefined, fields, options.ctx, options.logging));

    return this.mapResult<T>(res[0], this.metadata.find(entityName)!);
  }

  override async findVirtual<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: FindOptions<T, any, any, any>): Promise<EntityData<T>[]> {
    entityName = Utils.className(entityName);
    const meta = this.metadata.find(entityName)!;

    if (meta.expression instanceof Function) {
      const em = this.createEntityManager();
      return meta.expression(em, where, options) as EntityData<T>[];
    }

    /* v8 ignore next */
    return super.findVirtual(entityName, where, options);
  }

  async count<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: CountOptions<T> = {}, ctx?: Transaction<ClientSession>): Promise<number> {
    entityName = Utils.className(entityName);

    /* v8 ignore next 3 */
    if (this.metadata.find(entityName)?.virtual) {
      return this.countVirtual(entityName, where, options);
    }

    where = this.renameFields(entityName, where, true);
    return this.rethrow(this.getConnection('read').countDocuments(entityName, where as object, ctx));
  }

  async nativeInsert<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);
    data = this.renameFields(entityName, data);
    return this.rethrow(this.getConnection('write').insertOne(entityName, data, options.ctx)) as unknown as Promise<QueryResult<T>>;
  }

  async nativeInsertMany<T extends object>(entityName: EntityName<T>, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);
    data = data.map(d => this.renameFields(entityName, d));
    const meta = this.metadata.find(entityName);
    /* v8 ignore next */
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id';
    const res = await this.rethrow(this.getConnection('write').insertMany(entityName, data as any[], options.ctx));
    res.rows = res.insertedIds!.map(id => ({ [pk]: id }));

    return res as unknown as QueryResult<T>;
  }

  async nativeUpdate<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, data: EntityDictionary<T>, options: NativeInsertUpdateOptions<T> & UpsertOptions<T> = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);

    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);
    data = this.renameFields(entityName, data);
    options = { ...options };

    const meta = this.metadata.find(entityName);
    /* v8 ignore next */
    const rename = (field: keyof T) => meta ? (meta.properties[field as string]?.fieldNames[0] as keyof T ?? field) : field;

    if (options.onConflictFields && Array.isArray(options.onConflictFields)) {
      options.onConflictFields = options.onConflictFields.map(rename);
    }

    if (options.onConflictMergeFields) {
      options.onConflictMergeFields = options.onConflictMergeFields.map(rename) as never[];
    }

    if (options.onConflictExcludeFields) {
      options.onConflictExcludeFields = options.onConflictExcludeFields.map(rename) as never[];
    }

    return this.rethrow(this.getConnection('write').updateMany<T>(entityName, where as object, data as object, options.ctx, options.upsert, options));
  }

  override async nativeUpdateMany<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>[], data: EntityDictionary<T>[], options: NativeInsertUpdateOptions<T> & UpsertManyOptions<T> = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);
    where = where.map(row => {
      if (Utils.isPlainObject(row)) {
        return this.renameFields(entityName, row, true);
      }

      return row;
    });
    data = data.map(row => this.renameFields(entityName, row));
    options = { ...options };

    const meta = this.metadata.find(entityName);
    /* v8 ignore next */
    const rename = (field: keyof T) => meta ? (meta.properties[field as string]?.fieldNames[0] as keyof T ?? field) : field;

    if (options.onConflictFields && Array.isArray(options.onConflictFields)) {
      options.onConflictFields = options.onConflictFields.map(rename);
    }

    if (options.onConflictMergeFields) {
      options.onConflictMergeFields = options.onConflictMergeFields.map(rename) as never[];
    }

    if (options.onConflictExcludeFields) {
      options.onConflictExcludeFields = options.onConflictExcludeFields.map(rename) as never[];
    }

    /* v8 ignore next */
    const pk = meta?.getPrimaryProps()[0].fieldNames[0] ?? '_id';
    const res = await this.rethrow(this.getConnection('write').bulkUpdateMany<T>(entityName, where as object[], data as object[], options.ctx, options.upsert, options));

    if (res.insertedIds) {
      let i = 0;
      res.rows = where.map(cond => {
        if (Utils.isEmpty(cond)) {
          return { [pk]: res.insertedIds![i++] };
        }

        return { [pk]: cond[pk as EntityKey] };
      });
    }

    return res;
  }

  async nativeDelete<T extends object>(entityName: EntityName<T>, where: FilterQuery<T>, options: { ctx?: Transaction<ClientSession> } = {}): Promise<QueryResult<T>> {
    entityName = Utils.className(entityName);

    if (Utils.isPrimaryKey(where)) {
      where = this.buildFilterById(entityName, where as string);
    }

    where = this.renameFields(entityName, where, true);

    return this.rethrow(this.getConnection('write').deleteMany(entityName, where as object, options.ctx)) as unknown as Promise<QueryResult<T>>;
  }

  override async aggregate<T>(entityName: EntityName<T>, pipeline: Dictionary[], ctx?: Transaction<ClientSession>): Promise<any[]> {
    entityName = Utils.className(entityName);
    return this.rethrow(this.getConnection('read').aggregate(entityName, pipeline, ctx));
  }

  override getPlatform(): MongoPlatform {
    return this.platform;
  }

  private renameFields<T extends object>(entityName: string, data: T, dotPaths = false, object?: boolean): T {
    // copy to new variable to prevent changing the T type or doing as unknown casts
    const copiedData: Dictionary = Object.assign({}, data); // copy first
    const meta = this.metadata.find(entityName);

    if (meta?.serializedPrimaryKey && !meta.embeddable && meta.serializedPrimaryKey !== meta.primaryKeys[0]) {
      Utils.renameKey(copiedData, meta.serializedPrimaryKey, meta.primaryKeys[0]);
    }

    if (meta && !meta.embeddable) {
      this.inlineEmbeddables(meta, copiedData, dotPaths);
    }

    // If we had a query with $fulltext and some filter we end up with $and with $fulltext in it.
    // We will try to move $fulltext to top level.
    if (copiedData.$and) {
      for (let i = 0; i < copiedData.$and.length; i++) {
        const and = copiedData.$and[i];
        if ('$fulltext' in and) {
          /* v8 ignore next 3 */
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

    Utils.keys(copiedData).forEach(k => {
      if (Utils.isGroupOperator(k)) {
        /* v8 ignore next 5 */
        if (Array.isArray(copiedData[k])) {
          copiedData[k] = (copiedData[k] as any[]).map(v => this.renameFields(entityName, v));
        } else {
          copiedData[k] = this.renameFields(entityName, copiedData[k]);
        }

        return;
      }

      if (meta?.properties[k as EntityKey<T>]) {
        const prop = meta.properties[k];
        let isObjectId = false;

        if (prop.kind === ReferenceKind.SCALAR) {
          isObjectId = prop.type.toLowerCase() === 'objectid';
        } else if (prop.kind === ReferenceKind.EMBEDDED) {
          if (copiedData[prop.name] == null) {
            return;
          }

          if (prop.array && Array.isArray(copiedData[prop.name])) {
            copiedData[prop.name] = copiedData[prop.name].map((item: Dictionary) => this.renameFields(prop.type, item, dotPaths, true));
          } else {
            copiedData[prop.name] = this.renameFields(prop.type, copiedData[prop.name], dotPaths, prop.object || object);
          }
        } else {
          const meta2 = this.metadata.find(prop.type)!;
          const pk = meta2.properties[meta2.primaryKeys[0]];
          isObjectId = pk.type.toLowerCase() === 'objectid';
        }

        if (isObjectId) {
          copiedData[k] = this.convertObjectIds(copiedData[k]);
        }

        if (prop.fieldNames) {
          Utils.renameKey(copiedData, k, prop.fieldNames[0]);
        }
      }

      if (Utils.isPlainObject(copiedData[k]) && '$re' in copiedData[k]) {
        copiedData[k] = new RegExp(copiedData[k].$re);
      }
    });

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

  protected buildFields<T extends object, P extends string = never>(entityName: string, populate: PopulateOptions<T>[], fields?: readonly EntityField<T, P>[], exclude?: string[]): string[] | undefined {
    const meta = this.metadata.find<T>(entityName);

    if (!meta) {
      return fields as string[];
    }

    const lazyProps = meta.props.filter(prop => prop.lazy && !populate.some(p => p.field === prop.name || p.all));
    const ret: string[] = [];

    if (fields) {
      for (let field of fields) {
        /* v8 ignore next 3 */
        if (Utils.isPlainObject(field)) {
          continue;
        }

        if (field.toString().includes('.')) {
          field = field.toString().substring(0, field.toString().indexOf('.')) as EntityField<T, P>;
        }

        let prop = meta.properties[field as EntityKey<T>];

        /* v8 ignore start */
        if (prop) {
          if (!prop.fieldNames) {
            continue;
          }

          prop = prop.serializedPrimaryKey ? meta.getPrimaryProps()[0] : prop;
          ret.push(prop.fieldNames[0]);
        } else if (field === '*') {
          const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate));
          ret.push(...Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames)));
        } else {
          ret.push(field as keyof T & string);
        }
        /* v8 ignore stop */
      }

      ret.unshift(...meta.primaryKeys.filter(pk => !fields.includes(pk)));
    } else if (!Utils.isEmpty(exclude) || lazyProps.some(p => !p.formula)) {
      const props = meta.props.filter(prop => this.platform.shouldHaveColumn(prop, populate, exclude));
      ret.push(...Utils.flatten(props.filter(p => !lazyProps.includes(p)).map(p => p.fieldNames)));
    }

    return ret.length > 0 ? ret : undefined;
  }

}
