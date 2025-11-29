import {
  type EntityKey,
  type EntityProperty,
  type PropertyOptions,
  ReferenceKind,
  type EntityMetadata,
} from '@mikro-orm/core';

export function Formula<Owner extends object>(formula: string | ((alias: string) => string), options: PropertyOptions<Owner> = {}) {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as any;
    meta.properties![context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.SCALAR,
      formula,
      ...options,
    } as EntityProperty<Owner>;
  };
}
