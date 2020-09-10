import fastEqual from 'fast-deep-equal';
import { createRequire, createRequireFromPath } from 'module';
import clone from 'clone';
import globby, { GlobbyOptions } from 'globby';
import { isAbsolute, normalize, relative, resolve, extname, join } from 'path';
import { pathExists } from 'fs-extra';
import { createHash } from 'crypto';
import { recovery } from 'escaya';

import { AnyEntity, Dictionary, EntityMetadata, EntityName, EntityProperty, Primary, IMetadataStorage } from '../typings';
import { GroupOperator, ReferenceType, QueryOperator } from '../enums';
import { Collection } from '../entity';
import { Platform } from '../platforms';

export const ObjectBindingPattern = Symbol('ObjectBindingPattern');

export class Utils {

  /**
   * Checks if the argument is not undefined
   */
  static isDefined<T = Record<string, unknown>>(data: any, considerNullUndefined = false): data is T {
    return typeof data !== 'undefined' && !(considerNullUndefined && data === null);
  }

  /**
   * Checks if the argument is instance of `Object`. Returns false for arrays.
   * `not` argument allows to blacklist classes that should be considered as not object.
   */
  static isObject<T = Dictionary>(o: any, not: any[] = []): o is T {
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

    if (Utils.isObject(target) && Utils.isPlainObject(source)) {
      Object.entries(source).forEach(([key, value]) => {
        if (Utils.isPlainObject(value)) {
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

  static getRootEntity(metadata: IMetadataStorage, meta: EntityMetadata): EntityMetadata {
    const base = meta.extends && metadata.find(meta.extends);

    if (!base || base === meta) { // make sure we do not fall into infinite loop
      return meta;
    }

    const root = Utils.getRootEntity(metadata, base);

    if (root.discriminatorColumn) {
      return root;
    }

    return meta;
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
   * Creates deep copy of given entity.
   */
  static copy<T>(entity: T): T {
    return clone(entity);
  }

  /**
   * Normalize the argument to always be an array.
   */
  static asArray<T>(data?: T | T[], strict = false): T[] {
    if (typeof data === 'undefined' && !strict) {
      return [];
    }

    return Array.isArray(data!) ? data : [data!];
  }

  /**
   * Renames object key, keeps order of properties.
   */
  static renameKey<T>(payload: T, from: string | keyof T, to: string): void {
    if (Utils.isObject(payload) && (from as string) in payload && !(to in payload)) {
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        delete payload[key];
        payload[from === key ? to : key] = value;
      }, payload);
    }
  }

  /**
   * Returns array of functions argument names. Uses `escaya` for source code analysis.
   */
  static getParamNames(func: { toString(): string } | string, methodName?: string): string[] {
    const ret: string[] = [];
    const parsed = recovery(func.toString(), 'entity.js', { next: true, module: true });

    const checkNode = (node: Dictionary) => {
      /* istanbul ignore next */
      if (methodName && node.name?.name !== methodName) {
        return;
      }

      const params = node.uniqueFormalParameters ?? node.params;
      ret.push(...params.map((p: any) => {
        switch (p.type) {
          case 'BindingElement':
            if (p.left.type === 'ObjectBindingPattern') {
              return ObjectBindingPattern;
            }

            return p.left.name;
          case 'BindingRestElement':
            return '...' + p.argument.name;
          default:
            return p.name;
        }
      }));
    };

    Utils.walkNode(parsed, checkNode);

    return ret;
  }

  private static walkNode(node: Dictionary, checkNode: (node: Dictionary) => void): void {
    if (['MethodDefinition', 'FunctionDeclaration'].includes(node.type!)) {
      checkNode(node);
    }

    if (Array.isArray(node.leafs)) {
      node.leafs.forEach((row: Dictionary) => Utils.walkNode(row, checkNode));
    }

    if (Array.isArray(node.elements)) {
      node.elements.forEach(element => Utils.walkNode(element, checkNode));
    }

    if (node.method) {
      Utils.walkNode(node.method, checkNode);
    }
  }

  /**
   * Checks whether the argument looks like primary key (string, number or ObjectId).
   */
  static isPrimaryKey<T>(key: any, allowComposite = false): key is Primary<T> {
    if (allowComposite && Array.isArray(key) && key.every(v => Utils.isPrimaryKey(v))) {
      return true;
    }

    return Utils.isString(key) || typeof key === 'number' || Utils.isObjectID(key) || key instanceof Date || key instanceof Buffer;
  }

  /**
   * Extracts primary key from `data`. Accepts objects or primary keys directly.
   */
  static extractPK<T extends AnyEntity<T>>(data: any, meta?: EntityMetadata<T>, strict = false): Primary<T> | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isEntity(data, true)) {
      return data.__helper!.__primaryKey as Primary<T>;
    }

    if (strict && meta && Object.keys(data).length !== meta.primaryKeys.length) {
      return null;
    }

    if (Utils.isObject(data) && meta) {
      if (meta.compositePK) {
        return Utils.getCompositeKeyHash(data as T, meta) as Primary<T>;
      }

      return data[meta.primaryKeys[0]] || data[meta.serializedPrimaryKey] || null;
    }

    return null;
  }

  static getCompositeKeyHash<T extends AnyEntity<T>>(entity: T, meta: EntityMetadata<T>): string {
    const pks = meta.primaryKeys.map(pk => {
      const value = entity[pk];

      if (Utils.isEntity<T>(value, true)) {
        return value.__helper!.__serializedPrimaryKey;
      }

      return value;
    });

    return Utils.getPrimaryKeyHash(pks as string[]);
  }

  static getPrimaryKeyHash(pks: string[]): string {
    return pks.join('~~~');
  }

  static splitPrimaryKeys(key: string): string[] {
    return key.split('~~~');
  }

  static getPrimaryKeyValue<T extends AnyEntity<T>>(entity: T, primaryKeys: string[]) {
    if (primaryKeys.length > 1) {
      return Utils.getPrimaryKeyCond(entity, primaryKeys);
    }

    if (Utils.isEntity(entity[primaryKeys[0]])) {
      return entity[primaryKeys[0]].__helper!.__primaryKey;
    }

    return entity[primaryKeys[0]];
  }

  static getPrimaryKeyValues<T extends AnyEntity<T>>(entity: T, primaryKeys: string[], allowScalar = false) {
    if (allowScalar && primaryKeys.length === 1) {
      if (Utils.isEntity(entity[primaryKeys[0]])) {
        return entity[primaryKeys[0]].__helper!.__primaryKey;
      }

      return entity[primaryKeys[0]];
    }

    return primaryKeys.map(pk => {
      if (Utils.isEntity(entity[pk])) {
        return entity[pk].__helper!.__primaryKey;
      }

      return entity[pk];
    });
  }

  static getPrimaryKeyCond<T extends AnyEntity<T>>(entity: T, primaryKeys: string[]): Record<string, Primary<T>> | null {
    const cond = primaryKeys.reduce((o, pk) => {
      o[pk] = Utils.extractPK(entity[pk]);
      return o;
    }, {} as any);

    if (Object.values(cond).some(v => v === null)) {
      return null;
    }

    return cond;
  }

  static getPrimaryKeyCondFromArray<T extends AnyEntity<T>>(pks: Primary<T>[], primaryKeys: string[]): Record<string, Primary<T>> {
    return primaryKeys.reduce((o, pk, idx) => {
      o[pk] = Utils.extractPK<T>(pks[idx]);
      return o;
    }, {} as any);
  }

  static getOrderedPrimaryKeys<T extends AnyEntity<T>>(id: Primary<T> | Record<string, Primary<T>>, meta: EntityMetadata<T>, platform: Platform, convertCustomTypes?: boolean): Primary<T>[] {
    const data = (Utils.isPrimaryKey(id) ? { [meta.primaryKeys[0]]: id } : id) as Record<string, Primary<T>>;
    return meta.primaryKeys.map(pk => {
      const prop = meta.properties[pk];

      if (prop.customType && convertCustomTypes) {
        return prop.customType.convertToJSValue(data[pk], platform);
      }

      return data[pk];
    }) as Primary<T>[];
  }

  /**
   * Checks whether given object is an entity instance.
   */
  static isEntity<T = AnyEntity>(data: any, allowReference = false): data is T {
    if (!Utils.isObject(data)) {
      return false;
    }

    if (allowReference && !!data.__reference) {
      return true;
    }

    return !!data.__entity;
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
  static className<T>(classOrName: EntityName<T>): string {
    if (Utils.isString(classOrName)) {
      return classOrName;
    }

    return classOrName.name as string;
  }

  /**
   * Tries to detect `ts-node` runtime.
   */
  static detectTsNode(): boolean {
    return process.argv[0].endsWith('ts-node') // running via ts-node directly
      || !!process[Symbol.for('ts-node.register.instance')] // check if internal ts-node symbol exists
      || process.argv.slice(1).some(arg => arg.includes('ts-node')) // registering ts-node runner
      || (require.extensions && !!require.extensions['.ts']) // check if the extension is registered
      || !!new Error().stack!.split('\n').find(line => line.match(/\w\.ts:\d/)); // as a last resort, try to find a TS file in the stack trace
  }

  /**
   * Uses some dark magic to get source path to caller where decorator is used.
   * Analyses stack trace of error created inside the function call.
   */
  static lookupPathFromDecorator(name: string, stack?: string[]): string {
    // use some dark magic to get source path to caller
    stack = stack || new Error().stack!.split('\n');
    let line = stack.findIndex(line => line.includes('__decorate'))!;

    if (line === -1) {
      return name;
    }

    if (Utils.normalizePath(stack[line]).includes('node_modules/tslib/tslib')) {
      line++;
    }

    const re = stack[line].match(/\(.+\)/i) ? /\((.*):\d+:\d+\)/ : /at\s*(.*):\d+:\d+$/;

    return Utils.normalizePath(stack[line].match(re)![1]);
  }

  /**
   * Gets the type of the argument.
   */
  static getObjectType(value: any): string {
    const objectType = Object.prototype.toString.call(value);
    return objectType.match(/\[object (\w+)]/)![1].toLowerCase();
  }

  /**
   * Checks whether the value is POJO (e.g. `{ foo: 'bar' }`, and not instance of `Foo`)
   */
  static isPlainObject(value: any): value is Dictionary {
    // eslint-disable-next-line no-prototype-builtins
    return value !== null && typeof value === 'object' && typeof value.constructor === 'function' && value.constructor.prototype.hasOwnProperty('isPrototypeOf');
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

  static isCollection<T extends AnyEntity<T>, O extends AnyEntity<O> = AnyEntity>(item: any, prop?: EntityProperty<T>, type?: ReferenceType): item is Collection<T, O> {
    if (!item?.__collection) {
      return false;
    }

    return !(prop && type) || prop.reference === type;
  }

  static normalizePath(...parts: string[]): string {
    let path = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
    path = normalize(path).replace(/\\/g, '/');

    return (path.match(/^[/.]|[a-zA-Z]:/) || path.startsWith('!')) ? path : './' + path;
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

  static defaultValue<T extends Dictionary>(prop: T, option: keyof T, defaultValue: any): void {
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

  /**
   * Extracts all possible values of a TS enum. Works with both string and numeric enums.
   */
  static extractEnumValues(target: Dictionary): (string | number)[] {
    const keys = Object.keys(target);
    const values = Object.values<string | number>(target);
    const numeric = !!values.find(v => typeof v === 'number');

    if (numeric) {
      return values.filter(val => !keys.includes(val as string));
    }

    return values;
  }

  static flatten<T>(arrays: T[][]): T[] {
    return ([] as T[]).concat.apply([], arrays);
  }

  static isOperator(key: string, includeGroupOperators = true): boolean {
    if (!includeGroupOperators) {
      return !!QueryOperator[key];
    }

    return !!GroupOperator[key] || !!QueryOperator[key];
  }

  static getGlobalStorage(namespace: string): Dictionary {
    const key = `mikro-orm-${namespace}`;
    global[key] = global[key] || {};

    return global[key];
  }

  /**
   * Require a module from a specific location
   * @param id The module to require
   * @param from Location to start the node resolution
   */
  static requireFrom(id: string, from: string) {
    if (!extname(from)) {
      from = join(from, '__fake.js');
    }

    /* istanbul ignore next */
    return (createRequire || createRequireFromPath)(resolve(from))(id);
  }

  static getORMVersion(): string {
    /* istanbul ignore next */
    try {
      // this works with ts-node during development (where we have `src` folder)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('../../package.json').version;
    } catch {
      // this works with node in production build (where we do not have the `src` folder)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('../package.json').version;
    }
  }

}
