import { ReferenceKind } from '../enums.js';
import type { EntityProperty } from '../typings.js';

/** @internal Whether a property explicitly requests a physical, hydratable column in a write result. */
export function isReturningProperty(prop: EntityProperty): boolean {
  return (
    !!prop.returning &&
    prop.persist !== false &&
    prop.hydrate !== false &&
    !prop.formula &&
    !(prop.getter && !prop.setter) &&
    prop.fieldNames?.length > 0 &&
    (prop.kind === ReferenceKind.SCALAR ||
      prop.kind === ReferenceKind.MANY_TO_ONE ||
      (prop.kind === ReferenceKind.ONE_TO_ONE && !!prop.owner) ||
      (prop.kind === ReferenceKind.EMBEDDED && !!prop.object))
  );
}
