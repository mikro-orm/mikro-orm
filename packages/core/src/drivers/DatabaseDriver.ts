import type { CountOptions, LockOptions, DeleteOptions, FindOneOptions, FindOptions, IDatabaseDriver, NativeInsertUpdateManyOptions, NativeInsertUpdateOptions, DriverMethodOptions } from './IDatabaseDriver';
import { EntityManagerType } from './IDatabaseDriver';
import type { ConnectionType, Dictionary, EntityData, EntityDictionary, EntityMetadata, EntityProperty, FilterQuery, PopulateOptions, Primary } from '../typings';
import type { MetadataStorage } from '../metadata';
import type { Connection, QueryResult, Transaction } from '../connections';
import type { Configuration, ConnectionOptions } from '../utils';
import { EntityComparator, Utils } from '../utils';
import type { QueryOrderMap } from '../enums';
import { QueryOrder, ReferenceType } from '../enums';
import type { Platform } from '../platforms';
import type { Collection } from '../entity/Collection';
import { EntityManager } from '../EntityManager';
import { ValidationError } from '../errors';
import { DriverException } from '../exceptions';
import { helper } from '../entity/wrap';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  [EntityManagerType]!: EntityManager<this>;

  protected readonly connection!: C;
  protected readonly replicas: C[] = [];
  protected readonly platform!: Platform;
  protected readonly logger = this.config.getLogger();
  protected comparator!: EntityComparator;
  protected metadata!: MetadataStorage;

  protected constructor(readonly config: Configuration,
                        protected readonly dependencies: string[]) { }

  async init(): Promise<void> {
    // do nothing on this level
  }

  abstract find<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOptions<T, P>): Promise<EntityData<T>[]>;

  abstract findOne<T extends object, P extends string = never>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T, P>): Promise<EntityData<T> | null>;

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
  async findVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: FindOptions<T, any>): Promise<EntityData<T>[]> {
    throw new Error(`Virtual entities are not supported by ${this.constructor.name} driver.`);
  }

  /* istanbul ignore next */
  async countVirtual<T extends object>(entityName: string, where: FilterQuery<T>, options: CountOptions<T>): Promise<number> {
    throw new Error(`Counting virtual entities is not supported by ${this.constructor.name} driver.`);
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends object, O extends object>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<any>, orderBy?: QueryOrderMap<T>[], ctx?: Transaction, options?: FindOptions<T, any>): Promise<Dictionary<T[]>> {
    throw new Error(`${this.constructor.name} does not use pivot tables`);
  }

  async syncCollection<T extends object, O extends object>(coll: Collection<T, O>, options?: DriverMethodOptions): Promise<void> {
    const pk = coll.property.targetMeta!.primaryKeys[0];
    const data = { [coll.property.name]: coll.getIdentifiers(pk) } as EntityData<T>;
    await this.nativeUpdate<T>(coll.owner.constructor.name, helper(coll.owner).getPrimaryKey() as FilterQuery<T>, data, options);
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
    await this.init();

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

    if (this.config.getCacheAdapter()?.close) {
      await this.config.getCacheAdapter().close!();
    }

    if (this.config.getResultCacheAdapter()?.close) {
      await this.config.getResultCacheAdapter().close!();
    }
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

  protected inlineEmbeddables<T>(meta: EntityMetadata<T>, data: T, where?: boolean): void {
    Object.keys(data as Dictionary).forEach(k => {
      if (Utils.isOperator(k)) {
        Utils.asArray(data[k]).forEach(payload => this.inlineEmbeddables(meta, payload, where));
      }
    });

    meta.props.forEach(prop => {
      if (prop.reference === ReferenceType.EMBEDDED && prop.object && !where && Utils.isObject(data[prop.name])) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED && Utils.isObject(data[prop.name])) {
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
              if (sub.reference === ReferenceType.EMBEDDED && Utils.isObject(payload[sub.embedded![1]])) {
                return Object.keys(payload[sub.embedded![1]]).forEach(kkk => {
                  if (!sub.embeddedProps[kkk]) {
                    throw ValidationError.invalidEmbeddableQuery(meta.className, kkk, sub.type);
                  }

                  inline(payload[sub.embedded![1]], sub.embeddedProps[kkk], [...path, sub.embedded![1]]);
                });
              }

              data[`${path.join('.')}.${sub.embedded![1]}`] = payload[sub.embedded![1]];
            };

            // we might be using some native JSON operator, e.g. with mongodb's `$geoWithin` or `$exists`
            if (props[kk]) {
              inline(data[prop.name], props[kk], [prop.name]);
            } else {
              unknownProp = true;
            }
          } else if (props[kk]) {
            data[props[kk].name] = data[prop.name][props[kk].embedded![1]];
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

  protected getPivotOrderBy<T>(prop: EntityProperty<T>, orderBy?: QueryOrderMap<T>[]): QueryOrderMap<T>[] {
    if (!Utils.isEmpty(orderBy)) {
      return orderBy!;
    }

    if (!Utils.isEmpty(prop.orderBy)) {
      return Utils.asArray(prop.orderBy);
    }

    if (prop.fixedOrder) {
      return [{ [`${prop.pivotEntity}.${prop.fixedOrderColumn}`]: QueryOrder.ASC } as QueryOrderMap<T>];
    }

    return [];
  }

  protected getPrimaryKeyFields(entityName: string): string[] {
    const meta = this.metadata.find(entityName);
    return meta ? Utils.flatten(meta.getPrimaryProps().map(pk => pk.fieldNames)) : [this.config.getNamingStrategy().referenceColumnName()];
  }

  protected getPivotInverseProperty(prop: EntityProperty): EntityProperty {
    const pivotMeta = this.metadata.find(prop.pivotEntity)!;

    if (prop.owner) {
      return pivotMeta.relations[0];
    }

    return pivotMeta.relations[1];
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

  async lockPessimistic<T>(entity: T, options: LockOptions): Promise<void> {
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
