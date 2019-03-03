import { PropertyOptions } from './Property';
import { Cascade, EntityProperty, IEntity, ReferenceType } from './Entity';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { Utils } from '../utils/Utils';

export function ManyToOne(options: ManyToOneOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST] };
    meta.properties[propertyName] = Object.assign(property, options) as EntityProperty;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity?: () => string | Function,
  fk?: string;
  cascade?: Cascade[];
}
