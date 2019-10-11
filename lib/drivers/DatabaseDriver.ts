import { IDatabaseDriver } from './IDatabaseDriver';
import { EntityData, EntityMetadata, EntityProperty, FilterQuery, AnyEntity, Primary } from '../types';
import { MetadataStorage } from '../metadata';
import { Connection, QueryResult, Transaction } from '../connections';
import { Configuration, ConnectionOptions, Utils } from '../utils';
import { QueryOrder, QueryOrderMap } from '../query';
import { Platform } from '../platforms';
import { LockMode } from '../unit-of-work';

export abstract class DatabaseDriver<C extends Connection> implements IDatabaseDriver<C> {

  protected readonly connection: C;
  protected readonly replicas: C[] = [];
  protected readonly platform: Platform;
  protected readonly logger = this.config.getLogger();
  protected metadata: MetadataStorage;

  protected constructor(protected readonly config: Configuration,
                        protected readonly dependencies: string[]) { }

  abstract async find<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate?: string[], orderBy?: QueryOrderMap, fields?: string[], limit?: number, offset?: number, ctx?: Transaction): Promise<T[]>;

  abstract async findOne<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy?: QueryOrderMap, fields?: string[], lockMode?: LockMode, ctx?: Transaction): Promise<T | null>;

  abstract async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeUpdate<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<QueryResult>;

  abstract async count<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T>, ctx?: Transaction): Promise<number>;

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    throw new Error(`Aggregations are not supported by ${this.constructor.name} driver`);
  }

  async loadFromPivotTable<T extends AnyEntity<T>>(prop: EntityProperty, owners: Primary<T>[], where?: FilterQuery<T>, orderBy?: QueryOrderMap, ctx?: Transaction): Promise<Record<string, T[]>> {
    if (!this.platform.usesPivotTable()) {
      throw new Error(`${this.constructor.name} does not use pivot tables`);
    }

    const fk1 = prop.joinColumn;
    const fk2 = prop.inverseJoinColumn;
    const pivotProp2 = this.getPivotInverseProperty(prop);
    where = { ...where, [`${prop.pivotTable}.${pivotProp2.name}`]: { $in: owners } };
    orderBy = orderBy || prop.orderBy || { [`${(prop.pivotTable)}.${this.metadata.get(prop.pivotTable).primaryKey}`]: QueryOrder.ASC };
    const items = owners.length ? await this.find(prop.type, where, [prop.pivotTable], orderBy, undefined, undefined, undefined, ctx) : [];

    const map: Record<string, T[]> = {};
    owners.forEach(owner => map['' + owner] = []);
    items.forEach((item: any) => {
      map[item[fk1]].push(item);
      delete item[fk1];
      delete item[fk2];
    });

    return map;
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

      if (prop.type === 'boolean') {
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

  protected getPrimaryKeyField(entityName: string): string {
    const meta = this.metadata.get(entityName, false, false);
    return meta ? meta.primaryKey : this.config.getNamingStrategy().referenceColumnName();
  }

  protected getPivotInverseProperty(prop: EntityProperty): EntityProperty {
    const pivotMeta = this.metadata.get(prop.pivotTable);
    const pivotProp1 = pivotMeta.properties[prop.type];
    const inverse = pivotProp1.mappedBy || pivotProp1.inversedBy;

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
