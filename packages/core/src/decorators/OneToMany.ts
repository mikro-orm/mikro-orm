import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind, type QueryOrderMap } from '../enums';
import type { EntityName, EntityProperty, AnyEntity, EntityKey } from '../typings';

export function createOneToDecorator<Target, Owner>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any) | undefined,
  options: Partial<OneToManyOptions<Owner, Target>>,
  kind: ReferenceKind,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<OneToManyOptions<Owner, Target>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as any);
    MetadataValidator.validateSingleDecorator(meta, propertyName, kind);
    const property = { name: propertyName, kind } as EntityProperty<Target>;
    meta.properties[propertyName as EntityKey<Target>] = Object.assign(meta.properties[propertyName as EntityKey<Target>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export function OneToMany<Target, Owner>(
  entity: string | ((e?: any) => EntityName<Target>),
  mappedBy: (string & keyof Target) | ((e: Target) => any),
  options?: Partial<OneToManyOptions<Owner, Target>>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<Target, Owner>(
  options: OneToManyOptions<Owner, Target>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<Target, Owner>(
  entity: OneToManyOptions<Owner, Target> | string | ((e?: any) => EntityName<Target>),
  mappedBy?: (string & keyof Target) | ((e: Target) => any),
  options: Partial<OneToManyOptions<Owner, Target>> = {},
): (target: AnyEntity, propertyName: string) => void {
  return createOneToDecorator(entity, mappedBy, options, ReferenceKind.ONE_TO_MANY);
}

export type OneToManyOptions<Owner, Target> = ReferenceOptions<Owner, Target> & {
  entity?: string | (() => EntityName<Target>);
  orphanRemoval?: boolean;
  orderBy?: QueryOrderMap<Target> | QueryOrderMap<Target>[];
  joinColumn?: string;
  joinColumns?: string[];
  inverseJoinColumn?: string;
  inverseJoinColumns?: string[];
  referenceColumnName?: string;
  mappedBy: (string & keyof Target) | ((e: Target) => any);
};
