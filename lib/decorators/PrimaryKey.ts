import { MetadataStorage } from '../metadata';
import { ReferenceType } from '../entity';
import { EntityProperty, IEntity, PropertyOptions } from '.';
import { Utils } from '../utils';

export function PrimaryKey(options: PrimaryKeyOptions = {}): Function {
  return function (target: IEntity, propertyName: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
    options.name = propertyName;
    meta.primaryKey = propertyName;
    meta.properties[propertyName] = Object.assign({ reference: ReferenceType.SCALAR, primary: true }, options) as EntityProperty;
    Utils.lookupPathFromDecorator(meta);
  };
}

export interface PrimaryKeyOptions extends PropertyOptions {
  name?: string;
  type?: any;
}

export type IPrimaryKey = number | string | { toString?(): string, toHexString?(): string };
