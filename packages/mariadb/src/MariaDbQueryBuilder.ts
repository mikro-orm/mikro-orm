import {
  type AnyEntity,
  type EntityKey,
  type EntityMetadata,
  type PopulateOptions,
  raw,
  RawQueryFragment,
} from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/mysql';

/**
 * @inheritDoc
 */
export class MariaDbQueryBuilder<
  Entity extends object = AnyEntity,
  RootAlias extends string = never,
  Hint extends string = never,
  Context extends object = never,
> extends QueryBuilder<Entity, RootAlias, Hint, Context> {

  protected override wrapPaginateSubQuery(meta: EntityMetadata): void {
    const pks = this.prepareFields(meta.primaryKeys, 'sub-query') as string[];
    const quotedPKs = pks.map(pk => this.platform.quoteIdentifier(pk));
    const subQuery = this.clone(['_orderBy', '_fields']).select(pks).groupBy(pks).limit(this._limit!);
    // revert the on conditions added via populateWhere, we want to apply those only once
    // @ts-ignore
    Object.values(subQuery._joins).forEach(join => join.cond = join.cond_ ?? {});

    if (this._offset) {
      subQuery.offset(this._offset);
    }

    const addToSelect = [];

    if (this._orderBy.length > 0) {
      const orderBy = [];

      for (const orderMap of this._orderBy) {
        for (const [field, direction] of Object.entries(orderMap)) {
          if (RawQueryFragment.isKnownFragment(field)) {
            const rawField = RawQueryFragment.getKnownFragment(field, false)!;
            this.rawFragments.add(field);
            orderBy.push({ [rawField.clone() as any]: direction });
            continue;
          }

          const [a, f] = this.helper.splitField(field as EntityKey<Entity>);
          const prop = this.helper.getProperty(f, a);
          const type = this.platform.castColumn(prop);
          const fieldName = this.helper.mapper(field, this.type, undefined, null);

          if (!prop?.persist && !prop?.formula && !pks.includes(fieldName)) {
            addToSelect.push(fieldName);
          }

          const key = raw(`min(${this.platform.quoteIdentifier(fieldName)}${type})`);
          orderBy.push({ [key]: direction });
        }
      }

      subQuery.orderBy(orderBy);
    }

    // @ts-ignore
    subQuery.finalized = true;
    const innerQuery = subQuery.as(this.mainAlias.aliasName).clear('select').select(pks);

    /* v8 ignore start */
    if (addToSelect.length > 0) {
      addToSelect.forEach(prop => {
        const field = this._fields!.find(field => {
          if (typeof field === 'object' && field && '__as' in field) {
            return field.__as === prop;
          }

          if (field instanceof RawQueryFragment) {
            // not perfect, but should work most of the time, ideally we should check only the alias (`... as alias`)
            return field.sql.includes(prop);
          }

          return false;
        });

        if (field instanceof RawQueryFragment) {
          innerQuery.select(this.platform.formatQuery(field.sql, field.params));
        } else if (field) {
          innerQuery.select(field as string);
        }
      });
    }
    /* v8 ignore stop */

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.platform.createNativeQueryBuilder();
    subSubQuery.select(raw(`json_arrayagg(${quotedPKs.join(', ')})`)).from(innerQuery);
    this._limit = undefined;
    this._offset = undefined;

    // remove joins that are not used for population or ordering to improve performance
    const populate = new Set<string>();
    const orderByAliases = this._orderBy
      .flatMap(hint => Object.keys(hint))
      .map(k => k.split('.')[0]);

    function addPath(hints: PopulateOptions<any>[], prefix = '') {
      for (const hint of hints) {
        const field = hint.field.split(':')[0];
        populate.add((prefix ? prefix + '.' : '') + field);

        if (hint.children) {
          addPath(hint.children, (prefix ? prefix + '.' : '') + field);
        }
      }
    }

    addPath(this._populate);

    for (const [key, join] of Object.entries(this._joins)) {
      const path = join.path?.replace(/\[populate]|\[pivot]|:ref/g, '').replace(new RegExp(`^${meta.className}.`), '');

      /* v8 ignore next 3 */
      if (!populate.has(path ?? '') && !orderByAliases.includes(join.alias)) {
        delete this._joins[key];
      }
    }

    const subquerySql = subSubQuery.toString();
    const key = meta.getPrimaryProps()[0].runtimeType === 'string' ? `concat('"', ${quotedPKs.join(', ')}, '"')` : quotedPKs.join(', ');
    const sql = `json_contains((${subquerySql}), ${key})`;
    this._cond = {};
    this.select(this._fields!).where(sql);
  }

}
