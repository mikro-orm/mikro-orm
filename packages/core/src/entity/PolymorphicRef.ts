import { Utils } from '../utils/Utils.js';

/**
 * Wrapper class for polymorphic relation reference data.
 * Holds the discriminator value (type identifier) and the primary key value(s).
 * Used internally to track polymorphic FK values before hydration.
 */
export class PolymorphicRef {
  constructor(
    public readonly discriminator: string,
    public id: unknown,
  ) {}

  /** Returns `[discriminator, ...idValues]` tuple suitable for column-level expansion. */
  toTuple(): unknown[] {
    return [this.discriminator, ...Utils.asArray(this.id)];
  }
}
