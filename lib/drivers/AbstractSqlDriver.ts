import { EntityData, IEntityType, IPrimaryKey } from '../decorators';
import { DatabaseDriver } from './DatabaseDriver';
import { Connection, QueryResult } from '../connections';
import { ReferenceType } from '../entity';
import { FilterQuery } from './IDatabaseDriver';
import { QueryBuilder, QueryOrderMap } from '../query';
import { Utils } from '../utils';
import { LockMode } from '../unit-of-work';

export abstract class AbstractSqlDriver<C extends Connection> extends DatabaseDriver<C> {

  async find<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: QueryOrderMap = {}, limit?: number, offset?: number): Promise<T[]> {
    const qb = this.createQueryBuilder(entityName);
    qb.select('*').populate(populate).where(where).orderBy(orderBy);

    if (limit !== undefined) {
      qb.limit(limit, offset);
    }

    return qb.execute('all');
  }

  async findOne<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string, populate: string[] = [], orderBy: QueryOrderMap = {}, fields?: string[], lockMode?: LockMode): Promise<T | null> {
    const pk = this.metadata[entityName].primaryKey;

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where };
    }

    if (fields && !fields.includes(pk)) {
      fields.unshift(pk);
    }

    return this.createQueryBuilder(entityName)
      .select(fields || '*')
      .populate(populate)
      .where(where)
      .orderBy(orderBy)
      .limit(1)
      .setLockMode(lockMode)
      .execute('get');
  }

  async count(entityName: string, where: any): Promise<number> {
    const qb = this.createQueryBuilder(entityName);
    const pk = this.metadata[entityName].primaryKey;
    const res = await qb.count(pk, true).where(where).execute('get', false);

    return +res.count;
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<QueryResult> {
    const collections = this.extractManyToMany(entityName, data);
    const pk = this.getPrimaryKeyField(entityName);

    if (Object.keys(data).length === 0) {
      data[pk] = null;
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.insert(data).execute('run', false);
    res.insertId = res.insertId || data[pk];
    await this.processManyToMany(entityName, res.insertId, collections);

    return res;
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>): Promise<QueryResult> {
    const pk = this.metadata[entityName] ? this.metadata[entityName].primaryKey : this.config.getNamingStrategy().referenceColumnName();

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: QueryResult = { affectedRows: 0, insertId: 0 };

    if (Object.keys(data).length) {
      const qb = this.createQueryBuilder(entityName);
      res = await qb.update(data).where(where).execute('run', false);
    }

    await this.processManyToMany(entityName, Utils.extractPK(data[pk] || where, this.metadata[entityName])!, collections);

    return res;
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string | any): Promise<QueryResult> {
    if (Utils.isPrimaryKey(where)) {
      const pk = this.metadata[entityName] ? this.metadata[entityName].primaryKey : this.config.getNamingStrategy().referenceColumnName();
      where = { [pk]: where };
    }

    return this.createQueryBuilder(entityName).delete(where).execute('run', false);
  }

  protected createQueryBuilder(entityName: string): QueryBuilder {
    return new QueryBuilder(entityName, this.metadata, this);
  }

  protected extractManyToMany<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): EntityData<T> {
    if (!this.metadata[entityName]) {
      return {};
    }

    const props = this.metadata[entityName].properties;
    const ret: EntityData<T> = {};

    for (const k of Object.keys(data)) {
      const prop = props[k];

      if (prop && prop.reference === ReferenceType.MANY_TO_MANY) {
        ret[k] = data[k];
        delete data[k];
      }
    }

    return ret;
  }

  protected async processManyToMany<T extends IEntityType<T>>(entityName: string, pk: IPrimaryKey, collections: EntityData<T>) {
    if (!this.metadata[entityName]) {
      return;
    }

    const props = this.metadata[entityName].properties;
    const owners = Object.keys(collections).filter(k => props[k].owner);

    for (const k of owners) {
      const prop = props[k];
      const fk1 = prop.joinColumn;
      const fk2 = prop.inverseJoinColumn;
      const qb1 = this.createQueryBuilder(prop.pivotTable);
      await qb1.delete({ [fk1]: pk }).execute('run', false);

      for (const item of collections[k]) {
        const qb2 = this.createQueryBuilder(prop.pivotTable);
        await qb2.insert({ [fk1]: pk, [fk2]: item }).execute('run', false);
      }
    }
  }

}
