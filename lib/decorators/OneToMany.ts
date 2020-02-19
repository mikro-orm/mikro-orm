import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../entity';
import { QueryOrder } from '../query';
import { EntityName, EntityProperty, AnyEntity } from '../typings';

export function OneToMany<T extends AnyEntity<T>>(
  entity: OneToManyOptions<T> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<OneToManyOptions<T>> = {},
) {
  return createOneToDecorator(entity, mappedBy, options, ReferenceType.ONE_TO_MANY);
}

export function createOneToDecorator<T extends AnyEntity<T>>(
  entity?: OneToManyOptions<T> | string | ((e?: any) => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options?: Partial<OneToManyOptions<T>>,
  reference?: ReferenceType,
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<OneToManyOptions<T>>(entity) ? entity : { ...options, entity, mappedBy };
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);

    if (reference === ReferenceType.ONE_TO_MANY) {
      if ((options as any).fk) {
        throw new Error(`@OneToMany({ fk })' is deprecated, use 'mappedBy' instead in '${target.constructor.name}.${propertyName}'`);
      }
    }

    const prop = { name: propertyName, reference } as EntityProperty<T>;
    Object.assign(prop, options);
    meta.properties[propertyName] = prop;
  };
}

export type OneToManyOptions<T extends AnyEntity<T>> = ReferenceOptions<T> & {
  entity?: string | (() => EntityName<T>);
  orphanRemoval?: boolean;
  orderBy?: { [field: string]: QueryOrder };
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
  mappedBy?: (string & keyof T) | ((e: T) => any);
};
