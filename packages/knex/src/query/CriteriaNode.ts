import { inspect } from 'node:util';
import {
  type Dictionary,
  type EntityKey,
  type EntityProperty,
  type MetadataStorage,
  RawQueryFragment,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import type { ICriteriaNode, ICriteriaNodeProcessOptions, IQueryBuilder } from '../typings.js';

/**
 * Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
 * Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }
 * @internal
 */
export class CriteriaNode<T extends object> implements ICriteriaNode<T> {

  payload: any;
  prop?: EntityProperty<T>;
  index?: number;

  constructor(protected readonly metadata: MetadataStorage,
              readonly entityName: string,
              readonly parent?: ICriteriaNode<T>,
              readonly key?: EntityKey<T>,
              validate = true) {
    const meta = parent && metadata.find<T>(parent.entityName);

    if (meta && key) {
      const pks = Utils.splitPrimaryKeys<T>(key);

      if (pks.length > 1) {
        return;
      }

      for (const k of pks) {
        this.prop = meta.props.find(prop => prop.name === k || (prop.fieldNames?.length === 1 && prop.fieldNames[0] === k && prop.persist !== false));
        const isProp = this.prop || meta.props.find(prop => (prop.fieldNames || []).includes(k));

        // do not validate if the key is prefixed or type casted (e.g. `k::text`)
        if (validate && !isProp && !k.includes('.') && !k.includes('::') && !Utils.isOperator(k) && !RawQueryFragment.isKnownFragment(k)) {
          throw new Error(`Trying to query by not existing property ${entityName}.${k}`);
        }
      }
    }
  }

  process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    return this.payload;
  }

  unwrap(): any {
    return this.payload;
  }

  shouldInline(payload: any): boolean {
    return false;
  }

  willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions) {
    return false;
  }

  shouldRename(payload: any): boolean {
    const type = this.prop ? this.prop.kind : null;
    const composite = this.prop?.joinColumns ? this.prop.joinColumns.length > 1 : false;
    const customExpression = RawQueryFragment.isKnownFragment(this.key!);
    const scalar = payload === null || Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;
    const plainObject = Utils.isPlainObject(payload);
    const keys = plainObject ? Object.keys(payload) : [];
    const operator = plainObject && keys.every(k => Utils.isOperator(k, false));

    if (composite) {
      return true;
    }

    switch (type) {
      case ReferenceKind.MANY_TO_ONE: return false;
      case ReferenceKind.ONE_TO_ONE: return !this.prop!.owner;
      case ReferenceKind.ONE_TO_MANY: return scalar || operator;
      case ReferenceKind.MANY_TO_MANY: return scalar || operator;
      default: return false;
    }
  }

  renameFieldToPK<T>(qb: IQueryBuilder<T>): string {
    let joinAlias = qb.getAliasForJoinPath(this.getPath());

    if (!joinAlias && this.parent && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop!.kind) && this.prop!.owner) {
      joinAlias = qb.getAliasForJoinPath(this.parent.getPath());
      return Utils.getPrimaryKeyHash(this.prop!.joinColumns.map(col => `${joinAlias ?? qb.alias}.${col}`));
    }

    const alias = joinAlias ?? qb.alias;

    if (this.prop!.kind === ReferenceKind.MANY_TO_MANY) {
      return Utils.getPrimaryKeyHash(this.prop!.inverseJoinColumns.map(col => `${alias}.${col}`));
    }

    return Utils.getPrimaryKeyHash(this.prop!.referencedColumnNames.map(col => `${alias}.${col}`));
  }

  getPath(addIndex = false): string {
    // use index on parent only if we are processing to-many relation
    const addParentIndex = this.prop && [ReferenceKind.ONE_TO_MANY, ReferenceKind.MANY_TO_MANY].includes(this.prop.kind);
    const parentPath = this.parent?.getPath(addParentIndex) ?? this.entityName;
    const index = addIndex && this.index != null ? `[${this.index}]` : '';
    // ignore group operators to allow easier mapping (e.g. for orderBy)
    const key = this.key && !['$and', '$or', '$not'].includes(this.key) ? '.' + this.key : '';
    const ret = parentPath + index + key;

    if (this.isPivotJoin()) {
      // distinguish pivot table join from target entity join
      return this.getPivotPath(ret);
    }

    return ret;
  }

  private isPivotJoin(): boolean {
    if (!this.key || !this.prop) {
      return false;
    }

    const customExpression = RawQueryFragment.isKnownFragment(this.key);
    const scalar = this.payload === null || Utils.isPrimaryKey(this.payload) || this.payload as unknown instanceof RegExp || this.payload as unknown instanceof Date || customExpression;
    const operator = Utils.isObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));

    return this.prop.kind === ReferenceKind.MANY_TO_MANY && (scalar || operator);
  }

  getPivotPath(path: string): string {
    return `${path}[pivot]`;
  }

  aliased(field: string, alias?: string) {
    return alias ? `${alias}.${field}` : field;
  }

  /** @ignore */
  [inspect.custom]() {
    const o: Dictionary = {};
    (['entityName', 'key', 'index', 'payload'] as const)
      .filter(k => this[k] !== undefined)
      .forEach(k => o[k] = this[k]);

    return `${this.constructor.name} ${inspect(o)}`;
  }

}
