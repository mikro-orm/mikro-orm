import { QueryFlag, Utils, type AnyEntity, type RequiredEntityData } from '@mikro-orm/core';
import { QueryBuilder, type InsertQueryBuilder, type Knex } from '@mikro-orm/knex';

export class MsSqlQueryBuilder<T extends AnyEntity<T> = AnyEntity> extends QueryBuilder<T> {

  override insert(data: RequiredEntityData<T> | RequiredEntityData<T>[]): InsertQueryBuilder<T> {
    this.checkIdentityInsert(data);
    return super.insert(data);
  }

  override getKnex(): Knex.QueryBuilder {
    const qb = super.getKnex();

    if (this.flags.has(QueryFlag.IDENTITY_INSERT)) {
      this.appendIdentityInsert(qb);
    }

    return qb;
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

  private checkIdentityInsert(data: RequiredEntityData<T> | RequiredEntityData<T>[]) {
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

}
