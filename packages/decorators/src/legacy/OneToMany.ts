import {
  type EntityKey,
  type EntityName,
  type EntityProperty,
  MetadataStorage,
  MetadataValidator,
  type OneToManyOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';

export function OneToMany<Target extends object, Owner extends object>(
  entity: string | ((e?: any) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<OneToManyOptions<Owner, Target>>,
): (target: Owner, propertyName: string) => void;
export function OneToMany<Target extends object, Owner extends object>(
  options: OneToManyOptions<Owner, Target>,
): (target: Owner, propertyName: string) => void;
export function OneToMany<Target extends object, Owner extends object>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<OneToManyOptions<Owner, Target>> = {},
): (target: Owner, propertyName: string) => void {
  return function (target: Owner, propertyName: string) {
    options = Utils.processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as Target);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.ONE_TO_MANY);
    const property = { name: propertyName, kind: ReferenceKind.ONE_TO_MANY } as EntityProperty<Target>;
    meta.properties[propertyName as EntityKey<Target>] = Object.assign(meta.properties[propertyName as EntityKey<Target>] ?? {}, property, options);
  };
}
