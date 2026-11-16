import { ARRAY_OPERATORS, type Collection, type Dictionary, helper, ReferenceKind, Utils } from '@mikro-orm/core';
import { CriteriaNode } from './CriteriaNode.js';
import type { ICriteriaNodeProcessOptions, IQueryBuilder } from '../typings.js';
import { JoinType, QueryType } from './enums.js';
import { QueryBuilder } from './QueryBuilder.js';

/**
 * @internal
 */
export class ScalarCriteriaNode<T extends object> extends CriteriaNode<T> {
  override process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    const matchPopulateJoins =
      options?.matchPopulateJoins ||
      (this.prop && [ReferenceKind.MANY_TO_ONE, ReferenceKind.ONE_TO_ONE].includes(this.prop.kind));
    const nestedAlias = qb.getAliasForJoinPath(this.getPath(options), { ...options, matchPopulateJoins });

    if (this.shouldJoin(qb, nestedAlias)) {
      const path = this.getPath();
      const parentPath = this.parent!.getPath(); // the parent is always there, otherwise `shouldJoin` would return `false`
      const nestedAlias = qb.getAliasForJoinPath(path) || qb.getNextAlias(this.prop?.pivotEntity ?? this.entityName);
      const field = this.aliased(this.prop!.name, options?.alias);
      const type = this.prop!.kind === ReferenceKind.MANY_TO_MANY ? JoinType.pivotJoin : JoinType.leftJoin;
      qb.join(field, nestedAlias, undefined, type, path);

      // select the owner as virtual property when joining from 1:1 inverse side, but only if the parent is root entity
      if (
        this.prop!.kind === ReferenceKind.ONE_TO_ONE &&
        !parentPath.includes('.') &&
        !qb.state.fields?.includes(field)
      ) {
        qb.addSelect(field);
      }
    }

    if (this.payload instanceof QueryBuilder) {
      return this.payload.toRaw();
    }

    if (Utils.isCollection(this.payload)) {
      return { $in: this.getCollectionSubQuery(qb, this.payload) };
    }

    if (this.payload && typeof this.payload === 'object') {
      const keys = Object.keys(this.payload).filter(
        key => ARRAY_OPERATORS.includes(key) && Array.isArray(this.payload[key]),
      );

      for (const key of keys) {
        this.payload[key] = JSON.stringify(this.payload[key]);
      }
    }

    return this.payload;
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions): boolean {
    return this.shouldJoin(qb, alias);
  }

  private getCollectionSubQuery(qb: IQueryBuilder<T>, collection: Collection<any>) {
    const prop = collection.property;
    const owner = helper(collection.owner);
    const ownerPk = owner.getPrimaryKey();

    if (ownerPk == null) {
      throw new Error(
        `Collection ${owner.__meta.className}.${prop.name} can be used as a filter value only when its owner has a primary key.`,
      );
    }

    const sub = qb.clone(true);

    if (prop.kind === ReferenceKind.ONE_TO_MANY) {
      const targetMeta = prop.targetMeta!;
      sub
        .from(targetMeta.class)
        .select(targetMeta.primaryKeys)
        .where({ [prop.mappedBy]: ownerPk });
    } else {
      const pivotMeta = this.metadata.find(prop.pivotEntity)!;
      const targetProp = pivotMeta.relations[prop.owner ? 1 : 0];
      const ownerProp = pivotMeta.relations[prop.owner ? 0 : 1];
      sub
        .from(pivotMeta.class)
        .select(targetProp.name)
        .where({ [ownerProp.name]: ownerPk });
    }

    return (sub as Dictionary).getNativeQuery().toRaw();
  }

  private shouldJoin(qb: IQueryBuilder<T>, nestedAlias: string | undefined): boolean {
    if (
      !this.parent ||
      !this.prop ||
      (nestedAlias && [QueryType.SELECT, QueryType.COUNT].includes(qb.type ?? QueryType.SELECT))
    ) {
      return false;
    }

    switch (this.prop.kind) {
      case ReferenceKind.ONE_TO_MANY:
        return true;
      case ReferenceKind.MANY_TO_MANY:
        return true;
      case ReferenceKind.ONE_TO_ONE:
        return !this.prop.owner;
      default:
        return false; // SCALAR, MANY_TO_ONE
    }
  }
}
