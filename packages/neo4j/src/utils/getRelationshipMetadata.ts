import { Property } from '@mikro-orm/core';
import { relationshipMetadata } from '../stores/relationshipMetadata';
import type { RelationshipOptions } from '../decorators/Rel';

export function getRelationshipMetadata(
  entityClass: Function,
  propertyName: string,
): RelationshipOptions | undefined {
  const props = relationshipMetadata.get(entityClass);
  return props?.get(propertyName);
}
/**
 * Simple property helper for nodes.
 */

export const Field = Property;
