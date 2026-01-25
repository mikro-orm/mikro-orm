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

  /**
   * Type guard to check if a value is a PolymorphicRef instance.
   */
  static is(value: unknown): value is PolymorphicRef {
    return value instanceof PolymorphicRef;
  }

}
