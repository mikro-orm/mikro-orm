import { CriteriaNode } from './CriteriaNode';
import { IQueryBuilder } from '../typings';

export class ArrayCriteriaNode extends CriteriaNode {

  process<T>(qb: IQueryBuilder<T>, alias?: string): any {
    return this.payload.map((node: CriteriaNode) => {
      return node.process(qb, alias);
    });
  }

  willAutoJoin<T>(qb: IQueryBuilder<T>, alias?: string) {
    return this.payload.some((node: CriteriaNode) => {
      return node.willAutoJoin(qb, alias);
    });
  }

  getPath(): string {
    /* istanbul ignore next */
    return this.parent?.parent?.getPath() ?? '';
  }

}
