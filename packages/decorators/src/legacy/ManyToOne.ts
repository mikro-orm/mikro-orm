import {
  ReferenceKind,
  type ManyToOneOptions,
  type EntityKey,
  type EntityName,
  type EntityProperty,
} from '@mikro-orm/core';
import { processDecoratorParameters, validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

/** Defines a many-to-one relationship (legacy TypeScript decorator). */
export function ManyToOne<Target extends object, Owner extends object, Through extends object = Target>(
  entity: (e?: any) => EntityName<Target> | EntityName[],
  options?: Partial<ManyToOneOptions<Owner, Target, Through>>,
): (target: Owner, propertyName: string) => void;
export function ManyToOne<Target extends object, Owner extends object>(entity: string, options?: any): never;
export function ManyToOne<Target extends object, Owner extends object, Through extends object = Target>(
  options?: ManyToOneOptions<Owner, Target, Through>,
): (target: Owner, propertyName: string) => void;
export function ManyToOne<Target extends object, Owner extends object, Through extends object = Target>(
  entity: ManyToOneOptions<Owner, Target, Through> | ((e?: any) => EntityName<Target> | EntityName[]) = {},
  options: Partial<ManyToOneOptions<Owner, Target, Through>> = {},
) {
  return function (target: Owner, propertyName: keyof Owner) {
    options = processDecoratorParameters<ManyToOneOptions<Owner, Target, Through>>({ entity, options });
    const meta = getMetadataFromDecorator(target.constructor as Owner);
    validateSingleDecorator(meta, propertyName as string, ReferenceKind.MANY_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName as EntityKey<Owner>] = Object.assign(
      meta.properties[propertyName as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
