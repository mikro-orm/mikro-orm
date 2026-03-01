import {
  ALIAS_REPLACEMENT,
  type Dictionary,
  type EntityKey,
  type EntityProperty,
  GroupOperator,
  QueryFlag,
  raw,
  RawQueryFragment,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode.js';
import type { ICriteriaNodeProcessOptions, IQueryBuilder } from '../typings.js';
import { JoinType, QueryType } from './enums.js';

const COLLECTION_OPERATORS = ['$some', '$none', '$every', '$size'];

/**
 * @internal
 */
export class ObjectCriteriaNode<T extends object> extends CriteriaNode<T> {

  override process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    const matchPopulateJoins = options?.matchPopulateJoins || (this.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop!.kind));
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(options), { ...options, matchPopulateJoins });
    const ownerAlias = options?.alias || qb.alias;
    const keys = Utils.getObjectQueryKeys(this.payload);
    let alias = options?.alias;

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(qb, nestedAlias)) {
      if (keys.some(k => COLLECTION_OPERATORS.includes(k as string))) {
        if (![ReferenceKind.MANY_TO_MANY, ReferenceKind.ONE_TO_MANY].includes(this.prop!.kind)) {
          // ignore collection operators when used on a non-relational property - this can happen when they get into
          // populateWhere via `infer` on m:n properties with select-in strategy
          if (this.parent?.parent) { // we validate only usage on top level
            return {};
          }

          throw new Error(`Collection operators can be used only inside a collection property context, but it was used for ${this.getPath()}.`);
        }

        const $and: Dictionary[] = [];
        const knownKey = [ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE, ReferenceKind.EMBEDDED].includes(this.prop!.kind) || (this.prop!.kind === ReferenceKind.ONE_TO_ONE && this.prop!.owner);
        const parentMeta = this.metadata.find(this.parent!.entityName)!;
        const primaryKeys = parentMeta.primaryKeys.map(pk => {
          return [QueryType.SELECT, QueryType.COUNT].includes(qb.type!) ? `${knownKey ? alias : ownerAlias}.${pk}` : pk;
        });

        for (const key of keys) {
          if (typeof key !== 'string' || !COLLECTION_OPERATORS.includes(key)) {
            throw new Error('Mixing collection operators with other filters is not allowed.');
          }

          const payload = (this.payload[key] as CriteriaNode<T>).unwrap();
          const qb2 = qb.clone(true, ['_schema']);
          const joinAlias = qb2.getNextAlias(this.prop!.targetMeta!.class);
          const sub = qb2
            .from(parentMeta.class)
            // eslint-disable-next-line no-unexpected-multiline
            [key === '$size' ? 'leftJoin' : 'innerJoin'](this.key! as string, joinAlias)
            .select(parentMeta.primaryKeys);

          if (key === '$size') {
            const sizeCondition = typeof payload === 'number' ? { $eq: payload } : payload;
            const pks = this.prop!.referencedColumnNames;
            const countExpr = raw(`count(${pks.map(() => '??').join(', ')})`, pks.map(pk => `${joinAlias}.${pk}`));
            sub.groupBy(parentMeta.primaryKeys);
            sub.having({ $and: Object.keys(sizeCondition).map(op => ({ [countExpr as any]: { [op]: sizeCondition[op] } })) });
          } else if (key === '$every') {
            sub.where({ $not: { [this.key!]: payload } });
          } else {
            sub.where({ [this.key!]: payload });
          }

          const op = ['$size', '$some'].includes(key) ? '$in' : '$nin';
          $and.push({
            [Utils.getPrimaryKeyHash(primaryKeys)]: { [op]: (sub as Dictionary).getNativeQuery().toRaw() },
          });
        }

        if ($and.length === 1) {
          return $and[0];
        }

        return { $and };
      }

      alias = this.autoJoin(qb, ownerAlias, options);
    }

    if (this.prop && nestedAlias) {
      const toOneProperty = [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop!.kind);

      // if the property is nullable and the filter is strict, we need to use left join, so we mimic the inner join behaviour
      // with an exclusive condition on the join columns:
      // - if the owning column is null, the row is missing, we don't apply the filter
      // - if the target column is not null, the row is matched, we apply the filter
      if (toOneProperty && this.prop!.nullable && this.isStrict()) {
        const key = this.prop!.owner ? this.prop!.name : this.prop!.referencedPKs;

        qb.andWhere({
          $or: [
            { [ownerAlias + '.' + key]: null },
            { [nestedAlias + '.' + Utils.getPrimaryKeyHash(this.prop!.referencedPKs)]: { $ne: null } },
          ],
        });
      }
    }

    return keys.reduce((o, field) => {
      const childNode = this.payload[field] as CriteriaNode<T>;
      const payload = childNode.process(qb, { ...options, alias: this.prop ? alias : ownerAlias });
      const operator = Utils.isOperator(field);
      const isRawField = RawQueryFragment.isKnownFragmentSymbol(field);
      // we need to keep the prefixing for formulas otherwise we would lose aliasing context when nesting inside group operators
      const virtual = childNode.prop?.persist === false && !childNode.prop?.formula && !!options?.type;
      // if key is missing, we are inside group operator and we need to prefix with alias
      const primaryKey = this.key && this.metadata.find(this.entityName)?.primaryKeys.includes(field as EntityKey);
      const isToOne = childNode.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(childNode.prop.kind);

      if (childNode.shouldInline(payload)) {
        const childAlias = qb.getAliasForJoinPath(childNode.getPath(), { preferNoBranch: isToOne, ...options });
        const a = qb.helper.isTableNameAliasRequired(qb.type) ? alias : undefined;
        this.inlineChildPayload(o, payload, field as EntityKey, a, childAlias);
      } else if (childNode.shouldRename(payload)) {
        this.inlineCondition(childNode.renameFieldToPK(qb, alias), o, payload);
      } else if (isRawField) {
        const rawField = RawQueryFragment.getKnownFragment(field)!;
        o[raw(rawField.sql.replaceAll(ALIAS_REPLACEMENT, alias!), rawField.params) as any] = payload;
      } else if (!childNode.validate && !childNode.prop && !field.includes('.') && !operator) {
        // wrap unknown fields in raw() to prevent alias prefixing (e.g. raw SQL aliases in HAVING)
        // use '??' placeholder to properly quote the identifier
        o[raw('??', [field]) as any] = payload;
      } else if (primaryKey || virtual || operator || field.includes('.') || ![QueryType.SELECT, QueryType.COUNT].includes(qb.type)) {
        this.inlineCondition(field.replaceAll(ALIAS_REPLACEMENT, alias!), o, payload);
      } else {
        this.inlineCondition(`${alias ?? qb.alias}.${field}`, o, payload);
      }

      return o;
    }, {} as Dictionary);
  }

  override isStrict(): boolean {
    return this.strict || Utils.getObjectQueryKeys(this.payload).some(key => {
      return this.payload[key].isStrict();
    });
  }

  override unwrap(): any {
    return Utils.getObjectQueryKeys(this.payload).reduce((o, field) => {
      o[field as string] = this.payload[field].unwrap();
      return o;
    }, {} as Dictionary);
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions) {
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(options), options);
    const ownerAlias = alias || qb.alias;
    const keys = Utils.getObjectQueryKeys(this.payload);

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(qb, nestedAlias)) {
      return !keys.some(k => COLLECTION_OPERATORS.includes(k as string));
    }

    return keys.some(field => {
      const childNode = this.payload[field] as CriteriaNode<T>;
      return childNode.willAutoJoin(qb, this.prop ? alias : ownerAlias, options);
    });
  }

  override shouldInline(payload: any): boolean {
    const rawField = RawQueryFragment.isKnownFragmentSymbol(this.key);
    const scalar = Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || rawField;
    const operator = Utils.isObject(payload) && Utils.getObjectQueryKeys(payload).every(k => Utils.isOperator(k, false) && k !== '$not');

    return !!this.prop && this.prop.kind !== ReferenceKind.SCALAR && !scalar && !operator;
  }

  private getChildKey(k: EntityKey, prop: EntityProperty, childAlias?: string, alias?: string): string {
    const idx = prop.referencedPKs.indexOf(k as EntityKey);
    return idx !== -1 && !childAlias && ![ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind)
      ? this.aliased(prop.joinColumns[idx], alias)
      : k;
  }

  private inlineArrayChildPayload(obj: Dictionary, payload: Dictionary[], k: string, prop: EntityProperty, childAlias?: string, alias?: string) {
    const key = this.getChildKey(k as EntityKey, prop, childAlias);
    const value = payload.map((child: Dictionary) => Utils.getObjectQueryKeys(child).reduce((inner, childKey) => {
      const key = (RawQueryFragment.isKnownFragmentSymbol(childKey) || this.isPrefixed(childKey) || Utils.isOperator(childKey)) ? childKey : this.aliased(childKey, childAlias);
      inner[key as string] = child[childKey as string];

      return inner;
    }, {} as Dictionary));

    this.inlineCondition(key, obj, value);
  }

  private inlineChildPayload(o: Dictionary, payload: Dictionary, field: EntityKey<T>, alias?: string, childAlias?: string) {
    const prop = this.metadata.find(this.entityName)!.properties[field];

    for (const k of Utils.getObjectQueryKeys(payload)) {
      if (RawQueryFragment.isKnownFragmentSymbol(k)) {
        o[k as unknown as string] = payload[k as unknown as string];
      } else if (k === '$not') {
        // $not wraps conditions like $and/$or, inline at current level
        this.inlineCondition(k, o, payload[k]);
      } else if (Utils.isOperator(k, false)) {
        const tmp = payload[k];
        delete payload[k];
        o[this.aliased(field, alias)] = { [k]: tmp, ...o[this.aliased(field, alias)] };
      } else if (k in GroupOperator && Array.isArray(payload[k])) {
        this.inlineArrayChildPayload(o, payload[k], k, prop, childAlias, alias);
      } else if (this.isPrefixed(k) || Utils.isOperator(k) || !childAlias) {
        const key = this.getChildKey(k as EntityKey, prop, childAlias, alias);
        this.inlineCondition(key, o, payload[k]);
      } else {
        o[this.aliased(k, childAlias)] = payload[k];
      }
    }
  }

  private inlineCondition(key: string, o: Dictionary, value: unknown) {
    if (!(key in o)) {
      o[key] = value;
      return;
    }

    /* v8 ignore next */
    if (key === '$and') {
      o.$and.push({ [key]: value });
      return;
    }

    const $and = o.$and ?? [];
    $and.push({ [key]: o[key] }, { [key]: value });
    delete o[key];
    o.$and = $and;
  }

  private shouldAutoJoin(qb: IQueryBuilder<T>, nestedAlias: string | undefined): boolean {
    if (!this.prop || !this.parent) {
      return false;
    }

    const keys = Utils.getObjectQueryKeys(this.payload) as EntityKey<T>[];

    if (keys.every(k => typeof k === 'string' && k.includes('.') && k.startsWith(`${qb.alias}.`))) {
      return false;
    }

    if (keys.some(k => COLLECTION_OPERATORS.includes(k as string))) {
      return true;
    }

    const meta = this.metadata.find(this.entityName)!;
    const embeddable = this.prop.kind === ReferenceKind.EMBEDDED;
    const knownKey = [ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE, ReferenceKind.EMBEDDED].includes(this.prop.kind) || (this.prop.kind === ReferenceKind.ONE_TO_ONE && this.prop.owner);
    const operatorKeys = knownKey && keys.every(key => {
      if (key === '$not') {
        // $not wraps conditions like $and/$or, check if it wraps entity property conditions (needs auto-join)
        // vs simple operator conditions on the FK (doesn't need auto-join)
        const childPayload = (this.payload[key] as CriteriaNode<T>).payload;

        if (Utils.isPlainObject(childPayload)) {
          return Utils.getObjectQueryKeys(childPayload).every(k => Utils.isOperator(k, false));
        }
      }

      return Utils.isOperator(key, false);
    });
    const primaryKeys = knownKey && keys.every(key => {
      if (typeof key !== 'string' || !meta.primaryKeys.includes(key)) {
        return false;
      }

      if (!Utils.isPlainObject(this.payload[key].payload) || ![ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(meta.properties[key].kind)) {
        return true;
      }

      return Utils.getObjectQueryKeys(this.payload[key].payload).every(k => typeof k === 'string' && meta.properties[key].targetMeta!.primaryKeys.includes(k));
    });

    return !primaryKeys && !nestedAlias && !operatorKeys && !embeddable;
  }

  private autoJoin(qb: IQueryBuilder<T>, alias: string, options?: ICriteriaNodeProcessOptions): string {
    const nestedAlias = qb.getNextAlias(this.prop?.pivotEntity ?? this.entityName);
    const rawField = RawQueryFragment.isKnownFragmentSymbol(this.key);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload as unknown instanceof RegExp || this.payload as unknown instanceof Date || rawField;
    const operator = Utils.isPlainObject(this.payload) && Utils.getObjectQueryKeys(this.payload).every(k => Utils.isOperator(k, false));
    const field = `${alias}.${this.prop!.name}`;
    const method = qb.hasFlag(QueryFlag.INFER_POPULATE) ? 'joinAndSelect' : 'join';
    const path = this.getPath();

    if (this.prop!.kind === ReferenceKind.MANY_TO_MANY && (scalar || operator)) {
      qb.join(field, nestedAlias, undefined, JoinType.pivotJoin, path);
    } else {
      const prev = qb._fields?.slice();
      const toOneProperty = [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop!.kind);
      const joinType = toOneProperty && !this.prop!.nullable
        ? JoinType.innerJoin
        : JoinType.leftJoin;
      qb[method](field, nestedAlias, undefined, joinType, path);

      if (!qb.hasFlag(QueryFlag.INFER_POPULATE)) {
        qb._fields = prev;
      }
    }

    if (options?.type !== 'orderBy') {
      qb.scheduleFilterCheck(path);
    }

    return nestedAlias;
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/\w+\./);
  }

}
