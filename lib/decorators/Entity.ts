import { merge } from 'lodash';
import { getMetadataStorage } from '../MikroORM';
import { Utils } from '../Utils';

export function Entity(options: EntityOptions = {}): Function {
  return function <T extends { new(...args: any[]): {} }>(target: T) {
    const storage = getMetadataStorage(target.name);
    const meta = storage[target.name];

    if (options) {
      merge(meta, options);
    }

    meta.name = target.name;
    meta.constructorParams = Utils.getParamNames(target);

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: any;
}
