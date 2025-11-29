import {
  type EnumOptions,
  ReferenceKind,
  type AnyEntity,
  type Dictionary,
  type EntityProperty,
  type EntityMetadata,
  type EntityKey,
} from '@mikro-orm/core';

export function Enum<Owner extends object>(options: EnumOptions<AnyEntity> | (() => Dictionary) = {}) {
  return function (target: unknown, context: ClassFieldDecoratorContext<Owner>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as any;
    options = options instanceof Function ? { items: options } : options;
    meta.properties![context.name as EntityKey<Owner>] = {
      name: context.name,
      kind: ReferenceKind.SCALAR,
      enum: true,
      ...options,
    } as EntityProperty<Owner>;
  };
}
