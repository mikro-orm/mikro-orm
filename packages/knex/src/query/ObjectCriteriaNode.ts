import {
  ALIAS_REPLACEMENT,
  type Dictionary,
  type EntityKey,
  type EntityProperty,
  QueryFlag,
  raw,
  RawQueryFragment,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import type { ICriteriaNodeProcessOptions, IQueryBuilder } from '../typings';
import { JoinType, QueryType } from './enums';

/**
 * @internal
 */
export class ObjectCriteriaNode<T extends object> extends CriteriaNode<T> {

  override process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    const matchPopulateJoins = options?.matchPopulateJoins || (this.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop!.kind));
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(), { ...options, matchPopulateJoins });
    const ownerAlias = options?.alias || qb.alias;
    const keys = Object.keys(this.payload);
    let alias = options?.alias;

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(qb, nestedAlias)) {
      if (keys.some(k => ['$some', '$none', '$every'].includes(k))) {
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
          if (!['$some', '$none', '$every'].includes(key)) {
            throw new Error('Mixing collection operators with other filters is not allowed.');
          }

          const payload = (this.payload[key] as CriteriaNode<T>).unwrap();
          const qb2 = qb.clone(true, ['_schema']);
          const sub = qb2
            .from(parentMeta.className)
            .innerJoin(this.key!, qb2.getNextAlias(this.prop!.type))
            .select(parentMeta.primaryKeys);

          if (key === '$every') {
            sub.where({ $not: { [this.key!]: payload } });
          } else {
            sub.where({ [this.key!]: payload });
          }

          const op = key === '$some' ? '$in' : '$nin';

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
      const isRawField = RawQueryFragment.isKnownFragment(field);
      // we need to keep the prefixing for formulas otherwise we would lose aliasing context when nesting inside group operators
      const virtual = childNode.prop?.persist === false && !childNode.prop?.formula;
      // if key is missing, we are inside group operator and we need to prefix with alias
      const primaryKey = this.key && this.metadata.find(this.entityName)?.primaryKeys.includes(field);
      const isToOne = childNode.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(childNode.prop.kind);

      if (childNode.shouldInline(payload)) {
        const childAlias = qb.getAliasForJoinPath(childNode.getPath(), { preferNoBranch: isToOne, ...options });
        const a = qb.helper.isTableNameAliasRequired(qb.type) ? alias : undefined;
        this.inlineChildPayload(o, payload, field as EntityKey, a, childAlias);
      } else if (childNode.shouldRename(payload)) {
        this.inlineCondition(childNode.renameFieldToPK(qb, alias), o, payload);
      } else if (isRawField) {
        const rawField = RawQueryFragment.getKnownFragment(field)!;
        o[raw(rawField.sql.replaceAll(ALIAS_REPLACEMENT, alias!), rawField.params)] = payload;
      } else if (primaryKey || virtual || operator || field.includes('.') || ![QueryType.SELECT, QueryType.COUNT].includes(qb.type)) {
        this.inlineCondition(field.replaceAll(ALIAS_REPLACEMENT, alias!), o, payload);
      } else {
        this.inlineCondition(`${alias}.${field}`, o, payload);
      }

      return o;
    }, {} as Dictionary);
  }

  override isStrict(): boolean {
    return this.strict || Object.keys(this.payload).some(key => {
      return this.payload[key as keyof typeof this.payload].isStrict();
    });
  }

  override unwrap(): any {
    return Object.keys(this.payload).reduce((o, field) => {
      o[field] = this.payload[field].unwrap();
      return o;
    }, {} as Dictionary);
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions) {
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(), options);
    const ownerAlias = alias || qb.alias;
    const keys = Object.keys(this.payload);

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(qb, nestedAlias)) {
      return !keys.some(k => ['$some', '$none', '$every'].includes(k));
    }

    return keys.some(field => {
      const childNode = this.payload[field] as CriteriaNode<T>;
      return childNode.willAutoJoin(qb, this.prop ? alias : ownerAlias, options);
    });
  }

  override shouldInline(payload: any): boolean {
    const customExpression = RawQueryFragment.isKnownFragment(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

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
    const value = payload.map((child: Dictionary) => Object.keys(child).reduce((inner, childKey) => {
      const key = (this.isPrefixed(childKey) || Utils.isOperator(childKey)) ? childKey : this.aliased(childKey, childAlias);
      inner[key] = child[childKey];

      return inner;
    }, {} as Dictionary));

    this.inlineCondition(key, obj, value);
  }

  private inlineChildPayload<T>(o: Dictionary, payload: Dictionary, field: EntityKey<T>, alias?: string, childAlias?: string) {
    const prop = this.metadata.find<T>(this.entityName)!.properties[field];

    for (const k of Object.keys(payload)) {
      if (Utils.isOperator(k, false)) {
        const tmp = payload[k];
        delete payload[k];
        o[this.aliased(field, alias)] = { [k]: tmp, ...o[this.aliased(field, alias)] };
      } else if (Utils.isGroupOperator(k) && Array.isArray(payload[k])) {
        this.inlineArrayChildPayload(o, payload[k], k, prop, childAlias, alias);
      } else if (this.isPrefixed(k) || Utils.isOperator(k) || !childAlias) {
        const key = this.getChildKey(k as EntityKey, prop, childAlias, alias);
        this.inlineCondition(key, o, payload[k]);
      } else if (RawQueryFragment.isKnownFragment(k)) {
        o[k] = payload[k];
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

    /* istanbul ignore next */
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

    const keys = Object.keys(this.payload);

    if (keys.every(k => k.includes('.') && k.startsWith(`${qb.alias}.`))) {
      return false;
    }

    if (keys.some(k => ['$some', '$none', '$every'].includes(k))) {
      return true;
    }

    const meta = this.metadata.find(this.entityName)!;
    const embeddable = this.prop.kind === ReferenceKind.EMBEDDED;
    const knownKey = [ReferenceKind.SCALAR, ReferenceKind.MANY_TO_ONE, ReferenceKind.EMBEDDED].includes(this.prop.kind) || (this.prop.kind === ReferenceKind.ONE_TO_ONE && this.prop.owner);
    const operatorKeys = knownKey && keys.every(key => Utils.isOperator(key, false));
    const primaryKeys = knownKey && keys.every(key => {
      if (!meta.primaryKeys.includes(key)) {
        return false;
      }

      if (!Utils.isPlainObject(this.payload[key].payload) || ![ReferenceKind.ONE_TO_ONE, ReferenceKind.MANY_TO_ONE].includes(meta.properties[key].kind)) {
        return true;
      }

      return Object.keys(this.payload[key].payload).every(k => meta.properties[key].targetMeta!.primaryKeys.includes(k));
    });

    return !primaryKeys && !nestedAlias && !operatorKeys && !embeddable;
  }

  private autoJoin<T>(qb: IQueryBuilder<T>, alias: string, options?: ICriteriaNodeProcessOptions): string {
    const nestedAlias = qb.getNextAlias(this.prop?.pivotTable ?? this.entityName);
    const customExpression = RawQueryFragment.isKnownFragment(this.key!);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload as unknown instanceof RegExp || this.payload as unknown instanceof Date || customExpression;
    const operator = Utils.isPlainObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));
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
