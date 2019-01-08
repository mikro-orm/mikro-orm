import { BaseEntity, EntityProperty, ReferenceType } from '../BaseEntity';
import { getMetadataStorage } from '../MikroORM';
import { ObjectID } from '..';

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return function (target: BaseEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = getMetadataStorage(entity);

    const meta = storage[entity];
    const type = Reflect.getMetadata('design:type', target, propertyName);

    if (!options.type && type) {
      options.type = type.name;
    }

    options.name = propertyName;
    meta.properties = meta.properties || {};
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR }, options) as EntityProperty;

    // define magic id property getter/setter if the key is `_id: ObjectID`
    if (options.name === '_id' && options.type === 'ObjectID') {
      Object.defineProperty(target, 'id', {
        get(): string {
          return this._id ? this._id.toHexString() : null;
        },
        set(id: string) {
          this._id = id ? new ObjectID(id) : null;
        },
      });
    }
  };
}

export type PrimaryKeyOptions = {
  name?: string;
  type?: any;
  [prop: string]: any;
}

export type IPrimaryKey = number | string | ObjectID;
