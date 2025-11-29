import {
  type EntityKey,
  type EntityProperty,
  type EntityName,
  type ManyToManyOptions,
  MetadataStorage,
  MetadataValidator,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export function ManyToMany<Target extends object, Owner extends object>(
  entity?: ManyToManyOptions<Owner, Target> | string | (() => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<ManyToManyOptions<Owner, Target>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = Utils.processDecoratorParameters<ManyToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as Owner);
    MetadataValidator.validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_MANY);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<Owner, Target>;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(meta.properties[propertyName as EntityKey<Owner>] ?? {}, property, options);
  };
}
