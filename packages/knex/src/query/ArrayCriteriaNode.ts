import { CriteriaNode } from './CriteriaNode.js';
import type { IQueryBuilder, ICriteriaNodeProcessOptions } from '../typings.js';

/**
 * @internal
 */
export class ArrayCriteriaNode<T extends object> extends CriteriaNode<T> {

  override process(qb: IQueryBuilder<T>, options?: ICriteriaNodeProcessOptions): any {
    return this.payload.map((node: CriteriaNode<T>) => {
      return node.process(qb, options);
    });
  }

  override unwrap(): any {
    return this.payload.map((node: CriteriaNode<T>) => {
      return node.unwrap();
    });
  }

  override willAutoJoin(qb: IQueryBuilder<T>, alias?: string, options?: ICriteriaNodeProcessOptions) {
    return this.payload.some((node: CriteriaNode<T>) => {
      return node.willAutoJoin(qb, alias, options);
    });
  }

}
