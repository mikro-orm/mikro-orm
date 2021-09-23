import { inspect } from 'util';
import type { EntityProperty, MetadataStorage } from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';
import type { ICriteriaNode, IQueryBuilder } from '../typings';

/**
 * Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
 * Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }
 * @internal
 */
export class CriteriaNode implements ICriteriaNode {

  payload: any;
  prop?: EntityProperty;

  constructor(protected readonly metadata: MetadataStorage,
              readonly entityName: string,
              readonly parent?: ICriteriaNode,
              readonly key?: string,
              validate = true) {
    const meta = parent && metadata.find(parent.entityName);

    if (meta && key) {
      Utils.splitPrimaryKeys(key).forEach(k => {
        this.prop = meta.props.find(prop => prop.name === k || (prop.fieldNames || []).includes(k));

        // do not validate if the key is prefixed or type casted (e.g. `k::text`)
        if (validate && !this.prop && !k.includes('.') && !k.includes('::') && !Utils.isOperator(k) && !CriteriaNode.isCustomExpression(k)) {
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
    const type = this.prop ? this.prop.reference : null;
    const composite = /* istanbul ignore next */ this.prop?.joinColumns ? this.prop.joinColumns.length > 1 : false;
    const customExpression = CriteriaNode.isCustomExpression(this.key!);
    const scalar = payload === null || Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;
    const operator = Utils.isPlainObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

    if (composite) {
      return true;
    }

    switch (type) {
      case ReferenceType.MANY_TO_ONE: return false;
      case ReferenceType.ONE_TO_ONE: return !this.prop!.owner;
      case ReferenceType.ONE_TO_MANY: return scalar || operator;
      case ReferenceType.MANY_TO_MANY: return scalar || operator;
      default: return false;
    }
  }

  renameFieldToPK<T>(qb: IQueryBuilder<T>): string {
    const alias = qb.getAliasForJoinPath(this.getPath());

    if (this.prop!.reference === ReferenceType.MANY_TO_MANY) {
      return Utils.getPrimaryKeyHash(this.prop!.inverseJoinColumns.map(col => `${alias}.${col}`));
    }

    if (this.prop!.joinColumns.length > 1) {
      return Utils.getPrimaryKeyHash(this.prop!.joinColumns);
    }

    return Utils.getPrimaryKeyHash(this.prop!.referencedColumnNames.map(col => `${alias}.${col}`));
  }

  getPath(): string {
    const parentPath = this.parent?.getPath();
    let ret = this.parent && this.prop ? this.prop.name : this.entityName;

    if (parentPath && this.prop?.reference === ReferenceType.SCALAR) {
      return parentPath;
    }

    if (this.parent && Array.isArray(this.parent.payload) && this.parent.parent && !this.key) {
      ret = this.parent.parent.key!;
    }

    if (parentPath) {
      ret = parentPath + '.' + ret;
    } else if (this.parent?.entityName && ret && this.prop) {
      ret = this.parent.entityName + '.' + ret;
    }

    if (this.isPivotJoin()) {
      return this.getPivotPath(ret);
    }

    return ret ?? '';
  }

  private isPivotJoin(): boolean {
    if (!this.key || !this.prop) {
      return false;
    }

    const customExpression = CriteriaNode.isCustomExpression(this.key);
    const scalar = this.payload === null || Utils.isPrimaryKey(this.payload) || this.payload instanceof RegExp || this.payload instanceof Date || customExpression;
    const operator = Utils.isObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));

    return this.prop.reference === ReferenceType.MANY_TO_MANY && (scalar || operator);
  }

  getPivotPath(path: string): string {
    return `${path}[pivot]`;
  }

  [inspect.custom]() {
    return `${this.constructor.name} ${inspect({ entityName: this.entityName, key: this.key, payload: this.payload })}`;
  }

  static isCustomExpression(field: string): boolean {
    return !!field.match(/[ ?<>=()]|^\d/);
  }

}
