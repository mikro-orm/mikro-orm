import { MetadataStorage } from '../metadata';
import { AnyEntity, Dictionary } from '../typings';
import { Utils } from '../utils';

function createDecorator(options: IndexOptions | UniqueOptions, unique: boolean): Function {
  return function (target: AnyEntity, propertyName?: string) {
    const entityName = propertyName ? target.constructor.name : target.name;
    const meta = MetadataStorage.getMetadata(entityName);
    Utils.lookupPathFromDecorator(meta);
    options.properties = options.properties || propertyName;
    const key = unique ? 'uniques' : 'indexes';
    meta[key].push(options as Required<IndexOptions | UniqueOptions>);
  };
}

export function Index(options: IndexOptions = {}): Function {
  return createDecorator(options, false);
}

export function Unique(options: UniqueOptions = {}): Function {
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
