import { type CheckConstraint, type EntityMetadata, type EntityCtor } from '@mikro-orm/core';
import { ensureOwnMetadataArray } from '../utils.js';

/** Defines a database check constraint on a property or entity class (TC39 decorator). */
export function Check<T>(
  options: CheckConstraint<T>,
): (value: unknown, context: ClassDecoratorContext<T & EntityCtor> | ClassFieldDecoratorContext<T>) => void {
  return function (
    value: unknown,
    context: ClassDecoratorContext<T & EntityCtor> | ClassFieldDecoratorContext<T>,
  ): void {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    const checks = ensureOwnMetadataArray(meta, 'checks');

    if (context.kind === 'field') {
      options.property ??= context.name as string;
    }

    checks.push(options);
  };
}
