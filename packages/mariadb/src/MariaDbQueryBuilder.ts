import {
  type AnyEntity,
  type EntityKey,
  type EntityMetadata,
  isRaw,
  raw,
  RawQueryFragment,
  Utils,
} from '@mikro-orm/core';
import { NativeQueryBuilder, QueryBuilder } from '@mikro-orm/mysql';

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
    const subQuery = this.clone(['orderBy', 'fields'])
      .select(pks as any)
      .groupBy(pks as any)
      .limit(this.state.limit);
    // revert the on conditions added via populateWhere, we want to apply those only once
    Object.values(subQuery.state.joins).forEach(join => (join.cond = join.cond_ ?? {}));

    if (this.state.offset) {
      subQuery.offset(this.state.offset);
    }

    const addToSelect: { fieldName: string; propName: string }[] = [];

    const findVirtualField = (fieldName: string, propName: string) => {
      return this.state.fields?.find(field => {
        if (typeof field === 'object' && field && '__as' in field) {
          return field.__as === fieldName || field.__as === propName;
        }

        if (isRaw(field)) {
          return field.sql.includes(fieldName);
        }

        return false;
      });
    };

    if (this.state.orderBy.length > 0) {
      const orderBy = [];

      for (const orderMap of this.state.orderBy) {
        for (const field of Utils.getObjectQueryKeys(orderMap)) {
          const direction = orderMap[field as EntityKey<Entity>];

          if (RawQueryFragment.isKnownFragmentSymbol(field)) {
            orderBy.push({ [field]: direction });
            continue;
          }

          const [a, f] = this.helper.splitField(field as EntityKey<Entity>);
          const prop = this.helper.getProperty(f, a);
          const type = this.platform.castColumn(prop);
          const fieldName = this.helper.mapper(field, this.type, undefined, null);

          if (!prop?.persist && !prop?.formula && !pks.includes(fieldName)) {
            addToSelect.push({ fieldName, propName: f });

            const matchedField = findVirtualField(fieldName, f);

            if (matchedField instanceof NativeQueryBuilder) {
              const expr = matchedField.toString().replace(/ as [`"][^`"]+[`"]$/, '');
              const key = raw(`min(${expr}${type})`);
              orderBy.push({ [key as any]: direction });
            } else if (isRaw(matchedField)) {
              const compiled = this.platform.formatQuery(matchedField.sql, matchedField.params);
              const expr = compiled.replace(/ as [`"][^`"]+[`"]$/, '');
              const key = raw(`min(${expr}${type})`);
              orderBy.push({ [key as any]: direction });
            } else {
              const key = raw(`min(${this.platform.quoteIdentifier(fieldName)}${type})`);
              orderBy.push({ [key as any]: direction });
            }
          } else {
            const key = raw(`min(${this.platform.quoteIdentifier(fieldName)}${type})`);
            orderBy.push({ [key as any]: direction });
          }
        }
      }

      subQuery.orderBy(orderBy);
    }

    subQuery.state.finalized = true;
    const innerQuery = subQuery.as(this.mainAlias.aliasName).clear('select').select(pks);

    /* v8 ignore next */
    if (addToSelect.length > 0) {
      addToSelect.forEach(({ fieldName, propName }) => {
        const field = findVirtualField(fieldName, propName);

        if (isRaw(field)) {
          innerQuery.select(this.platform.formatQuery(field.sql, field.params));
        } else if (field instanceof NativeQueryBuilder) {
          innerQuery.select(field.toRaw());
        } else if (field) {
          innerQuery.select(field as string);
        }
      });
    }

    // multiple sub-queries are needed to get around mysql limitations with order by + limit + where in + group by (o.O)
    // https://stackoverflow.com/questions/17892762/mysql-this-version-of-mysql-doesnt-yet-support-limit-in-all-any-some-subqu
    const subSubQuery = this.platform.createNativeQueryBuilder();
    subSubQuery.select(raw(`json_arrayagg(${quotedPKs.join(', ')})`)).from(innerQuery);
    this.state.limit = undefined;
    this.state.offset = undefined;

    // Save the original WHERE conditions before pruning joins
    const originalCond = this.state.cond;
    const populatePaths = this.getPopulatePaths();

    // Remove joins that are not used for population or ordering
    this.pruneJoinsForPagination();

    // Transfer WHERE conditions to ORDER BY joins (GH #6160)
    this.transferConditionsForOrderByJoins(meta, originalCond, populatePaths);

    const subquerySql = subSubQuery.toString();
    const key =
      meta.getPrimaryProps()[0].runtimeType === 'string'
        ? `concat('"', ${quotedPKs.join(', ')}, '"')`
        : quotedPKs.join(', ');
    const sql = `json_contains((${subquerySql}), ${key})`;
    this.state.cond = {};
    this.select(this.state.fields as any).where(sql);
  }
}
