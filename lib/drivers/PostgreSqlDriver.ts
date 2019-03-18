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
      const pk = this.getPrimaryKeyField(entityName);
      const prop = this.metadata[entityName].properties[pk];
      sql = sql.replace('() VALUES ()', `("${prop.fieldName}") VALUES (DEFAULT)`);
    }

    const res = await this.connection.execute(sql, params, 'run');
    const pk = this.getPrimaryKeyField(entityName);
    const id = res.insertId || data[pk];
    await this.processManyToMany(entityName, id, collections);

    return id;
  }

}
