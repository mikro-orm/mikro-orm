import { ReferenceOptions } from './Property';
import { EntityName, EntityProperty, IEntity, IEntityType } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';

export function ManyToMany<T extends IEntityType<T>>(
  entity: ManyToManyOptions<T> | string | (() => EntityName<T>),
  mappedBy?: (string & keyof T) | ((e: T) => any),
  options: Partial<ManyToManyOptions<T>> = {},
) {
  return function (target: IEntity, propertyName: string) {
    options = Utils.isObject<ManyToManyOptions<T>>(entity) ? entity : { ...options, entity, mappedBy };

    if (options.owner) {
      Utils.renameKey(options, 'mappedBy', 'inversedBy');
    }

    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);

    if (!options.entity) {
      throw new Error(`'@ManyToMany({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    if (!options.owner && !options.inversedBy && !options.mappedBy) {
      options.owner = true;
    }

    const property = { name: propertyName, reference: ReferenceType.MANY_TO_MANY, owner: !!options.inversedBy, cascade: [Cascade.PERSIST, Cascade.MERGE] } as EntityProperty<T>;
    meta.properties[propertyName] = Object.assign(property, options);
  };
}

export interface ManyToManyOptions<T extends IEntityType<T>> extends ReferenceOptions<T> {
  entity: string | (() => EntityName<T>);
  owner?: boolean;
  inversedBy?: (string & keyof T) | ((e: T) => any);
  mappedBy?: (string & keyof T) | ((e: T) => any);
  pivotTable?: string;
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
}
