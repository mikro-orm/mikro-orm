import { inspect } from 'util';
import { Dictionary, EntityProperty } from '../typings';
import { MetadataStorage } from '../metadata';
import { QueryBuilderHelper } from './QueryBuilderHelper';
import { Utils } from '../utils';
import { QueryBuilder } from './QueryBuilder';
import { ReferenceType } from '../entity';
import { QueryType } from './enums';

/**
 * Helper for working with deeply nested where/orderBy/having criteria. Uses composite pattern to build tree from the payload.
 * Auto-joins relations and converts payload from { books: { publisher: { name: '...' } } } to { 'publisher_alias.name': '...' }
 */
export class CriteriaNode {

  payload: any;
  prop?: EntityProperty;

  constructor(protected readonly metadata: MetadataStorage,
              readonly entityName: string,
              readonly parent?: CriteriaNode,
              readonly key?: string,
              validate = true) {
    const meta = parent && metadata.get(parent.entityName, false, false);

    if (meta && key) {
      this.prop = meta.properties[key];

      if (validate && !this.prop && !key.includes('.') && !QueryBuilderHelper.isOperator(key) && !QueryBuilderHelper.isCustomExpression(key)) {
        throw new Error(`Trying to query by not existing property ${entityName}.${key}`);
      }
    }
  }

  static create(metadata: MetadataStorage, entityName: string, payload: any, parent?: CriteriaNode, key?: string): CriteriaNode {
    const customExpression = QueryBuilderHelper.isCustomExpression(key || '');
    const scalar = Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;

    if (Array.isArray(payload) && !scalar) {
      return ArrayCriteriaNode.create(metadata, entityName, payload, parent, key);
    }

    if (Utils.isObject(payload) && !scalar) {
      return ObjectCriteriaNode.create(metadata, entityName, payload, parent, key);
    }

    return ScalarCriteriaNode.create(metadata, entityName, payload, parent, key);
  }

  process(qb: QueryBuilder, alias?: string): any {
    return this.payload;
  }

  shouldInline(payload: any): boolean {
    return false;
  }

  shouldRename(payload: any): boolean {
    const type = this.prop ? this.prop.reference : null;
    const customExpression = QueryBuilderHelper.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => QueryBuilderHelper.isOperator(k, false));

    switch (type) {
      case ReferenceType.MANY_TO_ONE: return false;
      case ReferenceType.ONE_TO_ONE: return !this.prop!.owner && !(this.parent && this.parent.parent);
      case ReferenceType.ONE_TO_MANY: return scalar || operator;
      case ReferenceType.MANY_TO_MANY: return scalar || operator;
      default: return false;
    }
  }

  renameFieldToPK(qb: QueryBuilder): string {
    if (this.prop!.reference === ReferenceType.MANY_TO_MANY) {
      const pivotTable = this.prop!.pivotTable;
      const alias = qb.getAliasForEntity(pivotTable, this);

      return `${alias}.${this.prop!.inverseJoinColumn}`;
    }

    const meta = this.metadata.get(this.prop!.type);
    const alias = qb.getAliasForEntity(meta.name, this);
    const pk = meta.properties[meta.primaryKey];

    return `${alias}.${pk.fieldName}`;
  }

  getPath(): string {
    let ret = this.parent && this.prop ? this.prop.name : this.entityName;

    if (this.parent instanceof ArrayCriteriaNode && this.parent.parent && !this.key) {
      ret = this.parent.parent.key!;
    }

    if (this.parent) {
      const parentPath = this.parent.getPath();

      if (parentPath) {
        ret = this.parent.getPath() + '.' + ret;
      } else if (this.parent.entityName && ret) {
        ret = this.parent.entityName + '.' + ret;
      }
    }

    return ret;
  }

  [inspect.custom]() {
    return `${this.constructor.name} ${inspect({ entityName: this.entityName, key: this.key, payload: this.payload })}`;
  }

}

export class ScalarCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: any, parent?: CriteriaNode, key?: string): ScalarCriteriaNode {
    const node = new ScalarCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload;

    return node;
  }

  process(qb: QueryBuilder, alias?: string): any {
    if (this.shouldJoin()) {
      const nestedAlias = qb.getAliasForEntity(this.entityName, this) || qb.getNextAlias();
      const field = `${alias}.${this.prop!.name}`;

      if (this.prop!.reference === ReferenceType.MANY_TO_MANY) {
        qb.join(field, nestedAlias, undefined, 'pivotJoin', this.getPath());
      } else {
        qb.join(field, nestedAlias, undefined, 'leftJoin', this.getPath());
      }

      if (this.prop!.reference === ReferenceType.ONE_TO_ONE) {
        qb.addSelect(field);
      }
    }

    return this.payload;
  }

  shouldJoin(): boolean {
    if (!this.parent || !this.prop || [ReferenceType.SCALAR, ReferenceType.ONE_TO_MANY].includes(this.prop.reference)) {
      return false;
    }

    if (this.prop.reference === ReferenceType.ONE_TO_ONE) {
      return !this.prop.owner;
    }

    return this.prop.reference === ReferenceType.MANY_TO_MANY;
  }

}

export class ArrayCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: any[], parent?: CriteriaNode, key?: string): ArrayCriteriaNode {
    const node = new ArrayCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload.map(item => CriteriaNode.create(metadata, entityName, item, node));

    return node;
  }

  process(qb: QueryBuilder, alias?: string): any {
    return this.payload.map((node: CriteriaNode) => {
      return node.process(qb, alias);
    });
  }

  getPath(): string {
    if (this.parent && this.parent.parent) {
      return this.parent.parent.getPath();
    }

    return '';
  }

}

export class ObjectCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: CriteriaNode, key?: string): ObjectCriteriaNode {
    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    const meta = metadata.get(entityName, false, false);
    node.payload = Object.keys(payload).reduce((o, item) => {
      const prop = meta && meta.properties[item];
      const childEntity = prop && prop.reference !== ReferenceType.SCALAR ? prop.type : entityName;
      o[item] = CriteriaNode.create(metadata, childEntity, payload[item], node, item);

      return o;
    }, {});

    return node;
  }

  process(qb: QueryBuilder, alias?: string): any {
    const nestedAlias = qb.getAliasForEntity(this.entityName, this);
    const ownerAlias = alias || qb.alias;

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(nestedAlias)) {
      alias = this.autoJoin(qb, ownerAlias);
    }

    return Object.keys(this.payload).reduce((o, field) => {
      const childNode = this.payload[field] as CriteriaNode;
      const payload = childNode.process(qb, this.prop ? alias : ownerAlias);
      const operator = QueryBuilderHelper.isOperator(field);
      const customExpression = QueryBuilderHelper.isCustomExpression(field);

      if (childNode.shouldInline(payload)) {
        Object.assign(o, payload);
      } else if (childNode.shouldRename(payload)) {
        o[childNode.renameFieldToPK(qb)] = payload;
      } else if (operator || customExpression || field.includes('.') || ![QueryType.SELECT, QueryType.COUNT].includes(qb.type)) {
        o[field] = payload;
      } else {
        o[`${alias}.${field}`] = payload;
      }

      return o;
    }, {});
  }

  shouldInline(payload: any): boolean {
    const customExpression = QueryBuilderHelper.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => QueryBuilderHelper.isOperator(k, false));

    return !!this.prop && this.prop.reference !== ReferenceType.SCALAR && !scalar && !operator;
  }

  private shouldAutoJoin(nestedAlias: string | undefined): boolean {
    if (!this.prop || !this.parent) {
      return false;
    }

    const knownKey = [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE].includes(this.prop.reference) || (this.prop.reference === ReferenceType.ONE_TO_ONE && this.prop.owner);
    const operatorKeys = knownKey && Object.keys(this.payload).every(key => QueryBuilderHelper.isOperator(key, false));

    return !nestedAlias && !operatorKeys;
  }

  private autoJoin(qb: QueryBuilder, alias: string): string {
    const nestedAlias = qb.getNextAlias();
    const customExpression = QueryBuilderHelper.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload instanceof RegExp || this.payload instanceof Date || customExpression;
    const operator = Utils.isObject(this.payload) && Object.keys(this.payload).every(k => QueryBuilderHelper.isOperator(k, false));
    const field = `${alias}.${this.prop!.name}`;

    if (this.prop!.reference === ReferenceType.MANY_TO_MANY && (scalar || operator)) {
      qb.join(field, nestedAlias, undefined, 'pivotJoin', this.getPath());
    } else {
      const prev = qb._fields!.slice();
      qb.join(field, nestedAlias, undefined, 'leftJoin', this.getPath());
      qb._fields = prev;
    }

    return nestedAlias;
  }

}
