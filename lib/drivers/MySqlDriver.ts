import { DatabaseDriver, FilterQuery } from './DatabaseDriver';
import { Connection, createConnection } from 'mysql2/promise';
import { BaseEntity, ReferenceType } from '../BaseEntity';
import { QueryBuilder } from '../QueryBuilder';
import { IPrimaryKey } from '..';
import { Utils } from '../Utils';

export class MySqlDriver extends DatabaseDriver {

  protected connection: Connection;

  async connect(): Promise<void> {
    // FIXME add support for clientUrl
    // this.connection = await createConnection(this.options.clientUrl);
    this.connection = await createConnection({
      port: 3357,
      user: 'root',
      host: 'localhost',
      database: 'mikro-orm-test',
    });
  }

  async close(force: boolean): Promise<void> {
    await this.connection.end({ force });
  }

  isConnected(): boolean {
    // FIXME we need to test this properly
    return (this.connection as any).state === 'connected';
  }

  async begin(savepoint: string = null): Promise<void> {
    await this.connection.beginTransaction();
  }

  async commit(savepoint: string = null): Promise<void> {
    await this.connection.commit();
  }

  async rollback(savepoint: string = null): Promise<void> {
    await this.connection.rollback();
  }

  async aggregate(entityName: string, pipeline: any[]): Promise<any[]> {
    return undefined;
  }

  async count(entityName: string, where: any): Promise<number> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.count('id').where(where);
    const res = await this.execute(qb);

    return res[0][0].count;
  }

  async find<T extends BaseEntity>(entityName: string, where: FilterQuery<T>, populate: string[], orderBy: { [p: string]: 1 | -1 }, limit: number, offset: number): Promise<T[]> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).orderBy(orderBy).limit(limit, offset);
    const res = await this.execute(qb);

    return res[0];
  }

  async findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[]): Promise<T> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).limit(1);
    const res = await this.execute(qb);

    return res[0][0];
  }

  getDefaultClientUrl(): string {
    return 'mysql://localhost:3306';
  }

  async nativeInsert(entityName: string, data: any): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.insert(data);
    const res = await this.execute(qb);
    await this.processManyToMany(entityName, res[0].insertId, collections);

    return res[0].insertId;
  }

  async nativeUpdate(entityName: string, where: FilterQuery<BaseEntity>, data: any): Promise<any> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.update(data).where(where);
    const res = await this.execute(qb);
    await this.processManyToMany(entityName, Utils.extractPK(data.id || where), collections);

    return res[0].affectedRows;
  }

  async nativeDelete(entityName: string, where: FilterQuery<BaseEntity> | string | any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.delete(where);
    const res = await this.execute(qb);

    return res[0].affectedRows;
  }

  async execute(query: string | QueryBuilder, params?: any): Promise<any> {
    if (query instanceof QueryBuilder) {
      return this.execute(query.getQuery(), query.getParams());
    }

    this.logQuery(query);

    return this.connection.execute(query, params);
  }

  private extractManyToMany(entityName: string, data: any): any {
    const props = this.metadata[entityName].properties;
    const ret = {} as any;

    for (const k of Object.keys(data)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY) {
        ret[k] = data[k];
        delete data[k];
      }
    }

    return ret;
  }

  private async processManyToMany(entityName: string, pk: IPrimaryKey, collections: any) {
    const fk1 = this.getTableName(entityName);
    const props = this.metadata[entityName].properties;

    for (const k of Object.keys(collections)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY && prop.owner) {
        const qb1 = new QueryBuilder(prop.pivotTable, this.metadata);
        const fk2 = this.getTableName(prop.type);
        qb1.delete({ [fk1]: pk });
        await this.execute(qb1);

        // TODO add order column so we do not need to sort by PK?
        for (const item of collections[k]) {
          const qb2 = new QueryBuilder(prop.pivotTable, this.metadata);
          qb2.insert({ [fk1]: pk, [fk2]: item });
          await this.execute(qb2);
        }
      }
    }
  }

}
