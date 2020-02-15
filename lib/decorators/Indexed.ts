import { MetadataStorage } from '../metadata';
import { AnyEntity } from '../typings';
import { Utils } from '../utils';

function createDecorator(options: IndexOptions | UniqueOptions = {}, unique: boolean): Function {
  return function (target: AnyEntity, propertyName?: string) {
    const meta = MetadataStorage.getMetadata(target.constructor.name);
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
}

export interface IndexOptions extends UniqueOptions {
  type?: string;
}
