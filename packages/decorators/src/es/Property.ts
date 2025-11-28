import {
  type Dictionary,
  type EntityKey, EntityMetadata,
  type EntityProperty,
  MetadataStorage,
  MetadataValidator,
  type PropertyOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export function Property<T extends object>(options: PropertyOptions<T> = {}) {
  return function (_: unknown, context: ClassFieldDecoratorContext<T> | ClassMethodDecoratorContext<T>) {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    meta.properties ??= {} as any;
    MetadataValidator.validateSingleDecorator(meta as any, context.name as string, ReferenceKind.SCALAR);

    const { check, ...opts } = options;
    const prop = { kind: ReferenceKind.SCALAR, ...opts } as EntityProperty<T>;
    const name = options.name ?? context.name;
    meta.checks ??= [];

    if (context.name !== name) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    if (context.kind === 'field') {
      prop.name = context.name as EntityKey<T>;
      prop.getter = false;
      prop.setter = false;
    } else if (context.kind === 'method') {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = context.name as keyof T;
      prop.name = name as EntityKey<T>;
    }

    if (check) {
      meta.checks.push({ property: prop.name, expression: check });
    }

    meta.properties![prop.name] = prop;
  };
}
