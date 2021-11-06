import type { Dictionary } from '@mikro-orm/core';
import { ReferenceType, Utils } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import type { IQueryBuilder } from '../typings';
import { QueryType } from './enums';

/**
 * @internal
 */
export class ObjectCriteriaNode extends CriteriaNode {

  process<T>(qb: IQueryBuilder<T>, alias?: string): any {
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
      const customExpression = ObjectCriteriaNode.isCustomExpression(field);
      const virtual = childNode.prop?.persist === false;
      // if key is missing, we are inside group operator and we need to prefix with alias
      const primaryKey = this.key && this.metadata.find(this.entityName)!.primaryKeys.includes(field);

      if (childNode.shouldInline(payload)) {
        const childAlias = qb.getAliasForJoinPath(childNode.getPath());
        this.inlineChildPayload(o, payload, field, alias, childAlias);
      } else if (childNode.shouldRename(payload)) {
        o[childNode.renameFieldToPK(qb)] = payload;
      } else if (primaryKey || virtual || operator || customExpression || field.includes('.') || ![QueryType.SELECT, QueryType.COUNT].includes(qb.type ?? QueryType.SELECT)) {
        o[field] = payload;
      } else {
        o[`${alias}.${field}`] = payload;
      }

      return o;
    }, {});
  }

  willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string) {
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
    const customExpression = ObjectCriteriaNode.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(payload) || payload instanceof RegExp || payload instanceof Date || customExpression;
    const operator = Utils.isObject(payload) && Object.keys(payload).every(k => Utils.isOperator(k, false));

    return !!this.prop && this.prop.reference !== ReferenceType.SCALAR && !scalar && !operator;
  }

  private inlineChildPayload<T>(o: Dictionary, payload: Dictionary, field: string, alias?: string, childAlias?: string) {
    const prop = this.metadata.find(this.entityName)!.properties[field];

    for (const k of Object.keys(payload)) {
      if (Utils.isOperator(k, false)) {
        const tmp = payload[k];
        delete payload[k];
        o[`${alias}.${field}`] = { [k]: tmp, ...(o[`${alias}.${field}`] || {}) };
      } else if (this.isPrefixed(k) || Utils.isOperator(k) || !childAlias) {
        const idx = prop.referencedPKs.indexOf(k);
        const key = idx !== -1 && !childAlias ? prop.joinColumns[idx] : k;

        if (key in o) {
          /* istanbul ignore next */
          const $and = o.$and ?? [];
          $and.push({ [key]: o[key] }, { [key]: payload[k] });
          delete o[key];
          o.$and = $and;
        } else {
          o[key] = payload[k];
        }
      } else {
        o[`${childAlias}.${k}`] = payload[k];
      }
    }
  }

  private shouldAutoJoin(nestedAlias: string | undefined): boolean {
    if (!this.prop || !this.parent) {
      return false;
    }

    const embeddable = this.prop.reference === ReferenceType.EMBEDDED;
    const knownKey = [ReferenceType.SCALAR, ReferenceType.MANY_TO_ONE, ReferenceType.EMBEDDED].includes(this.prop.reference) || (this.prop.reference === ReferenceType.ONE_TO_ONE && this.prop.owner);
    const operatorKeys = knownKey && Object.keys(this.payload).every(key => Utils.isOperator(key, false));
    const primaryKeys = knownKey && Object.keys(this.payload).every(key => this.metadata.find(this.entityName)!.primaryKeys.includes(key));

    return !primaryKeys && !nestedAlias && !operatorKeys && !embeddable;
  }

  private autoJoin<T>(qb: IQueryBuilder<T>, alias: string): string {
    const nestedAlias = qb.getNextAlias();
    const customExpression = ObjectCriteriaNode.isCustomExpression(this.key!);
    const scalar = Utils.isPrimaryKey(this.payload) || this.payload instanceof RegExp || this.payload instanceof Date || customExpression;
    const operator = Utils.isPlainObject(this.payload) && Object.keys(this.payload).every(k => Utils.isOperator(k, false));
    const field = `${alias}.${this.prop!.name}`;

    if (this.prop!.reference === ReferenceType.MANY_TO_MANY && (scalar || operator)) {
      qb.join(field, nestedAlias, undefined, 'pivotJoin', this.getPath());
    } else {
      const prev = qb._fields?.slice();
      qb.join(field, nestedAlias, undefined, 'leftJoin', this.getPath());
      qb._fields = prev;
    }

    return nestedAlias;
  }

  private isPrefixed(field: string): boolean {
    return !!field.match(/\w+\./);
  }

}
