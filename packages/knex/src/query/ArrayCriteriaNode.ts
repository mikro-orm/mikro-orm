import { MetadataStorage } from '@mikro-orm/core';
import { CriteriaNode, QueryBuilder } from './internal';

export class ArrayCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: any[], parent?: CriteriaNode, key?: string): ArrayCriteriaNode {
    const node = new ArrayCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload.map(item => CriteriaNode.create(metadata, entityName, item, node));

    return node;
  }

  process<T>(qb: QueryBuilder<T>, alias?: string): any {
    return this.payload.map((node: CriteriaNode) => {
      return node.process(qb, alias);
    });
  }

  willAutoJoin<T>(qb: QueryBuilder<T>, alias?: string) {
    return this.payload.some((node: CriteriaNode) => {
      return node.willAutoJoin(qb, alias);
    });
  }

  getPath(): string {
    /* istanbul ignore next */
    return this.parent?.parent?.getPath() || '';
  }

}
