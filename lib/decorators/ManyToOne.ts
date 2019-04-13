import { PropertyOptions } from './Property';
import { EntityProperty, IEntity } from './Entity';
import { MetadataStorage } from '../metadata';
import { Utils } from '../utils';
import { Cascade, ReferenceType } from '../entity';

export function ManyToOne(options: ManyToOneOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    Utils.lookupPathFromDecorator(meta);
    const property = { name: propertyName, reference: ReferenceType.MANY_TO_ONE, cascade: [Cascade.PERSIST, Cascade.MERGE] };
    const prop = Object.assign(property, options) as EntityProperty;
    prop.nullable = !prop.cascade.includes(Cascade.REMOVE) && !prop.cascade.includes(Cascade.ALL);
    Utils.renameKey(prop, 'fk', 'inversedBy');
    meta.properties[propertyName] = prop;
  };
}

export interface ManyToOneOptions extends PropertyOptions {
  entity?: () => string | Function,
  fk?: string;
  inversedBy?: string;
  cascade?: Cascade[];
}
