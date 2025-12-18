import { type EntityMetadata, type EntityProperty, ReferenceKind } from '@mikro-orm/core';
import { getRelationshipMetadata } from './decorators';

/**
 * Utility class for extracting Neo4j-specific metadata from MikroORM entity decorators.
 * Provides shared helpers for getting labels, relationship types, directions, etc.
 */
export class Neo4jCypherBuilder {

  /**
   * Extracts Neo4j labels from entity metadata.
   * Includes the primary label (collection name) and any additional labels from @Node decorator.
   */
  static getNodeLabels<T extends object>(meta: EntityMetadata<T>): string[] {
    const labels = [meta.collection];
    const additionalLabels = (meta as any).neo4jLabels;

    if (additionalLabels && Array.isArray(additionalLabels)) {
      labels.push(...additionalLabels);
    }

    return labels;
  }

  /**
   * Gets the relationship type from @Rel/@RelMany decorator or falls back to property name.
   * Returns undefined if no decorator metadata is found (used for validation).
   */
  static getRelationshipType<T extends object>(
    sourceEntity: EntityMetadata<T> | Function,
    property: EntityProperty | string,
    allowFallback = true,
  ): string | undefined {
    const entityClass = typeof sourceEntity === 'function'
      ? sourceEntity
      : (sourceEntity as EntityMetadata<T>).class;

    const propertyName = typeof property === 'string' ? property : property.name;

    // Try to get from decorator metadata
    const relMetadata = getRelationshipMetadata(entityClass, propertyName);
    if (relMetadata?.type) {
      return relMetadata.type;
    }

    // Fallback: check property custom metadata
    if (typeof property !== 'string') {
      const customRel = (property as any).custom?.relationship;
      if (customRel?.type) {
        return customRel.type;
      }
    }

    // If no metadata found and fallback not allowed, return undefined
    if (!allowFallback) {
      return undefined;
    }

    // Default: uppercase property name
    return propertyName.toUpperCase();
  }

  /**
   * Gets the relationship direction from @Rel/@RelMany decorator.
   */
  static getRelationshipDirection(
    sourceEntity: Function,
    propertyName: string,
  ): 'IN' | 'OUT' | undefined {
    const relMetadata = getRelationshipMetadata(sourceEntity, propertyName);
    return relMetadata?.direction;
  }

  /**
   * Checks if an entity is a relationship entity (has @RelationshipProperties).
   */
  static isRelationshipEntity<T extends object>(meta: EntityMetadata<T>): boolean {
    return !!(meta as any).neo4jRelationshipEntity;
  }

  /**
   * Gets the relationship type for a relationship entity.
   */
  static getRelationshipEntityType<T extends object>(meta: EntityMetadata<T>): string {
    return (meta as any).neo4jRelationshipType ?? meta.className.toUpperCase();
  }

  /**
   * Finds the two @ManyToOne properties in a relationship entity.
   */
  static getRelationshipEntityEnds<T extends object>(
    meta: EntityMetadata<T>,
  ): [EntityProperty<T>, EntityProperty<T>] {
    const props = Object.values(meta.properties) as EntityProperty<T>[];
    const manyToOneProps = props.filter(p => p.kind === ReferenceKind.MANY_TO_ONE);

    if (manyToOneProps.length !== 2) {
      throw new Error(
        `Relationship entity ${meta.className} must have exactly 2 @ManyToOne properties, found ${manyToOneProps.length}`,
      );
    }

    return [manyToOneProps[0], manyToOneProps[1]];
  }

  /**
   * Formats node labels as a Cypher label string (:Label1:Label2).
   */
  static getNodeLabelsString<T extends object>(meta: EntityMetadata<T>): string {
    const labels = this.getNodeLabels(meta);
    return ':' + labels.join(':');
  }

  /**
   * Converts Neo4j relationship direction to QueryBuilder direction format.
   * @param direction - Neo4j direction ('IN' or 'OUT')
   * @returns QueryBuilder direction ('left', 'right', or 'undirected')
   */
  static convertDirection(direction: 'IN' | 'OUT' | undefined): 'left' | 'right' | 'undirected' | undefined {
    if (!direction) {
      return undefined;
    }
    return direction === 'IN' ? 'left' : 'right';
  }

}
