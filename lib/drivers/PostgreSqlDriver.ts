import { PostgreSqlConnection } from '../connections/PostgreSqlConnection';
import { AbstractSqlDriver } from './AbstractSqlDriver';
import { EntityData, IEntityType } from '../decorators';
import { QueryType } from '../query';
import { PostgreSqlPlatform } from '../platforms/PostgreSqlPlatform';

export class PostgreSqlDriver extends AbstractSqlDriver<PostgreSqlConnection> {

  protected readonly connection = new PostgreSqlConnection(this.config);
  protected readonly platform = new PostgreSqlPlatform();

  async nativeInsert<T extends IEntityType<T>>(entityName: string, data: EntityData<T>): Promise<number> {
    const collections = this.extractManyToMany(entityName, data);
    const qb = this.createQueryBuilder(entityName).insert(data);
    const params = qb.getParams();
    let sql = qb.getQuery();

    if (qb.type === QueryType.INSERT && Object.keys(params).length === 0) {
      sql = sql.replace('() VALUES ()', '("id") VALUES (DEFAULT)');
    }

    const res = await this.connection.execute(sql, params, 'run');
    await this.processManyToMany(entityName, res.insertId, collections);

    return res.insertId;
  }

}
