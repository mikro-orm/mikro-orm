import { ReferenceType } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import { IQueryBuilder } from '../typings';

export class ScalarCriteriaNode extends CriteriaNode {

  process<T>(qb: IQueryBuilder<T>, alias?: string): any {
    if (this.shouldJoin()) {
      const nestedAlias = qb.getAliasForJoinPath(this.getPath()) || qb.getNextAlias();
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
    if (!this.parent || !this.prop) {
      return false;
    }

    switch (this.prop.reference) {
      case ReferenceType.ONE_TO_MANY: return true;
      case ReferenceType.MANY_TO_MANY: return true;
      case ReferenceType.ONE_TO_ONE: return !this.prop.owner;
      default: return false; // SCALAR, MANY_TO_ONE
    }
  }

}
