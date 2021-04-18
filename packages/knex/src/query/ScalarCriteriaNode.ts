import { ReferenceType } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import { IQueryBuilder } from '../typings';

/**
 * @internal
 */
export class ScalarCriteriaNode extends CriteriaNode {

  process<T>(qb: IQueryBuilder<T>, alias?: string): any {
    if (this.shouldJoin()) {
      const path = this.getPath();
      const parentPath = this.parent!.getPath(); // the parent is always there, otherwise `shouldJoin` would return `false`
      const nestedAlias = qb.getAliasForJoinPath(path) || qb.getNextAlias();
      const field = `${alias}.${this.prop!.name}`;
      const type = this.prop!.reference === ReferenceType.MANY_TO_MANY ? 'pivotJoin' : 'leftJoin';
      qb.join(field, nestedAlias, undefined, type, path);

      // select the owner as virtual property when joining from 1:1 inverse side, but only if the parent is root entity
      if (this.prop!.reference === ReferenceType.ONE_TO_ONE && !parentPath.includes('.')) {
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
