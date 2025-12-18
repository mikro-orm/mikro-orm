import { Entity, ManyToMany, ManyToOne, Property, type EntityOptions, type ManyToManyOptions, type ManyToOneOptions } from '@mikro-orm/core';
import type { Dictionary } from '@mikro-orm/core';

export type RelationshipDirection = 'IN' | 'OUT';

export interface RelationshipOptions {
  type: string;
  direction: RelationshipDirection;
  properties?: Dictionary<unknown>;
}

export interface Neo4jManyToOneOptions<T> extends ManyToOneOptions<T> {
  relationship: RelationshipOptions;
}

export interface Neo4jManyToManyOptions<T> extends ManyToManyOptions<T> {
  relationship: RelationshipOptions;
}

/**
 * Alias for @Entity oriented to graph semantics.
 */
export const node = (options?: EntityOptions<any>): ClassDecorator => Entity(options ?? {} as any);

/**
 * Many-to-one relationship with Neo4j relationship metadata (type + direction).
 */
export const rel = <T>(entity: string | (() => T), options: Neo4jManyToOneOptions<T>) => {
  return ManyToOne(entity as any, { ...options, custom: { relationship: options.relationship } });
};

/**
 * Many-to-many relationship with Neo4j relationship metadata (type + direction).
 */
export const relMany = <T>(entity: string | (() => T), options: Neo4jManyToManyOptions<T>) => {
  return ManyToMany(entity as any, { ...options, custom: { relationship: options.relationship } });
};

/**
 * Simple property helper for nodes.
 */
export const field = Property;
