import { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType, QueryOrder } from '../enums';
import { EntityName, EntityProperty, AnyEntity } from '../typings';

export function createOneToDecorator<T, O>(
  entity: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy: (string & keyof T) | ((e: T) => any) | undefined,
  options: Partial<OneToManyOptions<T, O>>,
  reference: ReferenceType,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<OneToManyOptions<T, O>>(entity) ? entity : { ...options, entity, mappedBy };
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, reference);
    const property = { name: propertyName, reference } as EntityProperty<T>;
    meta.properties[propertyName] = Object.assign(meta.properties[propertyName] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export function OneToMany<T, O>(
  entity: string | ((e?: any) => EntityName<T>),
  mappedBy: (string & keyof T) | ((e: T) => any),
  options?: Partial<OneToManyOptions<T, O>>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<T, O>(
  options: OneToManyOptions<T, O>,
): (target: AnyEntity, propertyName: string) => void;
export function OneToMany<T, O>(
  entity: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToManyOptions<T, O>> = {},
): (target: AnyEntity, propertyName: string) => void {
  return createOneToDecorator(entity, mappedBy, options, ReferenceType.ONE_TO_MANY);
}

export type OneToManyOptions<T, O> = ReferenceOptions<T, O> & {
  entity?: string | (() => EntityName<T>);
  orphanRemoval?: boolean;
  orderBy?: { [field: string]: QueryOrder };
  joinColumn?: string;
  joinColumns?: string[];
  inverseJoinColumn?: string;
  inverseJoinColumns?: string[];
  referenceColumnName?: string;
  mappedBy: (string & keyof T) | ((e: T) => any);
};
