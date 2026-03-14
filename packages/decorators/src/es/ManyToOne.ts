import {
  ReferenceKind,
  type ManyToOneOptions,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  Utils,
  type Ref,
} from '@mikro-orm/core';
import { prepareMetadataContext, processDecoratorParameters } from '../utils.js';

/** Defines a many-to-one relationship (TC39 decorator). */
export function ManyToOne<Target extends object, Owner extends object>(
  entity: ManyToOneOptions<Owner, Target> | ((e?: Owner) => EntityName<Target> | EntityName[]) = {},
  options: Partial<ManyToOneOptions<Owner, Target>> = {},
): (_: unknown, context: ClassFieldDecoratorContext<Owner, Target | undefined | null | Ref<Target>>) => void {
  return function (
    _: unknown,
    context: ClassFieldDecoratorContext<Owner, Target | undefined | null | Ref<Target>>,
  ): void {
    const meta = prepareMetadataContext(context, ReferenceKind.MANY_TO_ONE);
    options = processDecoratorParameters<ManyToOneOptions<Owner, Target>>({ entity, options });
    const property = { name: context.name, kind: ReferenceKind.MANY_TO_ONE } as EntityProperty<Target>;
    meta.properties[context.name as EntityKey<Owner>] = Utils.mergeConfig(
      meta.properties[context.name as EntityKey<Owner>] ?? {},
      property,
      options,
    );
  };
}
