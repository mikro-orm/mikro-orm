import { EntityData, IEntityType, IPrimaryKey } from '../decorators';
import { DatabaseDriver } from './DatabaseDriver';
import { Connection } from '../connections/Connection';
import { ReferenceType } from '../entity';
import { FilterQuery } from './IDatabaseDriver';
import { QueryBuilder, QueryOrder } from '../query';
import { Utils } from '../utils';

export abstract class AbstractSqlDriver<C extends Connection> extends DatabaseDriver<C> {

  async find<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: Record<string, QueryOrder> = {}, limit?: number, offset?: number): Promise<T[]> {
    const qb = this.createQueryBuilder(entityName);
    qb.select('*').populate(populate).where(where).orderBy(orderBy);

    if (limit !== undefined) {
      qb.limit(limit, offset);
    }

    const res = await qb.execute('all');

    return res.map((r: any) => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      const pk = this.metadata[entityName].primaryKey;
      where = { [pk]: where };
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.select('*').populate(populate).where(where).limit(1).execute('get');

    return this.mapResult(res, this.metadata[entityName]);
  }

  async count(entityName: string, where: any): Promise<number> {
    const qb = this.createQueryBuilder(entityName);
    const pk = this.metadata[entityName].primaryKey;
    const res = await qb.count(pk, true).where(where).execute('get');

    return +res.count;
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);
    const pk = this.metadata[entityName] ? this.metadata[entityName].primaryKey : this.config.getNamingStrategy().referenceColumnName();

    if (Object.keys(data).length === 0) {
      data[pk] = null;
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.insert(data).execute('run');
    const id = res.insertId || data[pk];
    await this.processManyToMany(entityName, id, collections);

    return id;
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    const pk = this.metadata[entityName] ? this.metadata[entityName].primaryKey : this.config.getNamingStrategy().referenceColumnName();

    if (Utils.isPrimaryKey(where)) {
      where = { [pk]: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: any;

    if (Object.keys(data).length) {
      const qb = this.createQueryBuilder(entityName);
      res = await qb.update(data).where(where).execute('run');
    }

    await this.processManyToMany(entityName, Utils.extractPK(data[pk] || where, this.metadata[entityName])!, collections);

    return res ? res.affectedRows : 0;
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string | any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      const pk = this.metadata[entityName] ? this.metadata[entityName].primaryKey : this.config.getNamingStrategy().referenceColumnName();
      where = { [pk]: where };
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.delete(where).execute('run');

    return res.affectedRows;
  }

  protected createQueryBuilder(entityName: string): QueryBuilder {
    return new QueryBuilder(entityName, this.metadata, this.connection, this.platform);
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
      await qb1.delete({ [fk1]: pk }).execute();

      for (const item of collections[k]) {
        const qb2 = this.createQueryBuilder(prop.pivotTable);
        await qb2.insert({ [fk1]: pk, [fk2]: item }).execute();
      }
    }
  }

}
