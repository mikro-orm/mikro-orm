import { MetadataStorage } from '../metadata/MetadataStorage';
import { EntityProperty, IEntity } from './Entity';
import { Utils } from '..';
import { ReferenceType } from '../entity/enums';

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options.name = propertyName;
    meta.primaryKey = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR, primary: true }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export type PrimaryKeyOptions = {
  name?: string;
  type?: any;
  [prop: string]: any;
}

export type IPrimaryKey = number | string | { toString?(): string, toHexString?(): string };
