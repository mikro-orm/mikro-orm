import type { IQueryBuilder } from '../typings';
import { CriteriaNode } from './CriteriaNode';

/**
 * @internal
 */
export class ArrayCriteriaNode<T extends object> extends CriteriaNode<T> {
  override process(qb: IQueryBuilder<T>, alias?: string): any {
    return this.payload.map((node: CriteriaNode<T>) => {
      return node.process(qb, alias);
    });
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string) {
    return this.payload.some((node: CriteriaNode<T>) => {
      return node.willAutoJoin(qb, alias);
    });
  }
}
