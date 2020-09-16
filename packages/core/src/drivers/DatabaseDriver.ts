import { EntityManagerType, FindOneOptions, FindOptions, IDatabaseDriver } from './IDatabaseDriver';
import { EntityData, EntityMetadata, EntityProperty, FilterQuery, AnyEntity, Dictionary, Primary, PopulateOptions } from '../typings';
import { MetadataStorage } from '../metadata';
import { Connection, QueryResult, Transaction } from '../connections';
import { Configuration, ConnectionOptions, Utils } from '../utils';
import { LockMode, QueryOrder, QueryOrderMap, ReferenceType } from '../enums';
import { Platform } from '../platforms';
import { Collection } from '../entity';
import { EntityManager } from '../EntityManager';
import { ValidationError } from '../errors';
import { DriverException } from '../exceptions';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  [EntityManagerType]: EntityManager<this>;

  protected readonly connection!: C;
  protected readonly replicas: C[] = [];
  protected readonly platform!: Platform;
  protected readonly logger = this.config.getLogger();
  protected metadata!: MetadataStorage;

  protected constructor(protected readonly config: Configuration,
                        protected readonly dependencies: string[]) { }

  abstract async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOptions<T>, ctx?: Transaction): Promise<T[]>;

  abstract async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions<T>, ctx?: Transaction): Promise<T | null>;

  abstract async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>[], ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<number>;

  createEntityManager<D extends IDatabaseDriver = IDatabaseDriver>(useContext?: boolean): D[typeof EntityManagerType] {
    return new EntityManager(this.config, this, this.metadata, useContext) as unknown as EntityManager<D>;
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends AnyEntity<T>, O extends AnyEntity<O>>(prop: EntityProperty, owners: Primary<O>[][], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Dictionary<T[]>> {
    throw new Error(`${this.constructor.name} does not use pivot tables`);
  }

  async syncCollection<T extends AnyEntity<T>, O extends AnyEntity<O>>(coll: Collection<T, O>, ctx?: Transaction): Promise<void> {
    const pk = this.metadata.find(coll.property.type)!.primaryKeys[0];
    const data = { [coll.property.name]: coll.getIdentifiers(pk) } as EntityData<T>;
    await this.nativeUpdate<T>(coll.owner.constructor.name, coll.owner.__helper!.__primaryKey, data, ctx);
  }

  mapResult<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata, populate: PopulateOptions<T>[] = []): T | null {
    if (!result || !meta) {
      return null;
    }

    const ret = Object.assign({}, result) as any;

    meta.props.forEach(prop => {
      if (prop.fieldNames && prop.fieldNames.length > 1 && prop.fieldNames.every(joinColumn => Utils.isDefined(ret[joinColumn], true))) {
        const temp: any[] = [];
        prop.fieldNames.forEach(joinColumn => {
          temp.push(ret[joinColumn]);
          delete ret[joinColumn];
        });

        ret[prop.name] = temp;
      } else if (prop.fieldNames && prop.fieldNames[0] in ret) {
        Utils.renameKey(ret, prop.fieldNames[0], prop.name);
      }

      if (prop.type === 'boolean' && ![null, undefined].includes(ret[prop.name])) {
        ret[prop.name] = !!ret[prop.name];
      }
    });

    return ret as T;
  }

  async connect(): Promise<C> {
    await this.connection.connect();
    await Promise.all(this.replicas.map(replica => replica.connect()));

    return this.connection;
  }

  async reconnect(): Promise<C> {
    await this.close(true);
    return this.connect();
  }

  getConnection(type: 'read' | 'write' = 'write'): C {
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
    this.connection.setMetadata(metadata);
  }

  getDependencies(): string[] {
    return this.dependencies;
  }

  async ensureIndexes(): Promise<void> {
    throw new Error(`${this.constructor.name} does not use ensureIndexes`);
  }

  protected inlineEmbeddables<T>(meta: EntityMetadata<T>, data: T): void {
    Object.keys(data).forEach(k => {
      if (Utils.isOperator(k)) {
        Utils.asArray(data[k]).forEach(payload => this.inlineEmbeddables(meta, payload));
      }
    });

    meta.props.forEach(prop => {
      if (prop.reference === ReferenceType.EMBEDDED && Utils.isObject(data[prop.name])) {
        const props = prop.embeddedProps;

        Object.keys(data[prop.name]).forEach(kk => {
          const operator = Object.keys(data[prop.name]).some(f => Utils.isOperator(f));

          if (operator) {
            throw ValidationError.cannotUseOperatorsInsideEmbeddables(meta.name!, prop.name, data);
          }

          data[props[kk].name] = data[prop.name][props[kk].embedded![1]];
        });
        delete data[prop.name];
      }
    });
  }

  protected getPivotOrderBy(prop: EntityProperty, orderBy?: QueryOrderMap): QueryOrderMap {
    if (orderBy) {
      return orderBy;
    }

    if (prop.orderBy) {
      return prop.orderBy;
    }

    if (prop.fixedOrder) {
      return { [`${prop.pivotTable}.${prop.fixedOrderColumn}`]: QueryOrder.ASC };
    }

    return {};
  }

  protected getPrimaryKeyFields(entityName: string): string[] {
    const meta = this.metadata.find(entityName);
    return meta ? meta.primaryKeys : [this.config.getNamingStrategy().referenceColumnName()];
  }

  protected getPivotInverseProperty(prop: EntityProperty): EntityProperty {
    const pivotMeta = this.metadata.find(prop.pivotTable)!;
    let inverse: string;

    if (prop.owner) {
      const pivotProp1 = pivotMeta.properties[prop.type + '_inverse'];
      inverse = pivotProp1.mappedBy;
    } else {
      const pivotProp1 = pivotMeta.properties[prop.type + '_owner'];
      inverse = pivotProp1.inversedBy;
    }

    return pivotMeta.properties[inverse];
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

  async lockPessimistic<T extends AnyEntity<T>>(entity: T, mode: LockMode, ctx?: Transaction): Promise<void> {
    throw new Error(`Pessimistic locks are not supported by ${this.constructor.name} driver`);
  }

  protected shouldHaveColumn<T extends AnyEntity<T>>(prop: EntityProperty<T>, populate: PopulateOptions<T>[], includeFormulas = true): boolean {
    if (prop.formula) {
      return includeFormulas;
    }

    if (prop.persist === false) {
      return false;
    }

    if (prop.lazy && !populate.some(p => p.field === prop.name)) {
      return false;
    }

    return [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(prop.reference) || (prop.reference === ReferenceType.ONE_TO_ONE && prop.owner);
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

}
