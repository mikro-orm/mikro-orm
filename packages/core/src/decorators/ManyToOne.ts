import type { ReferenceOptions } from './Property';
import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceType } from '../enums';
import type { AnyEntity, EntityName, EntityProperty } from '../typings';

export function ManyToOne<T, O>(
  entity: ManyToOneOptions<T, O> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T, O>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<ManyToOneOptions<T, O>>(entity) ? entity : { ...options, entity };
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor);
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceType.MANY_TO_ONE);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName] = Object.assign(meta.properties[propertyName] ?? {}, property, options);

    return Utils.propertyDecoratorReturnValue();
  };
}

export interface ManyToOneOptions<T, O> extends ReferenceOptions<T, O> {
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
  primary?: boolean;
  mapToPk?: boolean;
  joinColumn?: string;
  joinColumns?: string[];
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
}
