import {
  type Collection,
  type EntityKey, type EntityMetadata,
  type EntityName,
  type EntityProperty,
  MetadataStorage,
  MetadataValidator,
  type OneToManyOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export function OneToMany<Target extends object, Owner extends object>(
  entity: string | ((e?: Owner) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<OneToManyOptions<Owner, Target>>,
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void;
export function OneToMany<Target extends object, Owner extends object>(
  options: OneToManyOptions<Owner, Target>,
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void;
export function OneToMany<Target extends object, Owner extends object>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<OneToManyOptions<Owner, Target>> = {},
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) {
    const meta = context.metadata as Partial<EntityMetadata<Owner>>;
    meta.properties ??= {} as Record<EntityKey<Owner>, EntityProperty<Owner>>;
    MetadataValidator.validateSingleDecorator(meta as any, context.name as string, ReferenceKind.ONE_TO_MANY);

    options = Utils.processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.ONE_TO_MANY } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] ??= {} as any;
    Utils.mergeConfig(meta.properties[context.name as EntityKey<Owner>], property, options);
  };
}
