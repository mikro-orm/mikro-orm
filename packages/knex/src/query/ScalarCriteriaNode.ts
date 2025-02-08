import { ReferenceKind, Utils } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode';
import type { IQueryBuilder, ICriteriaNodeProcessOptions } from '../typings';
import { JoinType } from './enums';
import { QueryBuilder } from './QueryBuilder';

/**
 * @internal
 */
export class ScalarCriteriaNode<T extends object> extends CriteriaNode<T> {

  override process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    if (this.shouldJoin()) {
      const path = this.getPath();
      const parentPath = this.parent!.getPath(); // the parent is always there, otherwise `shouldJoin` would return `false`
      const nestedAlias = qb.getAliasForJoinPath(path) || qb.getNextAlias(this.prop?.pivotTable ?? this.entityName);
      const field = this.aliased(this.prop!.name, options?.alias);
      const type = this.prop!.kind === ReferenceKind.MANY_TO_MANY ? JoinType.pivotJoin : JoinType.leftJoin;
      qb.join(field, nestedAlias, undefined, type, path);

      // select the owner as virtual property when joining from 1:1 inverse side, but only if the parent is root entity
      if (this.prop!.kind === ReferenceKind.ONE_TO_ONE && !parentPath.includes('.') && !qb._fields?.includes(field)) {
        qb.addSelect(field);
      }
    }

    if (this.payload instanceof QueryBuilder) {
      return this.payload.getNativeQuery().toRaw();
    }

    if (this.payload && typeof this.payload === 'object') {
      const keys = Object.keys(this.payload).filter(key => Utils.isArrayOperator(key) && Array.isArray(this.payload[key]));

      for (const key of keys) {
        this.payload[key] = JSON.stringify(this.payload[key]);
      }
    }

    return this.payload;
  }

  override willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions) {
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
