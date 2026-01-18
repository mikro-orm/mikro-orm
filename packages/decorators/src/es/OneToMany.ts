import {
  type Collection,
  type EntityKey,
  type EntityName,
  type EntityProperty,
  type OneToManyOptions,
  ReferenceKind,
  Utils,
} from '@mikro-orm/core';
import { prepareMetadataContext, processDecoratorParameters } from '../utils.js';

export function OneToMany<Target extends object, Owner extends object>(
  entity: string | ((e?: Owner) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<OneToManyOptions<Owner, Target>>,
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void;
export function OneToMany<Target extends object, Owner extends object>(
  options: OneToManyOptions<Owner, Target>,
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void;
export function OneToMany<Target extends object, Owner extends object>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<OneToManyOptions<Owner, Target>> = {},
): (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) => void {
  return function (value: unknown, context: ClassFieldDecoratorContext<Owner, Collection<Target> | undefined>) {
    const meta = prepareMetadataContext(context, ReferenceKind.ONE_TO_MANY);
    options = processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const property = { name: context.name, kind: ReferenceKind.ONE_TO_MANY } as EntityProperty<Owner>;
    meta.properties[context.name as EntityKey<Owner>] ??= {} as any;
    Utils.mergeConfig(meta.properties[context.name as EntityKey<Owner>], property, options);
  };
}
