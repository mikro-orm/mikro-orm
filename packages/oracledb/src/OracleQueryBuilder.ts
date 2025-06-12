import {
  type AnyEntity,
  type Dictionary,
  type EntityMetadata,
  isRaw,
  type LockMode,
  raw,
  type RequiredEntityData,
  Utils,
} from '@mikro-orm/core';
import { type InsertQueryBuilder, type NativeQueryBuilder, type Field, QueryBuilder, QueryType } from '@mikro-orm/knex';

export class OracleQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> extends QueryBuilder<Entity, RootAlias, Hint, Context> {

  override insert(data: RequiredEntityData<Entity> | RequiredEntityData<Entity>[]): InsertQueryBuilder<Entity> {
    for (const row of Utils.asArray(data)) {
      if (this.mainAlias.metadata && Object.keys(row).length === 0) {
        // ensure that we insert at least one column, otherwise Oracle will throw an error
        row[this.mainAlias.metadata.primaryKeys[0] as keyof typeof row] = raw('default');
      }
    }

    return this.init(QueryType.INSERT, data) as InsertQueryBuilder<Entity>;
  }

  override setLockMode(mode?: LockMode, tables?: string[]): this {
    if (tables) {
      for (let i = 0; i < tables.length; i++) {
        if (!tables[i].includes('.')) {
          const meta = this._aliases[tables[i]].metadata!;
          tables[i] += '.' + meta.getPrimaryProp().fieldNames[0];
        }
      }
    }

    return super.setLockMode(mode, tables);
  }

  protected override processReturningStatement(qb: NativeQueryBuilder, meta?: EntityMetadata, data?: Dictionary, returning?: Field<any>[]): void {
    if (!meta || !data) {
      return;
    }

    const arr = Utils.asArray(data);

    // always respect explicit returning hint
    if (returning && returning.length > 0) {
      qb.returning(returning.map(field => {
        if (typeof field === 'string') {
          const prop = this.helper.getProperty(field);
          return [field, prop?.runtimeType ?? 'string'];
        }

        return this.helper.mapper(field as unknown as string, this.type);
      }));

      return;
    }

    if (this.type === QueryType.INSERT) {
      const returningProps = meta.hydrateProps
        .filter(prop => prop.returning || (prop.persist !== false && ((prop.primary && prop.autoincrement) || prop.defaultRaw)))
        .filter(prop => !(prop.fieldNames[0] in arr[0]) || isRaw(arr[0][prop.fieldNames[0]]));

      if (returningProps.length > 0) {
        qb.returning(returningProps.map(prop => [prop.fieldNames[0], prop.runtimeType]));
      }

      return;
    }

    if (this.type === QueryType.UPDATE) {
      const returningProps = meta.hydrateProps.filter(prop => prop.fieldNames && isRaw(arr[0][prop.fieldNames[0]]));

      if (returningProps.length > 0) {
        qb.returning(returningProps.map(prop => {
          if (prop.hasConvertToJSValueSQL) {
            const aliased = this.platform.quoteIdentifier(prop.fieldNames[0]);
            const sql = prop.customType!.convertToJSValueSQL!(aliased, this.platform) + ' as ' + this.platform.quoteIdentifier(prop.fieldNames[0]);
            return raw(sql);
          }

          return [prop.fieldNames[0], prop.runtimeType];
        }) as any);
      }
    }
  }

}
