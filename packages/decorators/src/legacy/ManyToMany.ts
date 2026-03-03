import {
  type EntityKey,
  type EntityProperty,
  type EntityName,
  type ManyToManyOptions,
  ReferenceKind,
} from '@mikro-orm/core';
import { processDecoratorParameters, validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

export function ManyToMany<Target extends object, Owner extends object>(
  entity: () => EntityName<Target>,
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<ManyToManyOptions<Owner, Target>>,
): (target: Owner, propertyName: keyof Owner) => void;
export function ManyToMany<Target extends object, Owner extends object>(entity: string, options?: any): never;
export function ManyToMany<Target extends object, Owner extends object>(
  options?: ManyToManyOptions<Owner, Target>,
): (target: Owner, propertyName: keyof Owner) => void;
export function ManyToMany<Target extends object, Owner extends object>(
  entity?: ManyToManyOptions<Owner, Target> | (() => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<ManyToManyOptions<Owner, Target>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = processDecoratorParameters<ManyToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = getMetadataFromDecorator(target.constructor as Owner);
    validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_MANY);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<Owner, Target>;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(
      meta.properties[propertyName as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
