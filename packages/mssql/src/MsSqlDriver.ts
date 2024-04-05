import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type EntityDictionary,
  type EntityKey,
  type EntityProperty,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  QueryFlag,
  type QueryResult,
  type Transaction,
  Utils,
} from '@mikro-orm/core';
import { AbstractSqlDriver, type Knex, type SqlEntityManager } from '@mikro-orm/knex';
import { MsSqlConnection } from './MsSqlConnection';
import { MsSqlPlatform } from './MsSqlPlatform';
import { MsSqlQueryBuilder } from './MsSqlQueryBuilder';

export class MsSqlDriver extends AbstractSqlDriver<MsSqlConnection> {

  constructor(config: Configuration) {
    super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'tedious']);
  }

  override async nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityDictionary<T>[], options: NativeInsertUpdateManyOptions<T> = {}): Promise<QueryResult<T>> {
    const meta = this.metadata.get<T>(entityName);
    const keys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
    const props = [...keys].map(name => meta.properties[name as EntityKey] ?? { name, fieldNames: [name] }) as EntityProperty<T>[];
    const fields = Utils.flatten(props.map(prop => prop.fieldNames));
    const tableName = this.getTableName(meta, options);
    const hasFields = fields.length > 0;

    // Is this en empty insert... this is rather hard in mssql (especially with an insert many)
    if (!hasFields) {
      const returningProps = meta!.props.filter(prop => prop.primary || prop.defaultRaw);
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      const using2 = `select * from (values ${data.map((x, i) => `(${i})`).join(',')}) v (id) where 1 = 1`;
      /* istanbul ignore next */
      const output = returningFields.length > 0 ? `output ${returningFields.map(field => 'inserted.' + this.platform.quoteIdentifier(field)).join(', ')}` : '';
      const sql = `merge into ${tableName} using (${using2}) s on 1 = 0 when not matched then insert default values ${output};`;

      const res = await this.execute<QueryResult<T>>(sql, [], 'run', options.ctx);
      const pks = this.getPrimaryKeyFields(entityName);
      let pk: any[];

      /* istanbul ignore next */
      if (pks.length > 1) { // owner has composite pk
        pk = data.map(d => Utils.getPrimaryKeyCond(d as T, pks as EntityKey[]));
      } else {
        res.row ??= {};
        res.rows ??= [];
        pk = data.map((d, i) => d[pks[0]] ?? res.rows![i]?.[pks[0]]).map(d => [d]);
        res.insertId = res.insertId || res.row![pks[0]];
      }

      return res;
    }

    if (props.some(prop => prop.autoincrement)) {
      return super.nativeInsertMany(entityName, data, options, sql => {
        return `set identity_insert ${tableName} on; ${sql}; set identity_insert ${tableName} off`;
      });
    }

    return super.nativeInsertMany(entityName, data, options);
  }

  override createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<Knex.Transaction>, preferredConnectionType?: ConnectionType, convertCustomTypes?: boolean, loggerContext?: LoggingOptions, alias?: string, em?: SqlEntityManager): MsSqlQueryBuilder<T> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em ? preferredConnectionType : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new MsSqlQueryBuilder<T>(entityName, this.metadata, this, ctx, alias, connectionType, em, loggerContext);

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

}
