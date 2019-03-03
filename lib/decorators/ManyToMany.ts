import { PropertyOptions } from './Property';
import { Cascade, EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../metadata/MetadataStorage';

export function ManyToMany(options: ManyToManyOptions): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const meta = MetadataStorage.getMetadata(entity);

    if (!options.entity) {
      throw new Error(`'@ManyToMany({ entity: string | Function })' is required in '${target.constructor.name}.${propertyName}'`);
    }

    const property = { name: propertyName, reference: ReferenceType.MANY_TO_MANY, owner: !!options.inversedBy, cascade: [Cascade.PERSIST] };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToManyOptions extends PropertyOptions {
  entity: () => string | Function;
  owner?: boolean;
  inversedBy?: string;
  mappedBy?: string;
  cascade?: Cascade[];
  pivotTable?: string;
}
