import { MetadataStorage } from '../metadata';
import { QueryBuilder } from './QueryBuilder';
import { CriteriaNode } from './internal';

export class ArrayCriteriaNode extends CriteriaNode {

  static create(metadata: MetadataStorage, entityName: string, payload: any[], parent?: CriteriaNode, key?: string): ArrayCriteriaNode {
    const node = new ArrayCriteriaNode(metadata, entityName, parent, key);
    node.payload = payload.map(item => CriteriaNode.create(metadata, entityName, item, node));

    return node;
  }

  process(qb: QueryBuilder, alias?: string): any {
    return this.payload.map((node: CriteriaNode) => {
      return node.process(qb, alias);
    });
  }

  getPath(): string {
    if (this.parent && this.parent.parent) {
      return this.parent.parent.getPath();
    }

    return '';
  }

}
