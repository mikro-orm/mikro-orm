import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';
import { QueryOrder } from '../query';
import { EntityName, EntityProperty, AnyEntity } from '../types';

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

    const prop = {
      name: propertyName,
      reference,
      cascade: [Cascade.PERSIST, Cascade.MERGE],
    } as EntityProperty<T>;
    Object.assign(prop, options);

    if (reference === ReferenceType.ONE_TO_ONE) {
      Utils.defaultValue(prop, 'nullable', !prop.cascade.includes(Cascade.REMOVE) && !prop.cascade.includes(Cascade.ALL));
      prop.owner = prop.owner || !!prop.inversedBy || !prop.mappedBy;
      prop.unique = prop.owner;

      if (prop.owner && options.mappedBy) {
        Utils.renameKey(prop, 'mappedBy', 'inversedBy');
      }
    }

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
