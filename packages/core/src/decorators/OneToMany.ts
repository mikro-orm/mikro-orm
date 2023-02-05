import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import type { QueryOrderMap } from '../enums';
import { ReferenceKind } from '../enums';
import type { EntityName, EntityProperty, AnyEntity, EntityKey } from '../typings';

export function createOneToDecorator<T extends object, O>(
  entity: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy: (string & keyof T) | ((e: T) => any) | undefined,
  options: Partial<OneToManyOptions<T, O>>,
  kind: ReferenceKind,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<OneToManyOptions<T, O>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    MetadataValidator.validateSingleDecorator(meta, propertyName, kind);
    const property = { name: propertyName, kind } as EntityProperty<T>;
    meta.properties[propertyName as EntityKey<T>] = Object.assign(meta.properties[propertyName as EntityKey<T>] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export function OneToMany<T extends object, O>(
  entity: string | ((e?: any) => EntityName<T>),
  mappedBy: (string & keyof T) | ((e: T) => any),
  options?: Partial<OneToManyOptions<T, O>>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<T extends object, O>(
  options: OneToManyOptions<T, O>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<T extends object, O>(
  entity: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToManyOptions<T, O>> = {},
): (target: AnyEntity, propertyName: string) => void {
  return createOneToDecorator(entity, mappedBy, options, ReferenceKind.ONE_TO_MANY);
}

export type OneToManyOptions<T, O> = ReferenceOptions<T, O> & {
  entity?: string | (() => EntityName<T>);
  orphanRemoval?: boolean;
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  joinColumn?: string;
  joinColumns?: string[];
  inverseJoinColumn?: string;
  inverseJoinColumns?: string[];
  referenceColumnName?: string;
  mappedBy: (string & keyof T) | ((e: T) => any);
};
