import { type EntityOptions, MetadataStorage } from '@mikro-orm/core';


export interface Neo4jRelationshipOptions extends EntityOptions<any> {
  /**
   * The relationship type in Neo4j.
   * Example: 'ACTED_IN', 'COMPLETED', etc.
   */
  type?: string;
}
/**
 * Marks an entity as a Neo4j relationship with properties.
 * Must be used together with @Entity decorator.
 * Example:
 * @Entity()
 * @RelationshipProperties({ type: 'ACTED_IN' })
 * class ActedIn {
 *   @Property() roles!: string[];
 * }
 */

export const RelationshipProperties = (options?: Neo4jRelationshipOptions): ClassDecorator => {
  return function (target: any) {
    const meta = MetadataStorage.getMetadataFromDecorator(target);
    if (meta) {
      (meta as any).neo4jRelationshipEntity = true;
      (meta as any).neo4jRelationshipType = options?.type;
    }
  };
};
