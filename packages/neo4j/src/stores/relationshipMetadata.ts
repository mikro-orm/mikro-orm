import type { RelationshipOptions } from '../decorators/Rel';

// Store relationship metadata separate from MikroORM's metadata system
export const relationshipMetadata = new WeakMap<
  Function,
  Map<string, RelationshipOptions>
>();
/**
 * Get relationship options for a property.
 * Used internally by the Neo4j driver.
 * @internal
 */
