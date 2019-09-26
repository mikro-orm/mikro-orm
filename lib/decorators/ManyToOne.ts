import { ReferenceOptions } from './Property';
import { EntityName, EntityProperty, IEntity, IEntityType } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';

export function ManyToOne<T extends IEntityType<T>>(
  entity: ManyToOneOptions<T> | string | ((e?: any) => EntityName<T>) = {},
  options: Partial<ManyToOneOptions<T>> = {},
) {
  return function (target: IEntity, propertyName: string) {
    options = Utils.isObject<ManyToOneOptions<T>>(entity) ? entity : { ...options, entity };

    if ((options as any).fk) {
      throw new Error(`@ManyToOne({ fk })' is deprecated, use 'inversedBy' instead in '${target.constructor.name}.${propertyName}'`);
    }

    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST, Cascade.MERGE] } as EntityProperty;
    const prop = Object.assign(property, options);
    Utils.defaultValue(prop, 'nullable', !prop.cascade.includes(Cascade.REMOVE) && !prop.cascade.includes(Cascade.ALL));
    meta.properties[propertyName] = prop;
  };
}

export interface ManyToOneOptions<T extends IEntityType<T>> extends ReferenceOptions<T> {
  entity?: string | (() => EntityName<T>);
  inversedBy?: (string & keyof T) | ((e: T) => any);
  wrappedReference?: boolean;
}
