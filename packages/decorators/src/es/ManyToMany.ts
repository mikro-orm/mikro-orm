import {
  type EntityKey,
  type EntityProperty,
  type EntityName,
  type ManyToManyOptions,
  MetadataValidator,
  ReferenceKind,
  Utils,
  type EntityMetadata, type Collection,
} from '@mikro-orm/core';

export function ManyToMany<Target extends object, Owner extends object>(
  entity?: ManyToManyOptions<Owner, Target> | string | (() => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<ManyToManyOptions<Owner, Target>> = {},
) {
  return function (_: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as Record<EntityKey<Owner>, EntityProperty<Owner>>;
    MetadataValidator.validateSingleDecorator(meta as any, context.name as string, ReferenceKind.MANY_TO_MANY);

    options = Utils.processDecoratorParameters<ManyToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] ??= {} as any;
    Utils.mergeConfig(meta.properties[context.name as EntityKey<Owner>], property, options);
  };
}
