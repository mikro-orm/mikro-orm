import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { EntityValidator, ReferenceType } from '../entity';
import { AnyEntity, EntityName, EntityProperty } from '../typings';

export function ManyToOne<T, O>(
  entity: ManyToOneOptions<T, O> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<ManyToOneOptions<T, O>>(entity) ? entity : { ...options, entity };
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    EntityValidator.validateSingleDecorator(meta, propertyName);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName] = Object.assign(property, options);
  };
}

export interface ManyToOneOptions<T, O> extends ReferenceOptions<T, O> {
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
  primary?: boolean;
  joinColumn?: string;
  joinColumns?: string[];
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
}
