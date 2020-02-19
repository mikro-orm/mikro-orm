import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../entity';
import { EntityName, EntityProperty, AnyEntity } from '../typings';
import { QueryOrder } from '../query';

export function ManyToMany<T extends AnyEntity<T>>(
  entity?: ManyToManyOptions<T> | string | (() => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<ManyToManyOptions<T>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<ManyToManyOptions<T>>(entity) ? entity : { ...options, entity, mappedBy };
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_MANY } as EntityProperty<T>;
    meta.properties[propertyName] = Object.assign(property, options);
  };
}

export interface ManyToManyOptions<T extends AnyEntity<T>> extends ReferenceOptions<T> {
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  mappedBy?: (string & keyof T) | ((e: T) => any);
  orderBy?: { [field: string]: QueryOrder };
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
}
