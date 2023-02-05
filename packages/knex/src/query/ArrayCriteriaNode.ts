import { CriteriaNode } from './CriteriaNode';
import type { IQueryBuilder } from '../typings';

/**
 * @internal
 */
export class ArrayCriteriaNode<T extends object> extends CriteriaNode<T> {

  process(qb: IQueryBuilder<T>, alias?: string): any {
    return this.payload.map((node: CriteriaNode<T>) => {
      return node.process(qb, alias);
    });
  }

  willAutoJoin(qb: IQueryBuilder<T>, alias?: string) {
    return this.payload.some((node: CriteriaNode<T>) => {
      return node.willAutoJoin(qb, alias);
    });
  }

}
