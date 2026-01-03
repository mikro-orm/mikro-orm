import { MetadataStorage } from '@mikro-orm/core';


export interface Neo4jNodeOptions {
  /**
   * Additional Neo4j labels for this node.
   * The primary label is derived from the collection name.
   * Example: labels: ['Employee', 'Manager'] would create nodes with :Person:Employee:Manager
   */
  labels?: string[];
}
/**
 * Decorator to mark an entity as a Neo4j node.
 * Must be used together with @Entity decorator.
 * Supports multiple Neo4j labels via the labels option.
 *
 * @example
 * @Entity()
 * @Node()
 * class Person { ... }
 *
 * @example
 * @Entity()
 * @Node({ labels: ['Employee', 'Manager'] })
 * class Executive { ... }
 */

export const Node = (options?: Neo4jNodeOptions): ClassDecorator => {
  return function (target: any) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    if (meta) {
      (meta as any).neo4jNode = true;
      if (options?.labels) {
        (meta as any).neo4jLabels = options.labels;
      }
    }
  };
};
