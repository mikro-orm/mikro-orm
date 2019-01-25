import { getMetadataStorage } from '../MikroORM';
import { EntityProperty, IEntity, ReferenceType } from '..';

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    const type = Reflect.getMetadata('design:type', target, propertyName);

    if (!options.type && type) {
      options.type = type.name;
    }

    options.name = propertyName;
    meta.properties = meta.properties || {};
    meta.primaryKey = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;
  };
}

export type PrimaryKeyOptions = {
  name?: string;
  type?: any;
  [prop: string]: any;
}

export type IPrimaryKey = number | string | any;
