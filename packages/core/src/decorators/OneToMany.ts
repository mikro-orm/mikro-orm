import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { EntityValidator, ReferenceType } from '../entity';
import { QueryOrder } from '../enums';
import { EntityName, EntityProperty, AnyEntity } from '../typings';

export function createOneToDecorator<T extends AnyEntity<T>>(
  entity?: OneToManyOptions<T> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options?: Partial<OneToManyOptions<T>>,
  reference?: ReferenceType,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<OneToManyOptions<T>>(entity) ? entity : { ...options, entity, mappedBy };
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    EntityValidator.validateSingleDecorator(meta, propertyName);
    Utils.lookupPathFromDecorator(meta);

    const prop = { name: propertyName, reference } as EntityProperty<T>;
    Object.assign(prop, options);
    meta.properties[propertyName] = prop;
  };
}

export function OneToMany<T extends AnyEntity<T>>(
  entity: OneToManyOptions<T> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToManyOptions<T>> = {},
) {
  return createOneToDecorator(entity, mappedBy, options, ReferenceType.ONE_TO_MANY);
}

export type OneToManyOptions<T extends AnyEntity<T>> = ReferenceOptions<T> & {
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
