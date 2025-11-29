import {
  ReferenceKind,
  type ManyToOneOptions,
  MetadataStorage,
  MetadataValidator,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  Utils,
} from '@mikro-orm/core';

export function ManyToOne<Target extends object, Owner extends object>(
  entity: ManyToOneOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>) = {},
  options: Partial<ManyToOneOptions<Owner, Target>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = Utils.processDecoratorParameters<ManyToOneOptions<Owner, Target>>({ entity, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as Owner);
    MetadataValidator.validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(meta.properties[propertyName as EntityKey<Owner>] ?? {}, property, options);
  };
}
