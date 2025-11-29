import {
  type EntityKey,
  type EntityName,
  type EntityProperty,
  MetadataStorage,
  MetadataValidator,
  type OneToManyOptions,
  type OneToOneOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export function OneToOne<Target, Owner>(
  entity?: OneToOneOptions<Owner, Target> | string | ((e: Owner) => EntityName<Target>),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target>>,
  options: Partial<OneToOneOptions<Owner, Target>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return function (target: Owner, propertyName: string) {
    options = Utils.processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator((target as any).constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.ONE_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.ONE_TO_ONE } as EntityProperty<Target>;
    meta.properties[propertyName as EntityKey<Target>] = Object.assign(meta.properties[propertyName as EntityKey<Target>] ?? {}, property, options);
  };
}
