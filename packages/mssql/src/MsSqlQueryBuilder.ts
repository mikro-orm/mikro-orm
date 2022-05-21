import type { AnyEntity, RequiredEntityData } from '@mikro-orm/core';
import { QueryFlag, Utils } from '@mikro-orm/core';
import type { InsertQueryBuilder, Knex } from '@mikro-orm/knex';
import { QueryBuilder } from '@mikro-orm/knex';

export class MsSqlQueryBuilder<T extends AnyEntity<T> = AnyEntity> extends QueryBuilder<T> {

  insert(data: RequiredEntityData<T> | RequiredEntityData<T>[]): InsertQueryBuilder<T> {
    this.checkIdentityInsert(data);
    return super.insert(data);
  }

  getKnex(): Knex.QueryBuilder {
    const qb = super.getKnex();

    if (this.flags.has(QueryFlag.IDENTITY_INSERT)) {
      this.appendIdentityInsert(qb);
    }

    return qb;
  }

  private overrideToSql(qb: Knex.QueryBuilder, getSql: (results: Knex.Sql) => string) {
    const originalToSQL = qb.toSQL;
    qb.toSQL = () => {
      const results = originalToSQL.apply(qb);
      return {
        ...results,
        sql: getSql(results),
      };
    };
  }

  private appendIdentityInsert(qb: Knex.QueryBuilder) {
    this.overrideToSql(qb, (results: Knex.Sql) => {
      const { tableName, schema } = this.metadata.get(this.entityName);
      const table = schema ? `${schema}.${tableName}` : tableName;
      return `set identity_insert ${table} on; ${results.sql}; set identity_insert ${table} off;`;
    });
  }

  private checkIdentityInsert(data: RequiredEntityData<T> | RequiredEntityData<T>[]) {
    const meta = this.metadata.find(this.entityName);

    if (!meta) {
      return;
    }

    const dataKeys = Utils.unique(Utils.asArray(data).flatMap(Object.keys));
    const hasAutoincrement = dataKeys.some(x => meta.properties[x]?.autoincrement);

    if (hasAutoincrement) {
      this.setFlag(QueryFlag.IDENTITY_INSERT);
    }
  }

}
