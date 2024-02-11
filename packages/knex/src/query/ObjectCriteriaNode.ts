import {
  ALIAS_REPLACEMENT,
  type Dictionary,
  type EntityKey,
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
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(), options);
    const ownerAlias = options?.alias || qb.alias;
    const keys = Object.keys(this.payload);
    let alias = options?.alias;

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(qb, nestedAlias)) {
      if (keys.some(k => ['$some', '$none', '$every'].includes(k))) {
        const $and: Dictionary[] = [];
        const primaryKeys = this.metadata.find(this.entityName)!.primaryKeys.map(pk => {
          return [QueryType.SELECT, QueryType.COUNT].includes(qb.type!) ? `${alias}.${pk}` : pk;
        });

        for (const key of keys) {
          if (!['$some', '$none', '$every'].includes(key)) {
            throw new Error('Mixing collection operators with other filters is not allowed.');
          }

          const payload = (this.payload[key] as CriteriaNode<T>).unwrap();
          const sub = qb
            .clone(true)
            .from(this.parent!.entityName)
            .innerJoin(this.key!, qb.getNextAlias(this.prop!.type))
            .select(this.prop!.targetMeta!.primaryKeys);

          if (key === '$every') {
            sub.where({ $not: { [this.key!]: payload } });
          } else {
            sub.where({ [this.key!]: payload });
          }

          const op = key === '$some' ? '$in' : '$nin';

          $and.push({
            [Utils.getPrimaryKeyHash(primaryKeys)]: { [op]: (sub as Dictionary).getKnexQuery() },
          });
        }

        return { $and };
      }

      alias = this.autoJoin(qb, ownerAlias);
    }

    return keys.reduce((o, field) => {
      const childNode = this.payload[field] as CriteriaNode<T>;
      const payload = childNode.process(qb, { ...options, alias: this.prop ? alias : ownerAlias });
      const operator = Utils.isOperator(field);
      const isRawField = RawQueryFragment.isKnownFragment(field);
      // we need to keep the prefixing for formulas otherwise we would lose aliasing context when nesting inside group operators
      const virtual = childNode.prop?.persist === false && !childNode.prop?.formula;
      // if key is missing, we are inside group operator and we need to prefix with alias
      const primaryKey = this.key && this.metadata.find(this.entityName)!.primaryKeys.includes(field);

      if (childNode.shouldInline(payload)) {
        const childAlias = qb.getAliasForJoinPath(childNode.getPath(), options);
        this.inlineChildPayload(o, payload, field as EntityKey, alias, childAlias);
      } else if (childNode.shouldRename(payload)) {
        o[childNode.renameFieldToPK(qb)] = payload;
      } else if (isRawField) {
        const rawField = RawQueryFragment.getKnownFragment(field)!;
        o[raw(rawField.sql.replaceAll(ALIAS_REPLACEMENT, alias!), rawField.params)] = payload;
      } else if (primaryKey || virtual || operator || field.includes('.') || ![QueryType.SELECT, QueryType.COUNT].includes(qb.type ?? QueryType.SELECT)) {
        o[field.replaceAll(ALIAS_REPLACEMENT, alias!)] = payload;
      } else {
        o[`${alias}.${field}`] = payload;
      }

      return o;
    }, {} as Dictionary);
  }

  override unwrap(): any {
    return Object.keys(this.payload).reduce((o, field) => {
      o[field] = this.payload[field].unwrap();
      return o;
    }, {} as Dictionary);
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string) {
    const nestedAlias = qb.getAliasForJoinPath(this.getPath());
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
      return childNode.willAutoJoin(qb, this.prop ? alias : ownerAlias);
    });
  }

  override shouldInline(payload: any): boolean {
    const customExpression = RawQueryFragment.isKnownFragment(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

    return !!this.prop && this.prop.kind !== ReferenceKind.SCALAR && !scalar && !operator;
  }

  private inlineChildPayload<T>(o: Dictionary, payload: Dictionary, field: EntityKey<T>, alias?: string, childAlias?: string) {
    const prop = this.metadata.find<T>(this.entityName)!.properties[field];

    for (const k of Object.keys(payload)) {
      if (Utils.isOperator(k, false)) {
        const tmp = payload[k];
        delete payload[k];
        o[this.aliased(field, alias)] = { [k]: tmp, ...(o[this.aliased(field, alias)] || {}) };
      } else if (this.isPrefixed(k) || Utils.isOperator(k) || !childAlias) {
        const idx = prop.referencedPKs.indexOf(k as EntityKey);
        const key = idx !== -1 && !childAlias && ![ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(prop.kind) ? prop.joinColumns[idx] : k;

        if (key in o) {
          const $and = o.$and ?? [];
          $and.push({ [key]: o[key] }, { [key]: payload[k] });
          delete o[key];
          o.$and = $and;
        } else if (Utils.isOperator(k) && Array.isArray(payload[k])) {
            o[key] = payload[k].map((child: Dictionary) => Object.keys(child).reduce((o, childKey) => {
              const key = (this.isPrefixed(childKey) || Utils.isOperator(childKey)) ? childKey : this.aliased(childKey, childAlias);
              o[key] = child[childKey];
              return o;
            }, {} as Dictionary));
        } else {
          o[key] = payload[k];
        }
      } else if (RawQueryFragment.isKnownFragment(k)) {
        o[k] = payload[k];
      } else {
        o[`${childAlias}.${k}`] = payload[k];
        o[this.aliased(k, childAlias)] = payload[k];
      }
    }
  }

  private shouldAutoJoin(qb: IQueryBuilder<T>, nestedAlias: string | undefined): boolean {
    if (!this.prop || !this.parent) {
      return false;
    }

    const keys = Object.keys(this.payload);

    if (keys.every(k => k.includes('.') && k.startsWith(`${qb.alias}.`))) {
      return false;
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

  private autoJoin<T>(qb: IQueryBuilder<T>, alias: string): string {
    const nestedAlias = qb.getNextAlias(this.prop?.pivotTable ?? this.entityName);
    const customExpression = RawQueryFragment.isKnownFragment(this.key!);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload as unknown instanceof RegExp || this.payload as unknown instanceof Date || customExpression;
    const operator = Utils.isPlainObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));
    const field = `${alias}.${this.prop!.name}`;
    const method = qb.hasFlag(QueryFlag.INFER_POPULATE) ? 'joinAndSelect' : 'join';

    if (this.prop!.kind === ReferenceKind.MANY_TO_MANY && (scalar || operator)) {
      qb.join(field, nestedAlias, undefined, JoinType.pivotJoin, this.getPath());
    } else {
      const prev = qb._fields?.slice();
      qb[method](field, nestedAlias, undefined, JoinType.leftJoin, this.getPath());

      if (!qb.hasFlag(QueryFlag.INFER_POPULATE)) {
        qb._fields = prev;
      }
    }

    return nestedAlias;
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/\w+\./);
  }

}
