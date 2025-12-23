import { MetadataStorage, Property, type AnyEntity, type EntityOptions } from '@mikro-orm/core';

export type RelationshipDirection = 'IN' | 'OUT';

export interface RelationshipOptions {
  type: string;
  direction: RelationshipDirection;
}

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

// Store relationship metadata separate from MikroORM's metadata system
const relationshipMetadata = new WeakMap<Function, Map<string, RelationshipOptions>>();

/**
 * Decorator to mark a relationship property with Neo4j metadata (type + direction).
 * Works with @ManyToOne, @OneToOne, @ManyToMany, and @OneToMany decorators.
 *
 * @example
 * // Many-to-one relationship
 * @ManyToOne(() => Category, { ref: true })
 * @Rel({ type: 'PART_OF', direction: 'OUT' })
 * category?: Ref<Category>;
 *
 * @example
 * // Many-to-many relationship
 * @ManyToMany(() => Tag)
 * @Rel({ type: 'HAS_TAG', direction: 'OUT' })
 * tags = new Collection<Tag>(this);
 */
export const Rel = (options: RelationshipOptions) => {
  return function (target: AnyEntity, propertyName: string) {
    // Store metadata in a separate WeakMap to avoid interfering with MikroORM decorators
    let props = relationshipMetadata.get(target.constructor);
    if (!props) {
      props = new Map();
      relationshipMetadata.set(target.constructor, props);
    }
    props.set(propertyName, options);
  };
};

/**
 * @deprecated Use @Rel instead. RelMany is now an alias for Rel.
 */
export const RelMany = Rel;

/**
 * Get relationship options for a property.
 * Used internally by the Neo4j driver.
 * @internal
 */
export function getRelationshipMetadata(entityClass: Function, propertyName: string): RelationshipOptions | undefined {
  const props = relationshipMetadata.get(entityClass);
  return props?.get(propertyName);
}

/**
 * Simple property helper for nodes.
 */
export const Field = Property;

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
