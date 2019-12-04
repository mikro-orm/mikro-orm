import { ReferenceOptions } from './Property';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';
import { EntityName, EntityProperty, AnyEntity } from '../types';

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
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST, Cascade.MERGE] } as EntityProperty;
    const prop = Object.assign(property, options);
    Utils.defaultValue(prop, 'nullable', prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL));
    meta.properties[propertyName] = prop;
  };
}

export interface ManyToOneOptions<T extends AnyEntity<T>> extends ReferenceOptions<T> {
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
  primary?: boolean;
}
