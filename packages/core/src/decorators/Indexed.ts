import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils/Utils';

function createDecorator(options: IndexOptions | UniqueOptions, unique: boolean) {
  return function (target: AnyEntity, propertyName?: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(propertyName ? target.constructor : target);
    options.properties = options.properties || propertyName;
    const key = unique ? 'uniques' : 'indexes';
    meta[key].push(options as Required<IndexOptions | UniqueOptions>);

    if (!propertyName) {
      return target;
    }

    return Utils.propertyDecoratorReturnValue();
  };
}

export function Index(options: IndexOptions = {}) {
  return createDecorator(options, false);
}

export function Unique(options: UniqueOptions = {}) {
  return createDecorator(options, true);
}

export interface UniqueOptions {
  name?: string;
  properties?: string | string[];
  options?: Dictionary;
}

export interface IndexOptions extends UniqueOptions {
  type?: string;
}
