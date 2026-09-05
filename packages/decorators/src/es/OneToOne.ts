import {
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type OneToOneOptions,
  type Primary,
  type Ref,
  ReferenceKind,
} from '@mikro-orm/core';
import { prepareMetadataContext, processDecoratorParameters } from '../utils.js';

/** Defines a one-to-one relationship (TC39 decorator). */
export function OneToOne<Target extends object, Owner extends object, Through extends object = Target>(
  entity?: OneToOneOptions<Owner, Target, Through> | string | ((e: Owner) => EntityName<Target> | EntityName[]),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target, Through>>,
  options: Partial<OneToOneOptions<Owner, Target, Through>> = {},
): (
  _: unknown,
  context: ClassFieldDecoratorContext<Owner, Target | Primary<Target> | Ref<Target> | null | undefined>,
) => void {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return function (
    _: unknown,
    context: ClassFieldDecoratorContext<Owner, Target | Primary<Target> | Ref<Target> | null | undefined>,
  ) {
    const meta = prepareMetadataContext(context, ReferenceKind.ONE_TO_ONE);
    options = processDecoratorParameters<OneToOneOptions<Owner, Target, Through>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.ONE_TO_ONE } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] = Object.assign(
      meta.properties[context.name as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
