import { FilterQuery } from './DatabaseDriver';
import { DriverConfig, UnderscoreNamingStrategy } from '..';
import { Utils } from '../utils/Utils';
import { SqliteConnection } from '../connections/SqliteConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { EntityData, IEntityType } from '../decorators/Entity';

export class SqliteDriver extends AbstractSqlDriver<SqliteConnection> {

  protected readonly connection = new SqliteConnection(this.options, this.logger);

  async count(entityName: string, where: any): Promise<number> {
    const qb = this.createQueryBuilder(entityName);
    const res = await qb.count('id', true).where(where).execute('get');

    return res.count;
  }

  async find<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, populate: string[] = [], orderBy: { [p: string]: 1 | -1 } = {}, limit?: number, offset?: number): Promise<T[]> {
    const qb = this.createQueryBuilder(entityName);
    qb.select('*').populate(populate).where(where).orderBy(orderBy);

    if (limit !== undefined) {
      qb.limit(limit, offset);
    }

    const res = await qb.execute();

    return res.map((r: any) => this.mapResult(r, this.metadata[entityName]));
  }

  async findOne<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string, populate: string[] = []): Promise<T | null> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.select('*').populate(populate).where(where).limit(1).execute('get');

    return this.mapResult(res, this.metadata[entityName]);
  }

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);

    if (Object.keys(data).length === 0) {
      data.id = null;
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.insert(data).execute('run');
    await this.processManyToMany(entityName, res.lastID, collections);

    return res.lastID;
  }

  async nativeUpdate<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T>, data: EntityData<T>): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const collections = this.extractManyToMany(entityName, data);
    let res: any;

    if (Object.keys(data).length) {
      const qb = this.createQueryBuilder(entityName);
      res = await qb.update(data).where(where).execute('run');
    }

    await this.processManyToMany(entityName, Utils.extractPK(data.id || where)!, collections);

    return res ? res.changes : 0;
  }

  async nativeDelete<T extends IEntityType<T>>(entityName: string, where: FilterQuery<T> | string | any): Promise<number> {
    if (Utils.isPrimaryKey(where)) {
      where = { id: where };
    }

    const qb = this.createQueryBuilder(entityName);
    const res = await qb.delete(where).execute('run');

    return res.changes;
  }

  getConfig(): DriverConfig {
    return {
      usesPivotTable: true,
      supportsTransactions: true,
      supportsSavePoints: true,
      namingStrategy: UnderscoreNamingStrategy,
    };
  }

}
