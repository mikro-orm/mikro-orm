import { Dictionary, MetadataStorage, ReferenceType, Utils, ValidationError } from '@mikro-orm/core';
import { CriteriaNode, QueryBuilder, QueryBuilderHelper, QueryType } from './internal';

export class ObjectCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: Dictionary, parent?: CriteriaNode, key?: string): ObjectCriteriaNode {
    const node = new ObjectCriteriaNode(metadata, entityName, parent, key);
    const meta = metadata.get(entityName, false, false);
    node.payload = Object.keys(payload).reduce((o, item) => {
      const prop = meta?.properties[item];

      if (prop?.reference === ReferenceType.EMBEDDED) {
        const operator = Object.keys(payload[item]).some(f => Utils.isOperator(f));

        if (operator) {
          throw ValidationError.cannotUseOperatorsInsideEmbeddables(entityName, prop.name, payload);
        }

        const map = Object.keys(payload[item]).reduce((oo, k) => {
          oo[prop.embeddedProps[k].name] = payload[item][k];
          return oo;
        }, {});
        o[item] = CriteriaNode.create(metadata, entityName, map, node, item);
      } else {
        const childEntity = prop && prop.reference !== ReferenceType.SCALAR ? prop.type : entityName;
        o[item] = CriteriaNode.create(metadata, childEntity, payload[item], node, item);
      }

      return o;
    }, {});

    return node;
  }

  process(qb: QueryBuilder, alias?: string): any {
    const nestedAlias = qb.getAliasForJoinPath(this.getPath());
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
      const operator = Utils.isOperator(field);
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

  willAutoJoin(qb: QueryBuilder, alias?: string): boolean {
    const nestedAlias = qb.getAliasForJoinPath(this.getPath());
    const ownerAlias = alias || qb.alias;

    if (nestedAlias) {
      alias = nestedAlias;
    }

    if (this.shouldAutoJoin(nestedAlias)) {
      return true;
    }

    return Object.keys(this.payload).some(field => {
      const childNode = this.payload[field] as CriteriaNode;
      return childNode.willAutoJoin(qb, this.prop ? alias : ownerAlias);
    });
  }

  shouldInline(payload: any): boolean {
    const customExpression = QueryBuilderHelper.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

    return !!this.prop && this.prop.reference !== ReferenceType.SCALAR && !scalar && !operator;
  }

  private shouldAutoJoin(nestedAlias: string | undefined): boolean {
    if (!this.prop || !this.parent) {
      return false;
    }

    const embeddable = this.prop.reference === ReferenceType.EMBEDDED;
    const knownKey = [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE, ReferenceType.EMBEDDED].includes(this.prop.reference) || (this.prop.reference === ReferenceType.ONE_TO_ONE && this.prop.owner);
    const operatorKeys = knownKey && Object.keys(this.payload).every(key => Utils.isOperator(key, false));

    return !nestedAlias && !operatorKeys && !embeddable;
  }

  private autoJoin(qb: QueryBuilder, alias: string): string {
    const nestedAlias = qb.getNextAlias();
    const customExpression = QueryBuilderHelper.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload instanceof RegExp || this.payload instanceof Date || customExpression;
    const operator = Utils.isPlainObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));
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
