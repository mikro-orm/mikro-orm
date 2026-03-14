import { type CheckConstraint, type EntityMetadata } from '@mikro-orm/core';

/** Defines a database check constraint on a property (TC39 decorator). */
export function Check<T>(
  options: CheckConstraint<T>,
): (value: unknown, context: ClassFieldDecoratorContext<T>) => void {
  return function (value: unknown, context: ClassFieldDecoratorContext<T>): void {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    meta.checks ??= [];
    options.property ??= context.name as string;
    meta.checks.push(options);
  };
}
