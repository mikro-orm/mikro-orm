import { type AnyEntity, QueryFlag, type RequiredEntityData, Utils, raw } from '@mikro-orm/core';
import { type InsertQueryBuilder, QueryBuilder } from '@mikro-orm/sql';

/** Query builder with MSSQL-specific behavior such as identity insert handling. */
export class MsSqlQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> extends QueryBuilder<Entity, RootAlias, Hint, Context> {
  override insert(
    data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[],
  ): InsertQueryBuilder<Entity, RootAlias, Context> {
    data = this.applyInsertDefaults(data);
    this.checkIdentityInsert(data);

    if (!this.hasFlag(QueryFlag.IDENTITY_INSERT) && this.metadata.has(this.mainAlias.entityName)) {
      const meta = this.mainAlias.meta;

      if (meta.hasTriggers) {
        this.setFlag(QueryFlag.OUTPUT_TABLE);
      }
    }

    return super.insert(data);
  }

  private applyInsertDefaults(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]) {
    if (!Array.isArray(data) || data.length < 2) {
      return data;
    }

    const meta = this.mainAlias.meta;
    const keys = Utils.unique(data.flatMap(row => Utils.keys(row))).filter(key => meta.properties[key]?.defaultRaw);
    if (keys.length === 0) {
      return data;
    }

    // MERGE uses a derived VALUES table, where DEFAULT is not allowed.
    return data.map(row => {
      let copy = row;
      for (const key of keys) {
        if (row[key] === undefined) {
          if (copy === row) {
            copy = { ...row };
          }
          copy[key] = raw(meta.properties[key].defaultRaw!) as never;
        }
      }
      return copy;
    });
  }

  private checkIdentityInsert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]) {
    const meta = this.mainAlias.meta;
    const dataKeys = Utils.unique(Utils.asArray(data).flatMap(d => Utils.keys(d)));
    const hasAutoincrement = dataKeys.some(x => meta.properties[x]?.autoincrement);

    if (hasAutoincrement) {
      this.setFlag(QueryFlag.IDENTITY_INSERT);
    }
  }
}
