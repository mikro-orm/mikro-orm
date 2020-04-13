import { MetadataStorage, Dictionary, ReferenceType, Utils } from '@mikro-orm/core';
import { QueryBuilder, QueryBuilderHelper, QueryType, CriteriaNode } from './internal';

export class ObjectCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: CriteriaNode, key?: string): ObjectCriteriaNode {
    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    const meta = metadata.get(entityName, false, false);
    node.payload = Object.keys(payload).reduce((o, item) => {
      const prop = meta?.properties[item];
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
    const composite = this.prop.joinColumns && this.prop.joinColumns.length > 1;
    const operatorKeys = knownKey && Object.keys(this.payload).every(key => QueryBuilderHelper.isOperator(key, false));

    return !nestedAlias && !operatorKeys && !composite;
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
