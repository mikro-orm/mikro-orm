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
import { Dictionary, EntityData, EntityMetadata, EntityProperty, AnyEntity, Primary } from '../typings';
import { ArrayCollection, Collection, Reference, ReferenceType } from '../entity';
import { Platform } from '../platforms';

export class Utils {

  /**
   * Checks if the argument is not undefined
   */
  static isDefined<T = object>(data: any): data is T {
    return typeof data !== 'undefined';
  }

  /**
   * Checks if the argument is instance of `Object`. Returns false for arrays.
   * `not` argument allows to blacklist classes that should be considered as not object.
   */
  static isObject<T = Dictionary>(o: any, not: Function[] = []): o is T {
    return !!o && typeof o === 'object' && !Array.isArray(o) && !not.some(cls => o instanceof cls);
  }

  /**
   * Checks if the argument is string
   */
  static isString(s: any): s is string {
    return typeof s === 'string';
  }

  /**
   * Checks if the argument is number
   */
  static isNumber<T = number>(s: any): s is T {
    return typeof s === 'number';
  }

  /**
   * Checks if arguments are deeply (but not strictly) equal.
   */
  static equals(a: any, b: any): boolean {
    return fastEqual(a, b);
  }

  /**
   * Gets array without duplicates.
   */
  static unique<T = string>(items: T[]): T[] {
    return [...new Set(items)];
  }

  /**
   * Merges all sources into the target recursively.
   */
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

  /**
   * Computes difference between two objects, ignoring items missing in `b`.
   */
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

  /**
   * Computes difference between two entities. First calls `prepareEntity` on both, then uses the `diff` method.
   */
  static diffEntities<T extends AnyEntity<T>>(a: T, b: T, metadata: MetadataStorage, platform: Platform): EntityData<T> {
    return Utils.diff(Utils.prepareEntity(a, metadata, platform), Utils.prepareEntity(b, metadata, platform)) as EntityData<T>;
  }

  /**
   * Removes ORM specific code from entities and prepares it for serializing. Used before change set computation.
   * References will be mapped to primary keys, collections to arrays of primary keys.
   */
  static prepareEntity<T extends AnyEntity<T>>(entity: T, metadata: MetadataStorage, platform: Platform): EntityData<T> {
    const meta = metadata.get<T>(entity.constructor.name);
    const ret = Utils.copy(entity);
    // @ts-ignore
    delete ret.__initialized;

    // remove collections and references, process custom types
    Object.values<EntityProperty>(meta.properties).forEach(prop => {
      if (prop.customType && prop.name in ret) {
        return ret[prop.name] = prop.customType.convertToDatabaseValue(entity[prop.name], platform);
      }

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

  /**
   * Creates deep copy of given entity.
   */
  static copy<T>(entity: T): T {
    return clone(entity);
  }

  /**
   * Normalize the argument to always be an array.
   */
  static asArray<T>(data?: T | T[]): T[] {
    if (typeof data === 'undefined') {
      return [];
    }

    return Array.isArray(data!) ? data : [data!];
  }

  /**
   * Renames object key, keeps order of properties.
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

  /**
   * Returns array of functions argument names. Uses `acorn` for source code analysis.
   */
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

  /**
   * Checks whether the argument looks like primary key (string, number or ObjectId).
   */
  static isPrimaryKey<T>(key: any): key is Primary<T> {
    return Utils.isString(key) || typeof key === 'number' || Utils.isObjectID(key);
  }

  /**
   * Extracts primary key from `data`. Accepts objects or primary keys directly.
   */
  static extractPK<T extends AnyEntity<T>>(data: any, meta?: EntityMetadata): Primary<T> | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isObject(data) && meta) {
      return data[meta.primaryKey] || data[meta.serializedPrimaryKey] || null;
    }

    return null;
  }

  /**
   * Checks whether given object is an entity instance.
   */
  static isEntity<T = AnyEntity>(data: any, allowReference = false): data is T {
    if (allowReference && Utils.isReference(data)) {
      return true;
    }

    return Utils.isObject(data) && !!data.__entity;
  }

  /**
   * Checks whether the argument is instance or `Reference` wrapper.
   */
  static isReference<T extends AnyEntity<T>>(data: any): data is Reference<T> {
    return data instanceof Reference;
  }

  /**
   * Returns wrapped entity.
   */
  static unwrapReference<T extends AnyEntity<T>>(ref: T | Reference<T>): T {
    return Utils.isReference<T>(ref) ? (ref as Reference<T>).unwrap() : ref;
  }

  /**
   * Checks whether the argument is ObjectId instance
   */
  static isObjectID(key: any) {
    return Utils.isObject(key) && key.constructor.name.toLowerCase() === 'objectid';
  }

  /**
   * Checks whether the argument is empty (array without items, object without keys or falsy value).
   */
  static isEmpty(data: any): boolean {
    if (Array.isArray(data)) {
      return data.length === 0;
    }

    if (Utils.isObject(data)) {
      return Object.keys(data).length === 0;
    }

    return !data;
  }

  /**
   * Gets string name of given class.
   */
  static className(classOrName: string | Function): string {
    if (Utils.isString(classOrName)) {
      return classOrName;
    }

    return classOrName.name;
  }

  /**
   * Tries to detect `ts-node` runtime.
   */
  static detectTsNode(): boolean {
    return process.argv[0].endsWith('ts-node') || process.argv.slice(1).some(arg => arg.includes('ts-node')) || !!require.extensions['.ts'];
  }

  /**
   * Uses some dark magic to get source path to caller where decorator is used.
   * Analyses stack trace of error created inside the function call.
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

  /**
   * Gets the type of the argument.
   */
  static getObjectType(value: any): string {
    const objectType = Object.prototype.toString.call(value);
    return objectType.match(/\[object (\w+)]/)![1].toLowerCase();
  }

  /**
   * Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.
   */
  static wrapReference<T extends AnyEntity<T>>(entity: T, prop: EntityProperty<T>): Reference<T> | T {
    if (prop.wrappedReference) {
      return Reference.create(entity);
    }

    return entity;
  }

  /**
   * Executes the `cb` promise serially on every element of the `items` array and returns array of resolved values.
   */
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
