import {
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type OneToManyOptions,
  type OneToOneOptions,
  type Ref,
  ReferenceKind,
} from '@mikro-orm/core';
import { prepareMetadataContext, processDecoratorParameters } from '../utils.js';

export function OneToOne<Target extends object, Owner extends object>(
  entity?: OneToOneOptions<Owner, Target> | string | ((e: Owner) => EntityName<Target> | EntityName[]),
  mappedByOrOptions?: (string & keyof Target) | ((e: Target) => any) | Partial<OneToOneOptions<Owner, Target>>,
  options: Partial<OneToOneOptions<Owner, Target>> = {},
) {
  const mappedBy = typeof mappedByOrOptions === 'object' ? mappedByOrOptions.mappedBy : mappedByOrOptions;
  options = typeof mappedByOrOptions === 'object' ? { ...mappedByOrOptions, ...options } : options;
  return function (_: unknown, context: ClassFieldDecoratorContext<Owner, Target | Ref<Target> | null | undefined>) {
    const meta = prepareMetadataContext(context, ReferenceKind.ONE_TO_ONE);
    options = processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.ONE_TO_ONE } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] = Object.assign(
      meta.properties[context.name as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
