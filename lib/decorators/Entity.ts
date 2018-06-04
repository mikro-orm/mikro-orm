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

    if (!meta.collection) {
      meta.collection = target.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
      meta.entity = target.name;
    }

    meta.constructorParams = Utils.getParamNames(target);

    return target;
  };
}

export type EntityOptions = {
  collection?: string;
  customRepository?: any;
}
