import { type AnyEntity, QueryFlag, type EntityData, type RequiredEntityData, Utils } from '@mikro-orm/core';
import { type InsertQueryBuilder, type UpdateQueryBuilder, QueryBuilder } from '@mikro-orm/sql';

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
    this.checkIdentityInsert(data);

    if (this.mainAlias.meta?.hasTriggers) {
      this.setFlag(QueryFlag.OUTPUT_TABLE);
    }

    return super.insert(data);
  }

  override update(data: EntityData<Entity>): UpdateQueryBuilder<Entity, RootAlias, Context> {
    if (this.mainAlias.meta?.hasTriggers) {
      this.setFlag(QueryFlag.OUTPUT_TABLE);
    }
    return super.update(data);
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
