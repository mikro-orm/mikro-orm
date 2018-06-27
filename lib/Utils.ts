import * as fastEqual from 'fast-deep-equal';
import * as clone from 'clone';
import { ObjectID } from 'bson';
import { BaseEntity } from './BaseEntity';
import { Collection } from './Collection';
import { getMetadataStorage } from './MikroORM';

export class Utils {

  private static readonly DIFF_IGNORED_KEYS = ['_id', '_initialized', 'createdAt', 'updatedAt'];

  static isObject(o: any): boolean {
    return typeof o === 'object' && o !== null;
  }

  static isArray(arr: any): boolean {
    return Object.prototype.toString.call(arr) === '[object Array]';
  }

  static isString(s: any): boolean {
    return typeof s === 'string';
  }

  static equals(a: any, b: any): boolean {
    return fastEqual(a, b);
  }

  static unique<T = string>(items: T[]): T[] {
    return [...new Set(items)];
  }

  static diff(a: any, b: any): any {
    const ret = {} as any;

    Object.keys(b).forEach(k => {
      if (Utils.DIFF_IGNORED_KEYS.includes(k)) {
        return;
      }

      if (a[k] === undefined && b !== undefined) {
        return ret[k] = b[k];
      }

      if (a[k] !== undefined && b === undefined) {
        return ret[k] = a[k];
      }

      if (Utils.equals(a[k], b[k])) {
        return;
      }

      if (Utils.isArray(a[k]) && Utils.isArray(b[k])) {
        return ret[k] = b[k]; // right-hand side has priority
      }

      ret[k] = b[k];
    });

    return ret;
  }

  /**
   * Process references first so we do not have to deal with cycles
   */
  static diffEntities(a: BaseEntity, b: BaseEntity): any {
    return Utils.diff(Utils.prepareEntity(a), Utils.prepareEntity(b));
  };

  static prepareEntity(e: BaseEntity): any {
    const metadata = getMetadataStorage();
    const meta = metadata[e.constructor.name];
    const ret = Utils.copy(e);

    // remove collections and references
    Object.keys(meta.properties).forEach(prop => {
      if (ret[prop] instanceof Collection || (ret[prop] instanceof BaseEntity && !ret[prop]._id)) {
        return delete ret[prop];
      }

      if (ret[prop] instanceof BaseEntity) {
        return ret[prop] = ret[prop].id;
      }
    });

    // remove unknown properties
    Object.keys(e).forEach(prop => {
      if (!meta.properties[prop]) {
        return delete ret[prop];
      }
    });

    return ret;
  }

  static copy(entity: any): any {
    return clone(entity);
  }

  static renameKey(payload: any, from: string, to: string): void {
    if (Utils.isObject(payload) && payload[from] && !payload[to]) {
      payload[to] = payload[from];
      delete payload[from];
    }
  }

  static convertObjectIds(payload: any): any {
    if (payload instanceof ObjectID) {
      return payload;
    }

    if (Utils.isString(payload) && payload.match(/^[0-9a-f]{24}$/i)) {
      return new ObjectID(payload);
    }

    if (Utils.isArray(payload)) {
      return payload.map((item: any) => Utils.convertObjectIds(item));
    }

    if (Utils.isObject(payload)) {
      Object.keys(payload).forEach(k => {
        payload[k] = Utils.convertObjectIds(payload[k]);
      });
    }

    return payload;
  }

}
