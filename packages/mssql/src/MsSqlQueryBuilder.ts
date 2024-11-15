import { type AnyEntity, QueryFlag, type RequiredEntityData, Utils } from '@mikro-orm/core';
import { type InsertQueryBuilder, QueryBuilder } from '@mikro-orm/knex';

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

}
