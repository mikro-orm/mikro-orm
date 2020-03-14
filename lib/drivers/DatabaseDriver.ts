import { FindOneOptions, FindOptions, IDatabaseDriver } from './IDatabaseDriver';
import { EntityData, EntityMetadata, EntityProperty, FilterQuery, AnyEntity, Primary, Dictionary } from '../typings';
import { MetadataStorage } from '../metadata';
import { Connection, QueryResult, Transaction } from '../connections';
import { Configuration, ConnectionOptions, Utils } from '../utils';
import { QueryOrder, QueryOrderMap } from '../query';
import { Platform } from '../platforms';
import { Collection, wrap } from '../entity';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  protected readonly connection!: C;
  protected readonly replicas: C[] = [];
  protected readonly platform!: Platform;
  protected readonly logger = this.config.getLogger();
  protected metadata!: MetadataStorage;

  protected constructor(protected readonly config: Configuration,
                        protected readonly dependencies: string[]) { }

  abstract async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOptions, ctx?: Transaction): Promise<T[]>;

  abstract async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, options?: FindOneOptions, ctx?: Transaction): Promise<T | null>;

  abstract async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<number>;

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends AnyEntity<T>, O extends AnyEntity<O>>(prop: EntityProperty, owners: Primary<O>[], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Dictionary<T[]>> {
    throw new Error(`${this.constructor.name} does not use pivot tables`);
  }

  async syncCollection<T extends AnyEntity<T>>(coll: Collection<T>, ctx?: Transaction): Promise<void> {
    const pk = this.metadata.get(coll.property.type).primaryKey;
    const data = { [coll.property.name]: coll.getIdentifiers(pk) } as EntityData<T>;
    await this.nativeUpdate(coll.owner.constructor.name, wrap(coll.owner).__primaryKey, data, ctx);
  }

  mapResult<T extends AnyEntity<T>>(result: EntityData<T>, meta: EntityMetadata): T | null {
    if (!result || !meta) {
      return null;
    }

    const ret = Object.assign({}, result) as any;

    Object.values(meta.properties).forEach(prop => {
      if (prop.fieldName && prop.fieldName in ret) {
        Utils.renameKey(ret, prop.fieldName, prop.name);
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

  protected getPrimaryKeyField(entityName: string): string {
    const meta = this.metadata.get(entityName, false, false);
    return meta ? meta.primaryKey : this.config.getNamingStrategy().referenceColumnName();
  }

  protected getPivotInverseProperty(prop: EntityProperty): EntityProperty {
    const pivotMeta = this.metadata.get(prop.pivotTable);
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

}
