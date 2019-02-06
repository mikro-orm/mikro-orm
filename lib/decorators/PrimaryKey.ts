import { MetadataStorage } from '../metadata/MetadataStorage';
import { EntityProperty, IEntity, ReferenceType } from './Entity';

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const entity = target.constructor.name;
    const storage = MetadataStorage.getMetadata(entity);

    const meta = storage[entity];
    options.name = propertyName;
    meta.properties = meta.properties || {};
    meta.primaryKey = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR, primary: true }, options) as EntityProperty;
  };
}

export type PrimaryKeyOptions = {
  name?: string;
  type?: any;
  [prop: string]: any;
}

export type IPrimaryKey = number | string | { toString?(): string, toHexString?(): string };
