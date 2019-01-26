import * as sqlite from 'sqlite';
import { Database } from 'sqlite';
import { readFileSync } from 'fs';

import { DatabaseDriver, FilterQuery } from './DatabaseDriver';
import { QueryBuilder, QueryType } from '../QueryBuilder';
import { IEntity, IPrimaryKey, ReferenceType } from '..';
import { Utils } from '../Utils';

export class SqliteDriver extends DatabaseDriver {

  protected connection: Database;

  async connect(): Promise<void> {
    this.connection = await sqlite.open(this.options.dbName);
    await this.connection.exec('PRAGMA foreign_keys = ON');
  }

  async close(force?: boolean): Promise<void> {
    await this.connection.close();
  }

  async isConnected(): Promise<boolean> {
    return this.connection['driver']['open'];
  }

  async begin(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `SAVEPOINT ${savepoint}` : 'BEGIN', [], 'run');
  }

  async commit(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `RELEASE SAVEPOINT ${savepoint}` : 'COMMIT', [], 'run');
  }

  async rollback(savepoint?: string): Promise<void> {
    await this.execute(savepoint ? `ROLLBACK TO SAVEPOINT ${savepoint}` : 'ROLLBACK', [], 'run');
  }

  async count(entityName: string, where: any): Promise<number> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.count('id', true).where(where);
    const res = await this.execute(qb, [], 'get');

    return res.count;
  }

  async find<T extends IEntity>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: { [p: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).orderBy(orderBy).limit(limit, offset);
    const res = await this.execute(qb);

    return res.map(r => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntity>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.select('*').populate(populate).where(where).limit(1);
    const res = await this.execute(qb, [], 'get');

    return this.mapResult(res, this.metadata[entityName]);
  }

  getDefaultClientUrl(): string {
    return '';
  }

  async nativeInsert(entityName: string, data: any): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);

    if (Object.keys(data).length === 0) {
      data.id = null;
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.insert(data);
    const res = await this.execute(qb, [], 'run');
    await this.processManyToMany(entityName, res.lastID, collections);

    return res.lastID;
  }

  async nativeUpdate(entityName: string, where: FilterQuery<IEntity>, data: any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: any;

    if (Object.keys(data).length) {
      const qb = new QueryBuilder(entityName, this.metadata);
      qb.update(data).where(where);
      res = await this.execute(qb, [], 'run');
    }

    await this.processManyToMany(entityName, Utils.extractPK(data.id || where), collections);

    return res ? res.changes : 0;
  }

  async nativeDelete(entityName: string, where: FilterQuery<IEntity> | string | any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = new QueryBuilder(entityName, this.metadata);
    qb.delete(where);
    const res = await this.execute(qb);

    return res.changes;
  }

  async execute(query: string | QueryBuilder, params: any[] = [], method: 'all' | 'get' | 'run' = 'all'): Promise<any> {
    if (query instanceof QueryBuilder) {
      method = method !== 'run' && query.type !== QueryType.SELECT ? 'run' : method;
      params = query.getParams();
      query = query.getQuery();
    }

    params = params.map(p => {
      if (p instanceof Date) {
        p = p.toISOString();
      }

      if (typeof p === 'boolean') {
        p = +p;
      }

      return p;
    });

    try {
      const now = Date.now();
      const statement = await this.connection.prepare(query);
      const res = await statement[method](...params);
      await statement.finalize();
      this.logQuery(query + ` [took ${Date.now() - now} ms]`);

      return res;
    } catch (e) {
      e.message += `\n in query: ${query}`;

      if (params.length) {
        e.message += `\n with params: ${JSON.stringify(params)}`;
      }

      throw e;
    }
  }

  async loadFile(path: string): Promise<void> {
    const file = readFileSync(path);
    await this.connection.exec(file.toString());
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
