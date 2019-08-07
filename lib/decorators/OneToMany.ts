import { PropertyOptions } from './Property';
import { EntityProperty, IEntity } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';
import { QueryOrder } from '../query';

export function OneToMany(options: OneToManyOptions): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);

    if (!options.entity) {
      throw new Error(`'@OneToMany({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    if ((options as any).fk) {
      throw new Error(`@OneToMany({ fk })' is deprecated, use 'mappedBy' instead in '${target.constructor.name}.${propertyName}'`);
    }

    const prop = { name: propertyName, reference: ReferenceType.ONE_TO_MANY, cascade: [Cascade.PERSIST, Cascade.MERGE] };
    Object.assign(prop, options);
    meta.properties[propertyName] = prop as EntityProperty;
  };
}

export type OneToManyOptions = PropertyOptions & {
  entity: () => string | Function;
  cascade?: Cascade[];
  orphanRemoval?: boolean;
  orderBy?: { [field: string]: QueryOrder },
  joinColumn?: string;
  inverseJoinColumn?: string;
  referenceColumnName?: string;
  mappedBy: string;
};
