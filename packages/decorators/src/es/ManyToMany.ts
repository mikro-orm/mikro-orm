import {
  type EntityKey,
  type EntityProperty,
  type EntityName,
  type ManyToManyOptions,
  ReferenceKind,
  Utils,
  type Collection,
} from '@mikro-orm/core';
import { prepareMetadataContext, processDecoratorParameters } from '../utils.js';

export function ManyToMany<Target extends object, Owner extends object>(
  entity?: ManyToManyOptions<Owner, Target> | string | (() => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<ManyToManyOptions<Owner, Target>> = {},
) {
  return function (_: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) {
    const meta = prepareMetadataContext(context, ReferenceKind.MANY_TO_MANY);
    options = processDecoratorParameters<ManyToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] ??= {} as any;
    Utils.mergeConfig(meta.properties[context.name as EntityKey<Owner>], property, options);
  };
}
