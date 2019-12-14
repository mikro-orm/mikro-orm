import fastEqual from 'fast-deep-equal';
import clone from 'clone';
import globby, { GlobbyOptions } from 'globby';
import { isAbsolute, normalize, relative } from 'path';
import { pathExists } from 'fs-extra';
import { createHash } from 'crypto';
// @ts-ignore
import { parse } from 'acorn-loose';
// @ts-ignore
import { simple as walk } from 'acorn-walk';

import { MetadataStorage } from '../metadata';
import { Dictionary, EntityData, EntityMetadata, EntityProperty, AnyEntity, Primary } from '../types';
import { ArrayCollection, Collection, Reference, ReferenceType } from '../entity';

export class Utils {

  static isDefined<T = object>(data: any): data is T {
    return typeof data !== 'undefined';
  }

  static isObject<T = Dictionary>(o: any, not: Function[] = []): o is T {
    return !!o && typeof o === 'object' && !Array.isArray(o) && !not.some(cls => o instanceof cls);
  }

  static isString(s: any): s is string {
    return typeof s === 'string';
  }

  static isNumber<T = number>(s: any): s is T {
    return typeof s === 'number';
  }

  static equals(a: any, b: any): boolean {
    return fastEqual(a, b);
  }

  static unique<T = string>(items: T[]): T[] {
    return [...new Set(items)];
  }

  static merge(target: any, ...sources: any[]): any {
    if (!sources.length) {
      return target;
    }

    const source = sources.shift();

    if (Utils.isObject(target) && Utils.isObject(source)) {
      Object.entries(source).forEach(([key, value]) => {
        if (Utils.isObject(value, [Date, RegExp])) {
          if (!(key in target)) {
            Object.assign(target, { [key]: {} });
          }

          Utils.merge(target[key], value);
        } else {
          Object.assign(target, { [key]: value });
        }
      });
    }

    return Utils.merge(target, ...sources);
  }

  static diff(a: Dictionary, b: Dictionary): Record<keyof (typeof a & typeof b), any> {
    const ret: Dictionary = {};

    Object.keys(b).forEach(k => {
      if (Utils.equals(a[k], b[k])) {
        return;
      }

      ret[k] = b[k];
    });

    return ret;
  }

  static diffEntities<T extends AnyEntity<T>>(a: T, b: T, metadata: MetadataStorage): EntityData<T> {
    return Utils.diff(Utils.prepareEntity(a, metadata), Utils.prepareEntity(b, metadata)) as EntityData<T>;
  }

  static prepareEntity<T extends AnyEntity<T>>(entity: T, metadata: MetadataStorage): EntityData<T> {
    const meta = metadata.get<T>(entity.constructor.name);
    const ret = Utils.copy(entity);
    // @ts-ignore
    delete ret.__initialized;

    // remove collections and references
    Object.values<EntityProperty>(meta.properties).forEach(prop => {
      const pk = () => metadata.get(prop.type).primaryKey;
      const name = prop.name as keyof T;
      const inverse = prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
      const noPk = Utils.isEntity(entity[name]) && !entity[name][pk()];
      const collection = entity[name] as unknown instanceof ArrayCollection;

      if (collection || noPk || inverse) {
        return delete ret[name];
      }

      if (Utils.isEntity(entity[name]) || entity[name] as unknown instanceof Reference) {
        return ret[prop.name] = entity[prop.name][pk()];
      }
    });

    // remove unknown properties
    Object.keys(entity).forEach(prop => {
      const property = meta.properties[prop as keyof T & string];

      if (!property || property.persist === false || (property.primary && !ret[prop])) {
        delete ret[prop];
      }
    });

    return ret;
  }

  static copy<T>(entity: T): T {
    return clone(entity);
  }

  static asArray<T>(data?: T | T[]): T[] {
    if (typeof data === 'undefined') {
      return [];
    }

    return Array.isArray(data!) ? data : [data!];
  }

  /**
   * renames object key, keeps order of properties
   */
  static renameKey<T>(payload: T, from: string | keyof T, to: string): void {
    if (Utils.isObject(payload) && from in payload && !(to in payload)) {
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        delete payload[key];
        payload[from === key ? to : key] = value;
      }, payload);
    }
  }

  static getParamNames(func: Function | string, methodName?: string): string[] {
    const ret: string[] = [];
    const parsed = parse(func.toString());

    const checkNode = (node: any, methodName?: string) => {
      if (methodName && !(node.key && (node.key as any).name === methodName)) {
        return;
      }

      const params = node.value ? node.value.params : node.params;
      ret.push(...params.map((p: any) => {
        switch (p.type) {
          case 'AssignmentPattern':
            return p.left.name;
          case 'RestElement':
            return '...' + p.argument.name;
          default:
            return p.name;
        }
      }));
    };

    walk(parsed, {
      MethodDefinition: (node: any) => checkNode(node, methodName),
      FunctionDeclaration: (node: any) => checkNode(node, methodName),
    });

    return ret;
  }

  static isPrimaryKey<T>(key: any): key is Primary<T> {
    return Utils.isString(key) || typeof key === 'number' || Utils.isObjectID(key);
  }

  static extractPK<T extends AnyEntity<T>>(data: any, meta?: EntityMetadata): Primary<T> | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isObject(data) && meta) {
      return data[meta.primaryKey] || data[meta.serializedPrimaryKey] || null;
    }

    return null;
  }

  static isEntity<T = AnyEntity>(data: any, allowReference = false): data is T {
    if (allowReference && Utils.isReference(data)) {
      return true;
    }

    return Utils.isObject(data) && !!data.__entity;
  }

  static isReference<T extends AnyEntity<T>>(data: any): data is Reference<T> {
    return data instanceof Reference;
  }

  static unwrapReference<T extends AnyEntity<T>>(ref: T | Reference<T>): T {
    return Utils.isReference<T>(ref) ? (ref as Reference<T>).unwrap() : ref;
  }

  static isObjectID(key: any) {
    return Utils.isObject(key) && key.constructor.name.toLowerCase() === 'objectid';
  }

  static isEmpty(data: any): boolean {
    if (Array.isArray(data)) {
      return data.length === 0;
    }

    if (Utils.isObject(data)) {
      return Object.keys(data).length === 0;
    }

    return !data;
  }

  static className(classOrName: string | Function): string {
    if (Utils.isString(classOrName)) {
      return classOrName;
    }

    return classOrName.name;
  }

  static detectTsNode(): boolean {
    return process.argv[0].endsWith('ts-node') || process.argv.slice(1).some(arg => arg.includes('ts-node')) || !!require.extensions['.ts'];
  }

  /**
   * uses some dark magic to get source path to caller where decorator is used
   */
  static lookupPathFromDecorator(meta: EntityMetadata, stack?: string[]): string {
    if (meta.path) {
      return meta.path;
    }

    // use some dark magic to get source path to caller
    stack = stack || new Error().stack!.split('\n');
    let line = stack.findIndex(line => line.includes('__decorate'))!;

    if (line === -1) {
      return meta.path;
    }

    if (Utils.normalizePath(stack[line]).includes('node_modules/tslib/tslib')) {
      line++;
    }

    meta.path = Utils.normalizePath(stack[line].match(/\((.*):\d+:\d+\)/)![1]);

    return meta.path;
  }

  static getObjectType(value: any): string {
    const objectType = Object.prototype.toString.call(value);
    return objectType.match(/\[object (\w+)]/)![1].toLowerCase();
  }

  static wrapReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>): Reference<T> | T {
    if (prop.wrappedReference) {
      return Reference.create(entity);
    }

    return entity;
  }

  static async runSerial<T = any, U = any>(items: Iterable<U>, cb: (item: U) => Promise<T>): Promise<T[]> {
    const ret = [];

    for (const item of items) {
      ret.push(await cb(item));
    }

    return ret;
  }

  static isCollection(item: any, prop?: EntityProperty, type?: ReferenceType): item is Collection<AnyEntity> {
    if (!(item instanceof Collection)) {
      return false;
    }

    return !(prop && type) || prop.reference === type;
  }

  static normalizePath(...parts: string[]): string {
    let path = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
    path = normalize(path).replace(/\\/g, '/');

    return path.match(/^[/.]|[a-zA-Z]:/) ? path : './' + path;
  }

  static relativePath(path: string, relativeTo: string): string {
    if (!path) {
      return path;
    }

    path = Utils.normalizePath(path);

    if (path.startsWith('.')) {
      return path;
    }

    path = relative(relativeTo, path);

    return Utils.normalizePath(path);
  }

  static absolutePath(path: string, baseDir = process.cwd()): string {
    if (!path) {
      return Utils.normalizePath(baseDir);
    }

    if (!isAbsolute(path)) {
      path = baseDir + '/' + path;
    }

    return Utils.normalizePath(path);
  }

  static hash(data: string): string {
    return createHash('md5').update(data).digest('hex');
  }

  static runIfNotEmpty(clause: () => any, data: any): void {
    if (!Utils.isEmpty(data)) {
      clause();
    }
  }

  static defaultValue(prop: Dictionary, option: string, defaultValue: any): void {
    prop[option] = option in prop ? prop[option] : defaultValue;
  }

  static findDuplicates<T>(items: T[]): T[] {
    return items.reduce((acc, v, i, arr) => {
      return arr.indexOf(v) !== i && acc.indexOf(v) === -1 ? acc.concat(v) : acc;
    }, [] as T[]);
  }

  static randomInt(min: number, max: number): number {
    return Math.round(Math.random() * (max - min)) + min;
  }

  static async pathExists(path: string, options: GlobbyOptions = {}): Promise<boolean> {
    if (globby.hasMagic(path)) {
      const found = await globby(path, options);
      return found.length > 0;
    }

    return pathExists(path);
  }

}
