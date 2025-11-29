import { type CheckConstraint, type EntityMetadata } from '@mikro-orm/core';

export function Check<T>(options: CheckConstraint<T>) {
  return function (value: unknown, context: ClassFieldDecoratorContext<T>) {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    meta.checks ??= [];
    options.property ??= context.name as string;
    meta.checks.push(options);
  };
}
