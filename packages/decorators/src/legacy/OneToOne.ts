import {
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type OneToOneOptions,
  ReferenceKind,
} from '@mikro-orm/core';
import { processDecoratorParameters, validateSingleDecorator, getMetadataFromDecorator } from '../utils.js';

/** Defines a one-to-one relationship (legacy TypeScript decorator). */
export function OneToOne<Target, Owner, Through = Target>(
  entity: (e: Owner) => EntityName<Target> | EntityName[],
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target, Through>>,
  options?: Partial<OneToOneOptions<Owner, Target, Through>>,
): (target: Owner, propertyName: string) => void;
export function OneToOne<Target, Owner, Through = Target>(
  entity?: OneToOneOptions<Owner, Target, Through>,
): (target: Owner, propertyName: string) => void;
export function OneToOne<Target, Owner, Through = Target>(
  entity?: OneToOneOptions<Owner, Target, Through> | ((e: Owner) => EntityName<Target> | EntityName[]),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target, Through>>,
  options: Partial<OneToOneOptions<Owner, Target, Through>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return function (target: Owner, propertyName: string) {
    options = processDecoratorParameters<OneToOneOptions<Owner, Target, Through>>({ entity, mappedBy, options });
    const meta = getMetadataFromDecorator((target as any).constructor);
    validateSingleDecorator(meta, propertyName, ReferenceKind.ONE_TO_ONE);
    const property = { name: propertyName, kind: ReferenceKind.ONE_TO_ONE } as EntityProperty<Target>;
    meta.properties[propertyName as EntityKey<Target>] = Object.assign(
      meta.properties[propertyName as EntityKey<Target>] ?? {},
      property,
      options,
    );
  };
}
