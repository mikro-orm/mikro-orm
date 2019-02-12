import * as fastEqual from 'fast-deep-equal';
import * as clone from 'clone';
import { IEntity, IPrimaryKey } from '..';
import { Collection } from '../Collection';
import { MetadataStorage } from '../metadata/MetadataStorage';
import { IEntityType } from '../decorators/Entity';

export class Utils {

  static isObject(o: any): boolean {
    return typeof o === 'object' && o !== null;
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
      if (Utils.equals(a[k], b[k])) {
        return;
      }

      ret[k] = b[k];
    });

    return ret;
  }

  static diffEntities(a: IEntity, b: IEntity): any {
    return Utils.diff(Utils.prepareEntity(a), Utils.prepareEntity(b));
  }

  static prepareEntity<T>(e: IEntityType<T>): any {
    const metadata = MetadataStorage.getMetadata();
    const meta = metadata[e.constructor.name];
    const ret = Utils.copy(e);
    delete ret.__initialized;

    // remove collections and references
    Object.values(meta.properties).forEach(prop => {
      const pk = () => metadata[prop.type].primaryKey;
      const name = prop.name as keyof T;

      if (e[name] as any instanceof Collection || (Utils.isEntity(e[name]) && !e[name][pk()])) {
        return delete ret[name];
      }

      if (Utils.isEntity(e[name])) {
        return ret[prop.name] = ret[prop.name][pk()];
      }
    });

    // remove unknown properties
    Object.keys(e).forEach(prop => {
      if (!meta.properties[prop]) {
        delete ret[prop];
      }
    });

    return ret;
  }

  static copy(entity: any): any {
    return clone(entity);
  }

  static renameKey(payload: any, from: string, to: string): void {
    if (Utils.isObject(payload) && from in payload && !(to in payload)) {
      payload[to] = payload[from];
      delete payload[from];
    }
  }

  static getParamNames(func: Function | string): string[] {
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    const ARGUMENT_NAMES = /([^\s,]+)/g;
    const fnStr = func.toString().replace(STRIP_COMMENTS, '');
    const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

    if (result === null) {
      return [];
    }

    // handle class with no constructor
    if (result.length > 0 && result[0] === 'class') {
      return [];
    }

    // strip default values
    for (let i = 0; i < result.length; i++) {
      if (result[i] === '=') {
        result.splice(i, 2);
      } else if (result[i].includes('=')) {
        result[i] = (result[i] as string).split('=')[0];
        result.splice(i + 1, 1);
      }
    }

    return result;
  }

  static isPrimaryKey(key: any): boolean {
    return typeof key === 'string' || typeof key === 'number' || Utils.isObjectID(key);
  }

  static extractPK(data: any): IPrimaryKey | null {
    if (Utils.isPrimaryKey(data)) {
      return data;
    }

    if (Utils.isObject(data)) {
      return data.id || data._id || null;
    }

    return null;
  }

  static isEntity(data: any): boolean {
    return Utils.isObject(data) && !!data.__entity;
  }

  static isObjectID(key: any) {
    return Utils.isObject(key) && key.constructor.name === 'ObjectID';
  }

  static className(classOrName: string | Function): string {
    if (typeof classOrName === 'string') {
      return classOrName;
    }

    return classOrName.name;
  }

}
