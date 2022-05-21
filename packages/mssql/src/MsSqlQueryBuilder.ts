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

  private appendIdentityInsert(qb: Knex.QueryBuilder) {
    const meta = this.metadata.get(this.entityName);
    const table = this.driver.getTableName(meta, { schema: this._schema });

    const originalToSQL = qb.toSQL;
    qb.toSQL = () => {
      const res = originalToSQL.apply(qb);
      return {
        ...res,
        sql: `set identity_insert ${table} on; ${res.sql}; set identity_insert ${table} off;`,
      };
    };
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
