import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import type { EntityName, EntityProperty, AnyEntity } from '../typings';
import { ReferenceKind, type QueryOrderMap } from '../enums';

export function ManyToMany<T, O>(
  entity?: ManyToManyOptions<T, O> | string | (() => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<ManyToManyOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.processDecoratorParameters<ManyToManyOptions<T, O>>({ entity, mappedBy, options });
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.MANY_TO_MANY);
    const property = { name: propertyName, kind: ReferenceKind.MANY_TO_MANY } as EntityProperty<T>;
    meta.properties[propertyName] = Object.assign(meta.properties[propertyName] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToManyOptions<T, O> extends ReferenceOptions<T, O> {
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  mappedBy?: (string & keyof T) | ((e: T) => any);
  orderBy?: QueryOrderMap<T> | QueryOrderMap<T>[];
  fixedOrder?: boolean;
  fixedOrderColumn?: string;
  pivotTable?: string;
  pivotEntity?: string | (() => EntityName<any>);
  joinColumn?: string;
  joinColumns?: string[];
  inverseJoinColumn?: string;
  inverseJoinColumns?: string[];
  referenceColumnName?: string;
  referencedColumnNames?: string[];
}
