import {
  ReferenceKind,
  type PrimaryKeyOptions,
  type SerializedPrimaryKeyOptions,
  type EntityProperty,
  EntityMetadata,
  MetadataValidator, type EntityKey,
} from '@mikro-orm/core';

function createDecorator<T extends object>(options: PrimaryKeyOptions<T> | SerializedPrimaryKeyOptions<T>, serialized: boolean) {
  return function (value: unknown, context: ClassFieldDecoratorContext<T>) {
    const meta = context.metadata as Partial<EntityMetadata<T>>;
    meta.properties ??= {} as any;
    MetadataValidator.validateSingleDecorator(meta as any, context.name as string, ReferenceKind.SCALAR);

    const key = serialized ? 'serializedPrimaryKey' : 'primary';
    options[key] = true;
    meta.properties![context.name as EntityKey<T>] = { name: context.name, kind: ReferenceKind.SCALAR, ...options } as EntityProperty<T>;
  };
}

export function PrimaryKey<T extends object>(options: PrimaryKeyOptions<T> = {}) {
  return createDecorator(options, false);
}

export function SerializedPrimaryKey<T extends object>(options: SerializedPrimaryKeyOptions<T> = {}) {
  return createDecorator(options, true);
}
