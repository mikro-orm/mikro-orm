import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { EntityValidator, ReferenceType } from '../entity';
import { AnyEntity, EntityName, EntityProperty } from '../typings';

export function ManyToOne<T extends AnyEntity<T>>(
  entity: ManyToOneOptions<T> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T>> = {},
) {
  return function (target: AnyEntity, propertyName: string) {
    options = Utils.isObject<ManyToOneOptions<T>>(entity) ? entity : { ...options, entity };

    if ((options as any).fk) {
      throw new Error(`@ManyToOne({ fk })' is deprecated, use 'inversedBy' instead in '${target.constructor.name}.${propertyName}'`);
    }

    const meta = MetadataStorage.getMetadata(target.constructor.name);
    EntityValidator.validateSingleDecorator(meta, propertyName);
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE } as EntityProperty;
    meta.properties[propertyName] = Object.assign(property, options);
  };
}

export interface ManyToOneOptions<T extends AnyEntity<T>> extends ReferenceOptions<T> {
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
  primary?: boolean;
  joinColumn?: string;
  joinColumns?: string[];
  onDelete?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
  onUpdateIntegrity?: 'cascade' | 'no action' | 'set null' | 'set default' | string;
}
