import { type AnyEntity, QueryFlag, type RequiredEntityData, Utils } from '@mikro-orm/core';
import { type InsertQueryBuilder, type Knex, QueryBuilder, QueryType } from '@mikro-orm/knex';

export class MsSqlQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> extends QueryBuilder<Entity, RootAlias, Hint, Context> {

  override insert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]): InsertQueryBuilder<Entity> {
    this.checkIdentityInsert(data);
    return super.insert(data);
  }

  override getKnex(): Knex.QueryBuilder {
    const qb = super.getKnex();
    const meta = this.metadata.get(this.mainAlias.entityName);

    if (this.flags.has(QueryFlag.IDENTITY_INSERT)) {
      this.appendIdentityInsert(qb);
    }

    if (!this.flags.has(QueryFlag.IDENTITY_INSERT) && meta.hasTriggers && this.type === QueryType.INSERT) {
      this.appendOutputTable(qb);
    }

    return qb;
  }

  override getKnexQuery(processVirtualEntity = true): Knex.QueryBuilder {
    if (this.type === QueryType.TRUNCATE) {
      const tableName = this.driver.getTableName(this.mainAlias.metadata!, { schema: this._schema }, false);
      const tableNameQuoted = this.platform.quoteIdentifier(tableName);
      const sql = `delete from ${tableNameQuoted}; declare @count int = case @@rowcount when 0 then 1 else 0 end; dbcc checkident ('${tableName}', reseed, @count)`;
      this._query = {} as any;

      return this._query!.qb = this.knex.raw(sql) as any;
    }

    return super.getKnexQuery(processVirtualEntity);
  }

  private appendIdentityInsert(qb: Knex.QueryBuilder) {
    const meta = this.metadata.get(this.mainAlias.entityName);
    const table = this.driver.getTableName(meta, { schema: this._schema });

    const originalToSQL = qb.toSQL;
    qb.toSQL = () => {
      const res = originalToSQL.apply(qb);
      return {
        ...res,
        sql: `set identity_insert ${table} on; ${res.sql}; set identity_insert ${table} off;`,
        toNative: () => res.toNative(),
      };
    };
  }

  private checkIdentityInsert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]) {
    const meta = this.metadata.find(this.mainAlias.entityName);

    if (!meta) {
      return;
    }

    const dataKeys = Utils.unique(Utils.asArray(data).flatMap(Object.keys));
    const hasAutoincrement = dataKeys.some(x => meta.properties[x]?.autoincrement);

    if (hasAutoincrement) {
      this.setFlag(QueryFlag.IDENTITY_INSERT);
    }
  }

  private appendOutputTable(qb: Knex.QueryBuilder) {
    const meta = this.metadata.find(this.mainAlias.entityName);

    if (!meta) {
      return;
    }

    const returningProps = meta!.props.filter(prop => prop.primary || prop.defaultRaw);
    const returningFields = Utils.flatten(returningProps.map(prop => prop.fieldNames));
    const table = this.driver.getTableName(meta!, { schema: this._schema });

    const selections = returningFields
      .map((field: string) => `[t].${this.platform.quoteIdentifier(field)}`)
      .join(',');

    const originalToSQL = qb.toSQL;

    qb.toSQL = () => {
      const res = originalToSQL.apply(qb);

      const position = res.sql.indexOf(' values ');
      const sqlBeforeValues = res.sql.substring(0, position);
      const sqlAfterValues = res.sql.substring(position + 1);

      let outputSql = `select top(0) ${selections} into #out from ${table} as t left join ${table} on 0=1; `;
      outputSql += `${sqlBeforeValues} into #out ${sqlAfterValues}; `;
      outputSql += `select ${selections} from #out as t; `;
      outputSql += `drop table #out; `;

      return {
        ...res,
        sql: outputSql,
        toNative: () => res.toNative(),
      };
    }
  }

}
