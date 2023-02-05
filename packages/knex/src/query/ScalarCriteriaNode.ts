import { ReferenceKind } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import type { IQueryBuilder } from '../typings';

/**
 * @internal
 */
export class ScalarCriteriaNode<T extends object> extends CriteriaNode<T> {

  process(qb: IQueryBuilder<T>, alias?: string): any {
    if (this.shouldJoin()) {
      const path = this.getPath();
      const parentPath = this.parent!.getPath(); // the parent is always there, otherwise `shouldJoin` would return `false`
      const nestedAlias = qb.getAliasForJoinPath(path) || qb.getNextAlias(this.prop?.pivotTable ?? this.entityName);
      const field = `${alias}.${this.prop!.name}`;
      const type = this.prop!.kind === ReferenceKind.MANY_TO_MANY ? 'pivotJoin' : 'leftJoin';
      qb.join(field, nestedAlias, undefined, type, path);

      // select the owner as virtual property when joining from 1:1 inverse side, but only if the parent is root entity
      if (this.prop!.kind === ReferenceKind.ONE_TO_ONE && !parentPath.includes('.')) {
        qb.addSelect(field);
      }
    }

    return this.payload;
  }

  willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string) {
    return this.shouldJoin();
  }

  shouldJoin(): boolean {
    if (!this.parent || !this.prop) {
      return false;
    }

    switch (this.prop.kind) {
      case ReferenceKind.ONE_TO_MANY: return true;
      case ReferenceKind.MANY_TO_MANY: return true;
      case ReferenceKind.ONE_TO_ONE: return !this.prop.owner;
      default: return false; // SCALAR, MANY_TO_ONE
    }
  }

}
