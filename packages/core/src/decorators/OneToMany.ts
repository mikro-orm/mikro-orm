import { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../entity';
import { QueryOrder } from '../enums';
import { EntityName, EntityProperty, AnyEntity } from '../typings';

export function createOneToDecorator<T, O>(
  entity?: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options?: Partial<OneToManyOptions<T, O>>,
  reference?: ReferenceType,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<OneToManyOptions<T, O>>(entity) ? entity : { ...options, entity, mappedBy };
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName);

    const prop = { name: propertyName, reference } as EntityProperty<T>;
    Object.assign(prop, options);
    meta.properties[propertyName] = prop;
  };
}

export function OneToMany<T, O>(
  entity: OneToManyOptions<T, O> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToManyOptions<T, O>> = {},
) {
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
  mappedBy?: (string & keyof T) | ((e: T) => any);
};
