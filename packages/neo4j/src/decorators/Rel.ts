import type { AnyEntity } from '@mikro-orm/core';
import { relationshipMetadata } from '../stores/relationshipMetadata';

export type RelationshipDirection = 'IN' | 'OUT';

export interface RelationshipOptions {
  type: string;
  direction: RelationshipDirection;
}

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
