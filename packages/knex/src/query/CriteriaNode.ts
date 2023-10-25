import { inspect } from 'util';
import { ReferenceKind, Utils, type Dictionary, type EntityProperty, type MetadataStorage } from '@mikro-orm/core';
import type { ICriteriaNode, IQueryBuilder } from '../typings';

/**
 * Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
 * Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }
 * @internal
 */
export class CriteriaNode implements ICriteriaNode {

  payload: any;
  prop?: EntityProperty;
  index?: number;

  constructor(protected readonly metadata: MetadataStorage,
              readonly entityName: string,
              readonly parent?: ICriteriaNode,
              readonly key?: string,
              validate = true) {
    const meta = parent && metadata.find(parent.entityName);

    if (meta && key) {
      const pks = Utils.splitPrimaryKeys(key);

      if (pks.length > 1) {
        return;
      }

      pks.forEach(k => {
        this.prop = meta.props.find(prop => prop.name === k || (prop.fieldNames?.length === 1 && prop.fieldNames[0] === k));
        const isProp = this.prop || meta.props.find(prop => (prop.fieldNames || []).includes(k));

        // do not validate if the key is prefixed or type casted (e.g. `k::text`)
        if (validate && !isProp && !k.includes('.') && !k.includes('::') && !Utils.isOperator(k) && !CriteriaNode.isCustomExpression(k)) {
          throw new Error(`Trying to query by not existing property ${entityName}.${k}`);
        }
      });
    }
  }

  process<T>(qb: IQueryBuilder<T>, alias?: string): any {
    return this.payload;
  }

  shouldInline(payload: any): boolean {
    return false;
  }

  willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string) {
    return false;
  }

  shouldRename(payload: any): boolean {
    const type = this.prop ? this.prop.kind : null;
    const composite = this.prop?.joinColumns ? this.prop.joinColumns.length > 1 : false;
    const customExpression = CriteriaNode.isCustomExpression(this.key!);
    const scalar = payload === null || Utils.isPrimaryKey(payload) || payload as unknown instanceof RegExp || payload as unknown instanceof Date || customExpression;
    const operator = Utils.isPlainObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

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
    const joinAlias = qb.getAliasForJoinPath(this.getPath());
    const alias = joinAlias ?? qb.alias;

    if (this.prop!.kind === ReferenceKind.MANY_TO_MANY) {
      return Utils.getPrimaryKeyHash(this.prop!.inverseJoinColumns.map(col => `${alias}.${col}`));
    }

    // if we found a matching join, we need to use the target table column names, as we use that alias instead of the root
    if (!joinAlias && this.prop!.owner && this.prop!.joinColumns.length > 1) {
      return Utils.getPrimaryKeyHash(this.prop!.joinColumns.map(col => `${alias}.${col}`));
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

    const customExpression = CriteriaNode.isCustomExpression(this.key);
    const scalar = this.payload === null || Utils.isPrimaryKey(this.payload) || this.payload as unknown instanceof RegExp || this.payload as unknown instanceof Date || customExpression;
    const operator = Utils.isObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));

    return this.prop.kind === ReferenceKind.MANY_TO_MANY && (scalar || operator);
  }

  getPivotPath(path: string): string {
    return `${path}[pivot]`;
  }

  [inspect.custom]() {
    const o: Dictionary = {};
    ['entityName', 'key', 'index', 'payload']
      .filter(k => this[k] !== undefined)
      .forEach(k => o[k] = this[k]);

    return `${this.constructor.name} ${inspect(o)}`;
  }

  static isCustomExpression(field: string): boolean {
    return !!field.match(/[ ?<>=()]|^\d/);
  }

}
