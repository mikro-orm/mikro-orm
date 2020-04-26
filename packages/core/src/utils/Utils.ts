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
import { AnyEntity, Dictionary, EntityData, EntityMetadata, EntityProperty, Primary } from '../typings';
import { ArrayCollection, Collection, Reference, ReferenceType, wrap } from '../entity';
import { Platform } from '../platforms';
import { GroupOperator, QueryOperator } from '../enums';

export class Utils {

  /**
   * Checks if the argument is not undefined
   */
  static isDefined<T = object>(data: any, considerNullUndefined = false): data is T {
    return typeof data !== 'undefined' && !(considerNullUndefined && data === null);
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
        if (Utils.isObject(value, [Date, RegExp, Buffer])) {
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

  static getRootEntity(metadata: MetadataStorage, meta: EntityMetadata): EntityMetadata {
    const base = meta.extends && metadata.get(meta.extends, false, false);

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
    if ((entity as Dictionary).__prepared) {
      return entity;
    }

    const meta = metadata.get<T>(entity.constructor.name);
    const root = Utils.getRootEntity(metadata, meta);
    const ret = {} as EntityData<T>;

    if (meta.discriminatorValue) {
      ret[root.discriminatorColumn as keyof T] = meta.discriminatorValue as unknown as T[keyof T];
    }

    // copy all props, ignore collections and references, process custom types
    Object.values<EntityProperty<T>>(meta.properties).forEach(prop => {
      if (Utils.shouldIgnoreProperty(entity, prop, root)) {
        return;
      }

      if (prop.reference === ReferenceType.EMBEDDED) {
        return Object.values<EntityProperty>(meta.properties).filter(p => p.embedded?.[0] === prop.name).forEach(childProp => {
          ret[childProp.name as keyof T] = entity[prop.name][childProp.embedded![1]];
        });
      }

      if (Utils.isEntity(entity[prop.name], true)) {
        return ret[prop.name] = Utils.getPrimaryKeyValues(entity[prop.name], metadata.get(prop.type).primaryKeys, true);
      }

      if (prop.customType) {
        return ret[prop.name] = prop.customType.convertToDatabaseValue(entity[prop.name], platform);
      }

      if (Array.isArray(entity[prop.name]) || Utils.isObject(entity[prop.name])) {
        return ret[prop.name] = Utils.copy(entity[prop.name]);
      }

      ret[prop.name] = entity[prop.name];
    });

    Object.defineProperty(ret, '__prepared', { value: true });

    return ret;
  }

  private static shouldIgnoreProperty<T>(entity: T, prop: EntityProperty<T>, root: EntityMetadata) {
    if (!(prop.name in entity)) {
      return true;
    }

    const collection = entity[prop.name] as unknown instanceof ArrayCollection;
    const noPkRef = Utils.isEntity(entity[prop.name]) && !wrap(entity[prop.name]).__primaryKeys.every(pk => pk);
    const noPkProp = prop.primary && !Utils.isDefined(entity[prop.name], true);
    const inverse = prop.reference === ReferenceType.ONE_TO_ONE && !prop.owner;
    const discriminator = prop.name === root.discriminatorColumn;

    // bidirectional 1:1 and m:1 fields are defined as setters, we need to check for `undefined` explicitly
    const isSetter = [ReferenceType.ONE_TO_ONE, ReferenceType.MANY_TO_ONE].includes(prop.reference) && (prop.inversedBy || prop.mappedBy);
    const emptyRef = isSetter && entity[prop.name] === undefined;

    return collection || noPkProp || noPkRef || inverse || discriminator || emptyRef || prop.persist === false;
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
  static isPrimaryKey<T>(key: any, allowComposite = false): key is Primary<T> {
    if (allowComposite && Array.isArray(key) && key.every(v => Utils.isPrimaryKey(v))) {
      return true;
    }

    return Utils.isString(key) || typeof key === 'number' || Utils.isObjectID(key);
  }

  /**
   * Extracts primary key from `data`. Accepts objects or primary keys directly.
   */
  static extractPK<T extends AnyEntity<T>>(data: any, meta?: EntityMetadata): Primary<T> | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isEntity(data) && !meta) {
      meta = wrap(data).__meta;
    }

    if (Utils.isObject(data) && meta) {
      if (meta.compositePK) {
        return Utils.getCompositeKeyHash(data, meta) as Primary<T>;
      }

      return data[meta.primaryKeys[0]] || data[meta.serializedPrimaryKey] || null;
    }

    return null;
  }

  static getCompositeKeyHash<T>(entity: T, meta: EntityMetadata<T>): string {
    const pks = meta.primaryKeys.map(pk => {
      if (Utils.isEntity(entity[pk], true)) {
        return wrap(entity[pk]).__serializedPrimaryKey;
      }

      return entity[pk];
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
      return wrap(entity[primaryKeys[0]]).__primaryKey;
    }

    return entity[primaryKeys[0]];
  }

  static getPrimaryKeyValues<T extends AnyEntity<T>>(entity: T, primaryKeys: string[], allowScalar = false) {
    if (allowScalar && primaryKeys.length === 1) {
      if (Utils.isEntity(entity[primaryKeys[0]])) {
        return wrap(entity[primaryKeys[0]]).__primaryKey;
      }

      return entity[primaryKeys[0]];
    }

    return primaryKeys.map(pk => {
      if (Utils.isEntity(entity[pk])) {
        return wrap(entity[pk]).__primaryKey;
      }

      return entity[pk];
    });
  }

  static getPrimaryKeyCond<T extends AnyEntity<T>>(entity: T, primaryKeys: string[]): Record<string, Primary<T>> {
    return primaryKeys.reduce((o, pk) => {
      o[pk] = Utils.extractPK(entity[pk]);
      return o;
    }, {} as any);
  }

  static getPrimaryKeyCondFromArray<T extends AnyEntity<T>>(pks: Primary<T>[], primaryKeys: string[]): Record<string, Primary<T>> {
    return primaryKeys.reduce((o, pk, idx) => {
      o[pk] = Utils.extractPK(pks[idx]);
      return o;
    }, {} as any);
  }

  static getOrderedPrimaryKeys<T extends AnyEntity<T>>(id: Primary<T> | Record<string, Primary<T>>, meta: EntityMetadata<T>): Primary<T>[] {
    const data = (Utils.isPrimaryKey(id) ? { [meta.primaryKeys[0]]: id } : id) as Record<string, Primary<T>>;
    return meta.primaryKeys.map(pk => data[pk]) as Primary<T>[];
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
    return process.argv[0].endsWith('ts-node') // running via ts-node directly
      || process.argv.slice(1).some(arg => arg.includes('ts-node')) // registering ts-node runner
      || !!require.extensions['.ts'] // check if the extension is registered
      || !!new Error().stack!.split('\n').find(line => line.match(/\w\.ts:\d/)); // as a last resort, try to find a TS file in the stack trace
  }

  /**
   * Uses some dark magic to get source path to caller where decorator is used.
   * Analyses stack trace of error created inside the function call.
   */
  static lookupPathFromDecorator(stack?: string[]): string {
    // use some dark magic to get source path to caller
    stack = stack || new Error().stack!.split('\n');
    let line = stack.findIndex(line => line.includes('__decorate'))!;

    if (line === -1) {
      throw new Error('Cannot find path to entity');
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
  static isPlainObject(value: any): boolean {
    if (!Utils.isObject(value)) {
      return false;
    }

    if (typeof value.constructor !== 'function') {
      return false;
    }

    // eslint-disable-next-line no-prototype-builtins
    if (!value.constructor.prototype.hasOwnProperty('isPrototypeOf')) {
      return false;
    }

    // most likely plain object
    return true;
  }

  /**
   * Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.
   */
  static wrapReference<T extends AnyEntity<T>>(entity: T | Reference<T>, prop: EntityProperty<T>): Reference<T> | T {
    if (entity && prop.wrappedReference && !Utils.isReference(entity)) {
      return Reference.create(entity as T);
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

}
