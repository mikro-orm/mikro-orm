import { type AnyEntity, QueryFlag, type RequiredEntityData, Utils } from '@mikro-orm/core';
import { type InsertQueryBuilder, QueryBuilder } from '@mikro-orm/sql';

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

    if (!this.flags.has(QueryFlag.IDENTITY_INSERT) && this.metadata.has(this.mainAlias.entityName)) {
      const meta = this.mainAlias.meta;

      if (meta!.hasTriggers) {
        this.setFlag(QueryFlag.OUTPUT_TABLE);
      }
    }

    return super.insert(data);
  }

  private checkIdentityInsert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]) {
    const meta = this.mainAlias.meta;
    const dataKeys = Utils.unique(Utils.asArray(data).flatMap(Utils.keys));
    const hasAutoincrement = dataKeys.some(x => meta.properties[x]?.autoincrement);

    if (hasAutoincrement) {
      this.setFlag(QueryFlag.IDENTITY_INSERT);
    }
  }
}
