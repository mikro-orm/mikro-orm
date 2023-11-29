import {
  EntityManagerType,
  type CountOptions,
  type LockOptions,
  type DeleteOptions,
  type FindOneOptions,
  type FindOptions,
  type IDatabaseDriver,
  type NativeInsertUpdateManyOptions,
  type NativeInsertUpdateOptions,
  type DriverMethodOptions,
  type OrderDefinition,
} from './IDatabaseDriver';
import type {
  ConnectionType,
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityKey,
  EntityMetadata,
  EntityProperty,
  FilterObject,
  FilterQuery,
  PopulateOptions,
  Primary,
} from '../typings';
import type { MetadataStorage } from '../metadata';
import type { Connection, QueryResult, Transaction } from '../connections';
import { EntityComparator, Utils, type Configuration, type ConnectionOptions, Cursor, raw } from '../utils';
import { type QueryOrder, ReferenceKind, type QueryOrderKeys, QueryOrderNumeric } from '../enums';
import type { Platform } from '../platforms';
import type { Collection } from '../entity/Collection';
import { EntityManager } from '../EntityManager';
import { ValidationError } from '../errors';
import { DriverException } from '../exceptions';
import { helper } from '../entity/wrap';
import type { Logger } from '../logging/Logger';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  [EntityManagerType]!: EntityManager<this>;

  protected readonly connection!: C;
  protected readonly replicas: C[] = [];
  protected readonly platform!: Platform;
  protected readonly logger: Logger;
  protected comparator!: EntityComparator;
  protected metadata!: MetadataStorage;

  protected constructor(readonly config: Configuration,
                        protected readonly dependencies: string[]) {
    this.logger = this.config.getLogger();
  }

  abstract find<T extends object, P extends string = never, F extends string = '*'>(entityName: string, where: FilterQuery<T>, options?: FindOptions<T, P, F>): Promise<EntityData<T>[]>;

  abstract findOne<T extends object, P extends string = never, F extends string = '*'>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P, F>): Promise<EntityData<T> | null>;

  abstract nativeInsert<T extends object>(entityName: string, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  abstract nativeInsertMany<T extends object>(entityName: string, data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>>;

  abstract nativeUpdate<T extends object>(entityName: string, where: FilterQuery<T>, data: EntityDictionary<T>, options?: NativeInsertUpdateOptions<T>): Promise<QueryResult<T>>;

  async nativeUpdateMany<T extends object>(entityName: string, where: FilterQuery<T>[], data: EntityDictionary<T>[], options?: NativeInsertUpdateManyOptions<T>): Promise<QueryResult<T>> {
    throw new Error(`Batch updates are not supported by ${this.constructor.name} driver`);
  }

  abstract nativeDelete<T extends object>(entityName: string, where: FilterQuery<T>, options?: DeleteOptions<T>): Promise<QueryResult<T>>;

  abstract count<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: CountOptions<T, P>): Promise<number>;

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new EntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  /* istanbul ignore next */
  async findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any, any>): Promise<EntityData<T>[]> {
    throw new Error(`Virtual entities are not supported by ${this.constructor.name} driver.`);
  }

  /* istanbul ignore next */
  async countVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T, any>): Promise<number> {
    throw new Error(`Counting virtual entities is not supported by ${this.constructor.name} driver.`);
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<any>, orderBy?: OrderDefinition<T>, ctx?: Transaction, options?: FindOptions<T, any, any>, pivotJoin?: boolean): Promise<Dictionary<T[]>> {
    throw new Error(`${this.constructor.name} does not use pivot tables`);
  }

  async syncCollections<T extends object, O extends object>(collections: Iterable<Collection<T, O>>, options?: DriverMethodOptions): Promise<void> {
    for (const coll of collections) {
      if (!coll.property.owner) {
        if (coll.getSnapshot() === undefined) {
          throw ValidationError.cannotModifyInverseCollection(coll.owner, coll.property);
        }

        continue;
      }

      /* istanbul ignore next */
      {
        const pk = coll.property.targetMeta!.primaryKeys[0];
        const data = { [coll.property.name]: coll.getIdentifiers(pk) } as EntityData<T>;
        await this.nativeUpdate<T>(coll.owner.constructor.name, helper(coll.owner).getPrimaryKey() as FilterQuery<T>, data, options);
      }
    }
  }

  mapResult<T extends object>(result: EntityDictionary<T>, meta?: EntityMetadata<T>, populate: PopulateOptions<T>[] = []): EntityData<T> | null {
    if (!result || !meta) {
      return result ?? null;
    }

    return this.comparator.mapResult<T>(meta.className, result);
  }

  async connect(): Promise<C> {
    await this.connection.connect();
    await Promise.all(this.replicas.map(replica => replica.connect()));

    return this.connection;
  }

  async reconnect(): Promise<C> {
    await this.close(true);
    await this.connect();

    return this.connection;
  }

  getConnection(type: ConnectionType = 'write'): C {
    if (type === 'write' || this.replicas.length === 0) {
      return this.connection as C;
    }

    const rand = Utils.randomInt(0, this.replicas.length - 1);

    return this.replicas[rand] as C;
  }

  async close(force?: boolean): Promise<void> {
    await Promise.all(this.replicas.map(replica => replica.close(force)));
    await this.connection.close(force);
  }

  getPlatform(): Platform {
    return this.platform;
  }

  setMetadata(metadata: MetadataStorage): void {
    this.metadata = metadata;
    this.comparator = new EntityComparator(this.metadata, this.platform);
    this.connection.setMetadata(metadata);
    this.connection.setPlatform(this.platform);
    this.replicas.forEach(replica => {
      replica.setMetadata(metadata);
      replica.setPlatform(this.platform);
    });
  }

  getMetadata(): MetadataStorage {
    return this.metadata;
  }

  getDependencies(): string[] {
    return this.dependencies;
  }

  protected processCursorOptions<T extends object, P extends string>(meta: EntityMetadata<T>, options: FindOptions<T, P, any>, orderBy: OrderDefinition<T>): { orderBy: OrderDefinition<T>[]; where: FilterQuery<T> } {
    const { first, last, before, after, overfetch } = options;
    const limit = first || last;
    const isLast = !first && !!last;
    const definition = Cursor.getDefinition(meta, orderBy);
    const $and: FilterQuery<T>[] = [];

    // allow POJO as well, we care only about the correct key being present
    const isCursor = (val: unknown, key: 'startCursor' | 'endCursor'): val is Cursor<T, any> => {
      return !!val && typeof val === 'object' && key in val;
    };
    const createCursor = (val: unknown, key: 'startCursor' | 'endCursor', inverse = false) => {
      let def = isCursor(val, key) ? val[key] : val;

      if (Utils.isPlainObject<FilterObject<T>>(def)) {
        def = Cursor.for<T>(meta, def, orderBy);
      }

      const offsets = def ? Cursor.decode(def as string) as Dictionary[] : [];

      if (definition.length === offsets.length) {
        return this.createCursorCondition<T>(definition, offsets, inverse);
      }

      return {} as FilterQuery<T>;
    };

    if (after) {
      $and.push(createCursor(after, 'endCursor'));
    }

    if (before) {
      $and.push(createCursor(before, 'startCursor', true));
    }

    if (limit) {
      options.limit = limit + (overfetch ? 1 : 0);
    }

    const createOrderBy = (prop: string, direction: QueryOrderKeys<T>): OrderDefinition<T> => {
      if (Utils.isPlainObject(direction)) {
        const value = Utils.keys(direction).reduce((o, key) => {
          Object.assign(o, createOrderBy(key as string, direction[key] as QueryOrderKeys<T>));
          return o;
        }, {});
        return ({ [prop]: value }) as OrderDefinition<T>;
      }

      const desc = direction as unknown === QueryOrderNumeric.DESC || direction.toString().toLowerCase() === 'desc';
      const dir = Utils.xor(desc, isLast) ? 'desc' : 'asc';
      return ({ [prop]: dir }) as OrderDefinition<T>;
    };

    return {
      orderBy: definition.map(([prop, direction]) => createOrderBy(prop, direction)),
      where: ($and.length > 1 ? { $and } : { ...$and[0] }) as FilterQuery<T>,
    };
  }

  protected createCursorCondition<T extends object>(definition: (readonly [keyof T & string, QueryOrder])[], offsets: Dictionary[], inverse = false): FilterQuery<T> {
    const createCondition = (prop: string, direction: QueryOrderKeys<T>, offset: Dictionary, eq = false) => {
      if (Utils.isPlainObject(direction)) {
        const value = Utils.keys(direction).reduce((o, key) => {
          Object.assign(o, createCondition(key as string, direction[key] as QueryOrderKeys<T>, offset[prop][key], eq));
          return o;
        }, {});
        return ({ [prop]: value });
      }

      const desc = direction as unknown === QueryOrderNumeric.DESC || direction.toString().toLowerCase() === 'desc';
      const operator = Utils.xor(desc, inverse) ? '$lt' : '$gt';

      return { [prop]: { [operator + (eq ? 'e' : '')]: offset } } as FilterQuery<T>;
    };

    const [order, ...otherOrders] = definition;
    const [offset, ...otherOffsets] = offsets;
    const [prop, direction] = order;

    if (!otherOrders.length) {
      return createCondition(prop, direction, offset) as FilterQuery<T>;
    }

    return {
      ...createCondition(prop, direction, offset, true),
      $or: [
        createCondition(prop, direction, offset),
        this.createCursorCondition(otherOrders, otherOffsets, inverse),
      ],
    } as FilterQuery<T>;
  }

  /** @internal */
  mapDataToFieldNames(data: Dictionary, stringifyJsonArrays: boolean, properties?: Record<string, EntityProperty>, convertCustomTypes?: boolean, object?: boolean) {
    if (!properties || data == null) {
      return data;
    }

    data = Object.assign({}, data); // copy first

    Object.keys(data).forEach(k => {
      const prop = properties[k];

      if (!prop) {
        return;
      }

      if (prop.embeddedProps && !prop.object && !object) {
        const copy = data[k];
        delete data[k];
        Object.assign(data, this.mapDataToFieldNames(copy, stringifyJsonArrays, prop.embeddedProps, convertCustomTypes));

        return;
      }

      if (prop.embeddedProps && (prop.object || object)) {
        const copy = data[k];
        delete data[k];

        if (prop.array) {
          data[prop.fieldNames[0]] = copy.map((item: Dictionary) => this.mapDataToFieldNames(item, stringifyJsonArrays, prop.embeddedProps, convertCustomTypes, true));
        } else {
          data[prop.fieldNames[0]] = this.mapDataToFieldNames(copy, stringifyJsonArrays, prop.embeddedProps, convertCustomTypes, true);
        }

        if (stringifyJsonArrays && prop.array) {
          data[prop.fieldNames[0]] = this.platform.convertJsonToDatabaseValue(data[prop.fieldNames[0]]);
        }

        return;
      }

      if (prop.joinColumns && Array.isArray(data[k])) {
        const copy = Utils.flatten(data[k]);
        delete data[k];
        prop.joinColumns.forEach((joinColumn, idx) => data[joinColumn] = copy[idx]);

        return;
      }

      if (prop.customType && convertCustomTypes && !this.platform.isRaw(data[k])) {
        data[k] = prop.customType.convertToDatabaseValue(data[k], this.platform, { fromQuery: true, key: k, mode: 'query-data' });
      }

      if (prop.hasConvertToDatabaseValueSQL && !this.platform.isRaw(data[k])) {
        const quoted = this.platform.quoteValue(data[k]);
        const sql = prop.customType.convertToDatabaseValueSQL!(quoted, this.platform);
        data[k] = raw(sql.replace(/\?/g, '\\?'));
      }

      if (!prop.customType && (Array.isArray(data[k]) || Utils.isPlainObject(data[k]))) {
        data[k] = JSON.stringify(data[k]);
      }

      if (prop.fieldNames) {
        Utils.renameKey(data, k, prop.fieldNames[0]);
      }
    });

    return data;
  }

  protected inlineEmbeddables<T extends object>(meta: EntityMetadata<T>, data: T, where?: boolean): void {
    if (data == null) {
      return;
    }

    Utils.keys(data).forEach(k => {
      if (Utils.isOperator(k as string)) {
        Utils.asArray(data[k]).forEach(payload => this.inlineEmbeddables(meta, payload as T, where));
      }
    });

    meta.props.forEach(prop => {
      if (prop.kind === ReferenceKind.EMBEDDED && prop.object && !where && Utils.isObject(data[prop.name])) {
        return;
      }

      if (prop.kind === ReferenceKind.EMBEDDED && Utils.isObject(data[prop.name])) {
        const props = prop.embeddedProps;
        let unknownProp = false;

        Object.keys(data[prop.name] as Dictionary).forEach(kk => {
          // explicitly allow `$exists`, `$eq` and `$ne` operators here as they can't be misused this way
          const operator = Object.keys(data[prop.name] as Dictionary).some(f => Utils.isOperator(f) && !['$exists', '$ne', '$eq'].includes(f));

          if (operator) {
            throw ValidationError.cannotUseOperatorsInsideEmbeddables(meta.name!, prop.name, data);
          }

          if (prop.object && where) {
            const inline: (payload: any, sub: EntityProperty, path: string[]) => void = (payload: any, sub: EntityProperty, path: string[]) => {
              if (sub.kind === ReferenceKind.EMBEDDED && Utils.isObject(payload[sub.embedded![1]])) {
                return Object.keys(payload[sub.embedded![1]]).forEach(kkk => {
                  if (!sub.embeddedProps[kkk]) {
                    throw ValidationError.invalidEmbeddableQuery(meta.className, kkk, sub.type);
                  }

                  inline(payload[sub.embedded![1]], sub.embeddedProps[kkk], [...path, sub.embedded![1]]);
                });
              }

              data[`${path.join('.')}.${sub.embedded![1]}` as EntityKey<T>] = payload[sub.embedded![1]];
            };

            const parentPropName = kk.substring(0, kk.indexOf('.'));

            // we might be using some native JSON operator, e.g. with mongodb's `$geoWithin` or `$exists`
            if (props[kk]) {
              inline(data[prop.name], props[kk] || props[parentPropName], [prop.name]);
            } else if (props[parentPropName]) {
              data[`${prop.name}.${kk}` as keyof T] = (data[prop.name] as Dictionary)[kk];
            } else {
              unknownProp = true;
            }
          } else if (props[kk]) {
            data[props[kk].name as EntityKey<T>] = data[prop.name][props[kk].embedded![1] as EntityKey<T>] as T[EntityKey<T>];
          } else {
            throw ValidationError.invalidEmbeddableQuery(meta.className, kk, prop.type);
          }
        });

        if (!unknownProp) {
          delete data[prop.name];
        }
      }
    });
  }

  protected getPrimaryKeyFields(entityName: string): string[] {
    const meta = this.metadata.find(entityName);
    return meta ? Utils.flatten(meta.getPrimaryProps().map(pk => pk.fieldNames)) : [this.config.getNamingStrategy().referenceColumnName()];
  }

  protected createReplicas(cb: (c: ConnectionOptions) => C): C[] {
    const replicas = this.config.get('replicas', [])!;
    const ret: C[] = [];
    const props = ['dbName', 'clientUrl', 'host', 'port', 'user', 'password', 'multipleStatements', 'pool', 'name'] as const;

    replicas.forEach((conf: Partial<ConnectionOptions>) => {
      props.forEach(prop => (conf[prop] as any) = prop in conf ? conf[prop] : this.config.get(prop));
      ret.push(cb(conf as ConnectionOptions));
    });

    return ret;
  }

  async lockPessimistic<T extends object>(entity: T, options: LockOptions): Promise<void> {
    throw new Error(`Pessimistic locks are not supported by ${this.constructor.name} driver`);
  }

  /**
   * @inheritDoc
   */
  convertException(exception: Error): DriverException {
    if (exception instanceof DriverException) {
      return exception;
    }

    return this.platform.getExceptionConverter().convertException(exception);
  }

  protected rethrow<T>(promise: Promise<T>): Promise<T> {
    return promise.catch(e => {
      throw this.convertException(e);
    });
  }

  /**
   * @internal
   */
  getTableName<T>(meta: EntityMetadata<T>, options: NativeInsertUpdateManyOptions<T>): string {
    const tableName = this.platform.quoteIdentifier(meta.tableName);
    const schema = this.getSchemaName(meta, options);

    if (schema) {
      return this.platform.quoteIdentifier(schema) + '.' + tableName;
    }

    return tableName;
  }

  /**
   * @internal
   */
  getSchemaName(meta?: EntityMetadata, options?: { schema?: string }): string | undefined {
    if (meta?.schema && meta.schema !== '*') {
      return meta.schema;
    }

    if (options?.schema === '*') {
      return this.config.get('schema');
    }

    const schemaName = meta?.schema === '*' ? this.config.get('schema') : meta?.schema;

    return options?.schema ?? schemaName ?? this.config.get('schema');
  }

}
