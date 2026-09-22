import {
  type AnyEntity,
  type Configuration,
  type ConnectionType,
  type EntityDictionary,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type LoggingOptions,
  type NativeInsertUpdateManyOptions,
  QueryFlag,
  type QueryResult,
  type Transaction,
  Utils,
  isRaw,
  type Constructor,
  type FilterQuery,
  type UpsertManyOptions,
} from '@mikro-orm/core';
import { AbstractSqlDriver, type SqlEntityManager } from '@mikro-orm/sql';
import { MsSqlConnection } from './MsSqlConnection.js';
import { MsSqlPlatform } from './MsSqlPlatform.js';
import { MsSqlQueryBuilder } from './MsSqlQueryBuilder.js';
import { MsSqlMikroORM } from './MsSqlMikroORM.js';

/** Database driver for Microsoft SQL Server. */
export class MsSqlDriver extends AbstractSqlDriver<MsSqlConnection> {
  constructor(config: Configuration) {
    super(config, new MsSqlPlatform(), MsSqlConnection, ['kysely', 'tedious']);
  }

  override async nativeInsertMany<T extends AnyEntity<T>>(
    entityName: EntityName<T>,
    data: EntityDictionary<T>[],
    options: NativeInsertUpdateManyOptions<T> = {},
  ): Promise<QueryResult<T>> {
    const meta = this.metadata.get(entityName);
    const keys = new Set<string>();
    data.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
    const props = [...keys].map(
      name => meta.properties[name as EntityKey] ?? { name, fieldNames: [name] },
    ) as EntityProperty<T>[];
    const fields = Utils.flatten(props.map(prop => prop.fieldNames));
    const tableName = this.getTableName(meta, options);
    const hasFields = fields.length > 0;

    // Is this en empty insert... this is rather hard in mssql (especially with an insert many)
    if (!hasFields) {
      const returningProps = this.getTableProps(meta).filter(prop => prop.returning || prop.primary || prop.defaultRaw);
      const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
      const using2 = `select * from (values ${data.map((x, i) => `(${i})`).join(',')}) v (id) where 1 = 1`;
      /* v8 ignore next */
      const output =
        returningFields.length > 0
          ? `output ${returningFields.map(field => 'inserted.' + this.platform.quoteIdentifier(field)).join(', ')}`
          : '';
      let sql = `merge into ${tableName} using (${using2}) s on 1 = 0 when not matched then insert default values ${output};`;
      if (meta.hasTriggers) {
        sql = this.appendOutputTable(entityName, returningFields, sql, sql.length - 1, options);
      }

      const res = await this.execute<QueryResult<T>>(sql, [], 'run', options.ctx);
      const pks = this.getPrimaryKeyFields(meta);

      if (pks.length === 1) {
        res.row ??= {};
        res.rows ??= [];
        res.insertId = res.insertId || res.row[pks[0]];
      }

      return res;
    }

    return super.nativeInsertMany(entityName, data, options, sql => {
      if (meta.hasTriggers) {
        // must match the OUTPUT columns of the parent implementation, which resolves STI children to the root
        const returning = this.getTableProps(meta.inheritanceType === 'tpt' ? meta : meta.root).filter(
          prop =>
            prop.returning ||
            (((prop.persist !== false && prop.defaultRaw) || prop.autoincrement || prop.generated) &&
              (!(prop.name in data[0]) || isRaw(data[0][prop.name]))),
        );
        sql = this.appendOutputTable(
          entityName,
          returning.flatMap(p => p.fieldNames),
          sql,
          sql.indexOf(' values '),
          options,
        );
      }
      // For TPT children, the parent table owns the identity column.
      if (props.some(prop => prop.autoincrement && (!meta.ownProps || meta.ownProps.includes(prop)))) {
        sql = `set identity_insert ${tableName} on; ${sql}; set identity_insert ${tableName} off`;
      }
      return sql;
    });
  }

  override async nativeUpdateMany<T extends object>(
    entityName: EntityName<T>,
    where: FilterQuery<T>[],
    data: EntityDictionary<T>[],
    options: NativeInsertUpdateManyOptions<T> & UpsertManyOptions<T> = {},
  ): Promise<QueryResult<T>> {
    const meta = this.metadata.get<T>(entityName);

    return super.nativeUpdateMany(entityName, where, data, options, sql => {
      if (!meta.hasTriggers) {
        return sql;
      }

      const fields = this.getUpdateReturningProperties(meta, data).flatMap(prop => prop.fieldNames);

      return this.appendOutputTable(entityName, fields, sql, sql.lastIndexOf(' where '), options);
    });
  }

  override createQueryBuilder<T extends AnyEntity<T>>(
    entityName: EntityName<T>,
    ctx?: Transaction,
    preferredConnectionType?: ConnectionType,
    convertCustomTypes?: boolean,
    loggerContext?: LoggingOptions,
    alias?: string,
    em?: SqlEntityManager,
  ): MsSqlQueryBuilder<T, any, any, any> {
    // do not compute the connectionType if EM is provided as it will be computed from it in the QB later on
    const connectionType = em
      ? preferredConnectionType
      : this.resolveConnectionType({ ctx, connectionType: preferredConnectionType });
    const qb = new MsSqlQueryBuilder<T, any, any, any>(
      entityName,
      this.metadata,
      this,
      ctx,
      alias,
      connectionType,
      em,
      loggerContext,
    );

    if (!convertCustomTypes) {
      qb.unsetFlag(QueryFlag.CONVERT_CUSTOM_TYPES);
    }

    return qb;
  }

  private appendOutputTable<T extends AnyEntity<T>>(
    entityName: EntityName<T>,
    returningFields: string[],
    sql: string,
    position: number,
    options: NativeInsertUpdateManyOptions<T>,
  ) {
    const meta = this.metadata.get<T>(entityName);
    /* v8 ignore next */
    if (returningFields.length === 0) {
      return sql;
    }

    const tableName = this.getTableName(meta, options, true);

    const selections = returningFields.map((field: string) => `[t].${this.platform.quoteIdentifier(field)}`).join(',');

    const sqlBeforeValues = sql.substring(0, position);
    const sqlAfterValues = sql.substring(position);

    let outputSql = `select top(0) ${selections} into #out from ${tableName} as t left join ${tableName} on 0 = 1; `;
    outputSql += `${sqlBeforeValues} into #out${sqlAfterValues}; `;
    outputSql += `select ${selections} from #out as t; select @@rowcount as [__mikro_orm_row_count__]; `;
    outputSql += `drop table #out`;

    return outputSql;
  }

  /** @inheritDoc */
  override getORMClass(): Constructor<MsSqlMikroORM> {
    return MsSqlMikroORM;
  }
}
