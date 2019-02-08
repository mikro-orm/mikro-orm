import { Connection, ConnectionOptions, createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';
import { URL } from 'url';

import { IEntity, IPrimaryKey } from '..';
import { ReferenceType } from '../decorators/Entity';
import { DatabaseDriver, FilterQuery } from './DatabaseDriver';
import { QueryBuilder } from '../QueryBuilder';
import { Utils } from '../utils/Utils';

export class MySqlDriver extends DatabaseDriver {

  private connection: Connection;

  async connect(): Promise<void> {
    this.connection = await createConnection(this.getConnectionOptions());
  }

  async close(force?: boolean): Promise<void> {
    await this.connection.end({ force });
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async begin(): Promise<void> {
    await this.connection.beginTransaction();
  }

  async commit(): Promise<void> {
    await this.connection.commit();
  }

  async rollback(): Promise<void> {
    await this.connection.rollback();
  }

  async count(entityName: string, where: any): Promise<number> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.count('id', true).where(where);
    const res = await this.execute(qb);

    return res[0][0].count;
  }

  async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: { [p: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).orderBy(orderBy);

    if (limit !== undefined) {
      qb.limit(limit, offset);
    }

    const res = await this.execute(qb);

    return res[0].map((r: any) => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).limit(1);
    const res = await this.execute(qb);

    return this.mapResult(res[0][0], this.metadata[entityName]);
  }

  getDefaultClientUrl(): string {
    return 'mysql://root@127.0.0.1:3306';
  }

  async nativeInsert(entityName: string, data: any): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.insert(data);
    const res = await this.execute(qb);
    await this.processManyToMany(entityName, res[0].insertId, collections);

    return res[0].insertId;
  }

  async nativeUpdate(entityName: string, where: FilterQuery<IEntity>, data: any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: any[] = [];

    if (Object.keys(data).length) {
      const qb = new QueryBuilder(entityName, this.metadata);
      qb.update(data).where(where);
      res = await this.execute(qb);
    }

    await this.processManyToMany(entityName, Utils.extractPK(data.id || where)!, collections);

    return res[0] ? res[0].affectedRows : 0;
  }

  async nativeDelete(entityName: string, where: FilterQuery<IEntity> | string | any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.delete(where);
    const res = await this.execute(qb);

    return res[0].affectedRows;
  }

  async execute(query: string | QueryBuilder, params?: any): Promise<any[]> {
    if (query instanceof QueryBuilder) {
      params = query.getParams();
      query = query.getQuery();
    }

    try {
      const now = Date.now();
      const res = await this.connection.execute(query, params);
      this.logQuery(query + ` [took ${Date.now() - now} ms]`);

      return res;
    } catch (e) {
      e.message += `\n in query: ${query}`;

      if (params && params.length) {
        e.message += `\n with params: ${JSON.stringify(params)}`;
      }

      throw e;
    }
  }

  async loadFile(path: string): Promise<void> {
    const file = readFileSync(path);
    await this.connection.query(file.toString());
  }

  getConnectionOptions(): ConnectionOptions {
    const ret = {} as ConnectionOptions;
    const url = new URL(this.options.clientUrl!);
    ret.host = this.options.host || url.hostname;
    ret.port = this.options.port || +url.port;
    ret.user = this.options.user || url.username;
    ret.password = this.options.password || url.password;
    ret.database = this.options.dbName || url.pathname.replace(/^\//, '');

    if (this.options.multipleStatements) {
      ret.multipleStatements = this.options.multipleStatements;
    }

    return ret;
  }

  private extractManyToMany(entityName: string, data: any): any {
    if (!this.metadata[entityName]) {
      return {};
    }

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
    const props = this.metadata[entityName].properties;

    for (const k of Object.keys(collections)) {
      const prop = props[k];
      const fk1 = prop.joinColumn;

      if (prop.owner) {
        const qb1 = new QueryBuilder(prop.pivotTable, this.metadata);
        const fk2 = prop.inverseJoinColumn;
        qb1.delete({ [fk1]: pk });
        await this.execute(qb1);

        for (const item of collections[k]) {
          const qb2 = new QueryBuilder(prop.pivotTable, this.metadata);
          qb2.insert({ [fk1]: pk, [fk2]: item });
          await this.execute(qb2);
        }
      }
    }
  }

}
