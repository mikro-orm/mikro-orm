import { createRequire } from 'module';
import globby, { type GlobbyOptions } from 'globby';
import { extname, isAbsolute, join, normalize, relative, resolve } from 'path';
import { platform } from 'os';
import { fileURLToPath, pathToFileURL, type URL } from 'url';
import { pathExists } from 'fs-extra';
import { createHash } from 'crypto';
import { tokenize } from 'esprima';
import { clone } from './clone';
import type {
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityKey,
  EntityMetadata,
  EntityName,
  EntityProperty,
  IMetadataStorage,
  Primary,
} from '../typings';
import { ARRAY_OPERATORS, GroupOperator, PlainObject, QueryOperator, ReferenceKind } from '../enums';
import type { Collection } from '../entity/Collection';
import type { Platform } from '../platforms';
import { helper } from '../entity/wrap';
import type { ScalarReference } from '../entity/Reference';

export const ObjectBindingPattern = Symbol('ObjectBindingPattern');

function compareConstructors(a: any, b: any) {
  if (a.constructor === b.constructor) {
    return true;
  }

  if (!a.constructor) {
    return b.constructor === Object;
  }

  if (!b.constructor) {
    return a.constructor === Object;
  }

  return false;
}

export function compareObjects(a: any, b: any) {
  // eslint-disable-next-line eqeqeq
  if (a === b || (a == null && b == null)) {
    return true;
  }

  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || !compareConstructors(a, b)) {
    return false;
  }

  if (a.valueOf !== Object.prototype.valueOf && typeof a.valueOf === 'function' && typeof b.valueOf === 'function') {
    return a.valueOf() === b.valueOf();
  }

  if (a.toString !== Object.prototype.toString && typeof a.toString === 'function' && typeof b.toString === 'function') {
    return a.toString() === b.toString();
  }

  const keys = Object.keys(a);
  const length = keys.length;

  if (length !== Object.keys(b).length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if (!Object.prototype.hasOwnProperty.call(b, keys[i])) {
      return false;
    }
  }

  for (let i = length; i-- !== 0;) {
    const key = keys[i];

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!equals(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

export function compareArrays(a: any[] | string, b: any[] | string) {
  const length = a.length;

  if (length !== b.length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!equals(a[i], b[i])) {
      return false;
    }
  }

  return true;
}

export function compareBooleans(a: unknown, b: unknown): boolean {
  a = typeof a === 'number' ? Boolean(a) : a;
  b = typeof b === 'number' ? Boolean(b) : b;

  return a === b;
}

export function compareBuffers(a: Uint8Array, b: Uint8Array): boolean {
  const length = a.length;

  if (length !== b.length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if ((a as unknown as unknown[])[i] !== (b as unknown as unknown[])[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if arguments are deeply (but not strictly) equal.
 */
export function equals(a: any, b: any): boolean {
  if (a === b) {
    return true;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a)) {
      return compareArrays(a, b);
    }

    if (ArrayBuffer.isView(a) && ArrayBuffer.isView(b)) {
      return compareBuffers(a as Uint8Array, b as Uint8Array);
    }

    return compareObjects(a, b);
  }

  return Number.isNaN(a) && Number.isNaN(b);
}

const equalsFn = equals;

export function parseJsonSafe<T = unknown>(value: unknown): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      // ignore and return the value, as sometimes we get the parsed value,
      // e.g. when it is a string value in JSON column
    }
  }

  return value as T;
}

export class Utils {

  static readonly PK_SEPARATOR = '~~~';

  /* istanbul ignore next */
  static dynamicImportProvider = (id: string) => import(id);

  /**
   * Checks if the argument is not undefined
   */
  static isDefined<T = Record<string, unknown>>(data: any): data is T {
    return typeof data !== 'undefined';
  }

  /**
   * Checks if the argument is instance of `Object`. Returns false for arrays.
   */
  static isObject<T = Dictionary>(o: any): o is T {
    return !!o && typeof o === 'object' && !Array.isArray(o);
  }

  /**
   * Relation decorators allow using two signatures
   * - using first parameter as options object
   * - using all parameters
   *
   * This function validates those two ways are not mixed and returns the final options object.
   * If the second way is used, we always consider the last parameter as options object.
   * @internal
   */
  static processDecoratorParameters<T>(params: Dictionary): T {
    const keys = Object.keys(params);
    const values = Object.values(params);

    if (!Utils.isPlainObject(values[0])) {
      const lastKey = keys[keys.length - 1];
      const last = params[lastKey];
      delete params[lastKey];

      return { ...last, ...params };
    }

    // validate only first parameter is used if its an option object
    const empty = (v: unknown) => v == null || (Utils.isPlainObject(v) && !Utils.hasObjectKeys(v));
    if (values.slice(1).some(v => !empty(v))) {
      throw new Error('Mixing first decorator parameter as options object with other parameters is forbidden. ' +
        'If you want to use the options parameter at first position, provide all options inside it.');
    }

    return values[0] as T;
  }

  /**
   * Checks if the argument is instance of `Object`, but not one of the blacklisted types. Returns false for arrays.
   */
  static isNotObject<T = Dictionary>(o: any, not: any[]): o is T {
    return this.isObject(o) && !not.some(cls => o instanceof cls);
  }

  /**
   * Removes `undefined` properties (recursively) so they are not saved as nulls
   */
  static dropUndefinedProperties<T = Dictionary | unknown[]>(o: any, value?: undefined | null, visited = new Set()): void {
    if (Array.isArray(o)) {
      return o.forEach((item: unknown) => Utils.dropUndefinedProperties(item, value, visited));
    }

    if (!Utils.isPlainObject(o) || visited.has(o)) {
      return;
    }

    visited.add(o);

    Object.keys(o).forEach(key => {
      if (o[key] === value) {
        delete o[key];
        return;
      }

      Utils.dropUndefinedProperties(o[key], value, visited);
    });
  }

  /**
   * Returns the number of properties on `obj`. This is 20x faster than Object.keys(obj).length.
   * @see https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts
   */
  static getObjectKeysSize(object: Dictionary): number {
    let size = 0;

    for (const key in object) {
      /* istanbul ignore else */
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        size++;
      }
    }

    return size;
  }

  /**
   * Returns true if `obj` has at least one property. This is 20x faster than Object.keys(obj).length.
   * @see https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts
   */
  static hasObjectKeys(object: Dictionary): boolean {
    for (const key in object) {
      /* istanbul ignore else */
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        return true;
      }
    }

    return false;
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
    return equalsFn(a, b);
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
    return Utils._merge(target, sources, false);
  }

  /**
   * Merges all sources into the target recursively. Ignores `undefined` values.
   */
  static mergeConfig(target: any, ...sources: any[]): any {
    return Utils._merge(target, sources, true);
  }

  /**
   * Merges all sources into the target recursively.
   */
  private static _merge(target: any, sources: any[], ignoreUndefined: boolean): any {
    if (!sources.length) {
      return target;
    }

    const source = sources.shift();

    if (Utils.isObject(target) && Utils.isPlainObject(source)) {
      Object.entries(source).forEach(([key, value]) => {
        if (ignoreUndefined && typeof value === 'undefined') {
          return;
        }

        if (Utils.isPlainObject(value)) {
          if (!Utils.isObject(target[key])) {
            target[key] = Utils.copy(value);
            return;
          }

          /* istanbul ignore next */
          if (!(key in target)) {
            Object.assign(target, { [key]: {} });
          }

          Utils._merge(target[key], [value], ignoreUndefined);
        } else {
          Object.assign(target, { [key]: value });
        }
      });
    }

    return Utils._merge(target, sources, ignoreUndefined);
  }

  static getRootEntity(metadata: IMetadataStorage, meta: EntityMetadata): EntityMetadata {
    const base = meta.extends && metadata.find(Utils.className(meta.extends));

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
   * Creates deep copy of given object.
   */
  static copy<T>(entity: T, respectCustomCloneMethod = true): T {
    return clone(entity, respectCustomCloneMethod);
  }

  /**
   * Normalize the argument to always be an array.
   */
  static asArray<T>(data?: T | readonly T[] | Iterable<T>, strict = false): T[] {
    if (typeof data === 'undefined' && !strict) {
      return [];
    }

    if (this.isIterable(data)) {
      return Array.from(data);
    }

    return [data as T];
  }

  /**
   * Checks if the value is iterable, but considers strings and buffers as not iterable.
   */
  static isIterable<T>(value: unknown): value is Iterable<T> {
    if (value == null || typeof value === 'string' || ArrayBuffer.isView(value)) {
      return false;
    }

    return typeof Object(value)[Symbol.iterator] === 'function';
  }

  /**
   * Renames object key, keeps order of properties.
   */
  static renameKey<T>(payload: T, from: string | keyof T, to: string): void {
    if (Utils.isObject(payload) && (from as string) in payload && !(to in payload)) {
      Object.keys(payload).forEach(key => {
        const value = payload[key];
        delete payload[key];
        payload[from === key ? to : key as keyof T] = value;
      }, payload);
    }
  }

  /**
   * Returns array of functions argument names. Uses `esprima` for source code analysis.
   */
  static tokenize(func: { toString(): string } | string | { type: string; value: string }[]): { type: string; value: string }[] {
    if (Array.isArray(func)) {
      return func;
    }

    try {
      return tokenize(func.toString(), { tolerant: true });
    } catch {
      /* istanbul ignore next */
      return [];
    }
  }

  /**
   * Returns array of functions argument names. Uses `esprima` for source code analysis.
   */
  static getParamNames(func: { toString(): string } | string | { type: string; value: string }[], methodName?: string): string[] {
    const ret: string[] = [];
    const tokens = this.tokenize(func);

    let inside = 0;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'Identifier' && token.value === methodName) {
        inside = 1;
        continue;
      }

      if (inside === 1 && token.type === 'Punctuator' && token.value === '(') {
        inside = 2;
        continue;
      }

      if (inside === 2 && token.type === 'Punctuator' && token.value === ')') {
        break;
      }

      if (inside === 2 && token.type === 'Punctuator' && token.value === '{') {
        ret.push(ObjectBindingPattern as unknown as string);
        i += 2;
        continue;
      }

      if (inside === 2 && token.type === 'Identifier') {
        ret.push(token.value);
      }
    }

    return ret;
  }

  /**
   * Checks whether the argument looks like primary key (string, number or ObjectId).
   */
  static isPrimaryKey<T>(key: any, allowComposite = false): key is Primary<T> {
    if (allowComposite && Array.isArray(key) && key.every(v => Utils.isPrimaryKey(v, true))) {
      return true;
    }

    if (Utils.isObject(key) && !Utils.isPlainObject(key) && !Utils.isEntity(key, true)) {
      return true;
    }

    return ['string', 'number', 'bigint'].includes(typeof key) || Utils.isObjectID(key) || key instanceof Date || key instanceof Buffer;
  }

  /**
   * Extracts primary key from `data`. Accepts objects or primary keys directly.
   */
  static extractPK<T extends object>(data: any, meta?: EntityMetadata<T>, strict = false): Primary<T> | string | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isEntity<T>(data, true)) {
      return helper(data).getPrimaryKey() as string;
    }

    if (strict && meta && Utils.getObjectKeysSize(data) !== meta.primaryKeys.length) {
      return null;
    }

    if (Utils.isPlainObject(data) && meta) {
      if (meta.compositePK) {
        return this.getCompositeKeyValue(data as T, meta);
      }

      return data[meta.primaryKeys[0]] || data[meta.serializedPrimaryKey] || null;
    }

    return null;
  }

  static getCompositeKeyValue<T>(
    data: EntityData<T>,
    meta: EntityMetadata<T>,
    convertCustomTypes: boolean | 'convertToDatabaseValue' | 'convertToJSValue' = false,
    platform?: Platform,
  ): Primary<T> {
    return meta.primaryKeys.map((pk, idx) => {
      const value = Array.isArray(data) ? data[idx] : data[pk as EntityKey<T>];
      const prop = meta.properties[pk];

      if (prop.targetMeta && Utils.isPlainObject(value)) {
        return this.getCompositeKeyValue(value, prop.targetMeta);
      }

      if (prop.customType && platform && convertCustomTypes) {
        const method = typeof convertCustomTypes === 'string' ? convertCustomTypes : 'convertToJSValue';
        return prop.customType[method](value, platform);
      }

      return value;
    }) as Primary<T>;
  }

  static getCompositeKeyHash<T>(data: EntityData<T>, meta: EntityMetadata<T>, convertCustomTypes = false, platform?: Platform, flat = false): string {
    let pks = this.getCompositeKeyValue(data, meta, convertCustomTypes, platform);

    if (flat) {
      pks = Utils.flatten(pks as unknown[][]) as Primary<T>;
    }

    return Utils.getPrimaryKeyHash(pks as string[]);
  }

  static getPrimaryKeyHash(pks: (string | Buffer)[]): string {
    return pks.map(pk => Buffer.isBuffer(pk) ? pk.toString('hex') : pk).join(this.PK_SEPARATOR);
  }

  static splitPrimaryKeys<T extends object>(key: string): EntityKey<T>[] {
    return key.split(this.PK_SEPARATOR) as EntityKey<T>[];
  }

  static getPrimaryKeyValues<T>(entity: T, primaryKeys: string[], allowScalar = false, convertCustomTypes = false) {
    /* istanbul ignore next */
    if (entity == null) {
      return entity;
    }

    function toArray(val: unknown): unknown {
      if (Utils.isPlainObject(val)) {
        return Object.values(val).flatMap(v => toArray(v));
      }

      return val;
    }

    const pk = Utils.isEntity(entity, true)
      ? helper(entity).getPrimaryKey(convertCustomTypes)
      : primaryKeys.reduce((o, pk) => { o[pk] = entity[pk]; return o; }, {} as Dictionary);

    if (primaryKeys.length > 1) {
      return toArray(pk!);
    }

    if (allowScalar) {
      if (Utils.isPlainObject(pk)) {
        return pk[primaryKeys[0]];
      }

      return pk;
    }

    return [pk];
  }

  static getPrimaryKeyCond<T>(entity: T, primaryKeys: EntityKey<T>[]): Record<string, Primary<T>> | null {
    const cond = primaryKeys.reduce((o, pk) => {
      o[pk] = Utils.extractPK(entity[pk]);
      return o;
    }, {} as any);

    if (Object.values(cond).some(v => v === null)) {
      return null;
    }

    return cond;
  }

  /**
   * Maps nested FKs from `[1, 2, 3]` to `[1, [2, 3]]`.
   */
  static mapFlatCompositePrimaryKey(fk: Primary<any>[], prop: EntityProperty, fieldNames = prop.fieldNames, idx = 0): Primary<any> | Primary<any>[] {
    if (!prop.targetMeta) {
      return fk[idx++];
    }

    const parts: Primary<any>[] = [];

    for (const pk of prop.targetMeta.getPrimaryProps()) {
      parts.push(this.mapFlatCompositePrimaryKey(fk, pk, fieldNames, idx));
      idx += pk.fieldNames.length;
    }

    if (parts.length < 2) {
      return parts[0];
    }

    return parts;
  }

  static getPrimaryKeyCondFromArray<T extends object>(pks: Primary<T>[], meta: EntityMetadata<T>): Record<string, Primary<T>> {
    return meta.getPrimaryProps().reduce((o, pk, idx) => {
      if (Array.isArray(pks[idx]) && pk.targetMeta) {
        o[pk.name] = pks[idx];
      } else {
        o[pk.name] = Utils.extractPK<T>(pks[idx], meta);
      }

      return o;
    }, {} as any);
  }

  static getOrderedPrimaryKeys<T>(id: Primary<T> | Record<string, Primary<T>>, meta: EntityMetadata<T>): Primary<T>[] {
    const data = (Utils.isPrimaryKey(id) ? { [meta.primaryKeys[0]]: id } : id) as Record<string, Primary<T>>;
    const pks = meta.primaryKeys.map((pk, idx) => {
      const prop = meta.properties[pk];
      // `data` can be a composite PK in form of array of PKs, or a DTO
      let value = Array.isArray(data) ? data[idx] : (data[pk] ?? data);

      if (prop.kind !== ReferenceKind.SCALAR && prop.targetMeta) {
        const value2 = this.getOrderedPrimaryKeys(value, prop.targetMeta);
        value = value2.length > 1 ? value2 : value2[0];
      }

      return value;
    });

    // we need to flatten the PKs as composite PKs can be build from another composite PKs
    // and this method is used to get the PK hash in identity map, that expects flat array
    return Utils.flatten(pks) as Primary<T>[];
  }

  /**
   * Checks whether given object is an entity instance.
   */
  static isEntity<T = unknown>(data: any, allowReference = false): data is T & {} {
    if (!Utils.isObject(data)) {
      return false;
    }

    if (allowReference && !!data.__reference) {
      return true;
    }

    return !!data.__entity;
  }

  /**
   * Checks whether given object is a scalar reference.
   */
  static isScalarReference<T = unknown>(data: any, allowReference = false): data is ScalarReference<any> & {} {
    return typeof data === 'object' && data?.__scalarReference;
  }

  /**
   * Checks whether the argument is ObjectId instance
   */
  static isObjectID(key: any) {
    return Utils.isObject(key) && key.constructor && key.constructor.name.toLowerCase() === 'objectid';
  }

  /**
   * Checks whether the argument is empty (array without items, object without keys or falsy value).
   */
  static isEmpty(data: any): boolean {
    if (Array.isArray(data)) {
      return data.length === 0;
    }

    if (Utils.isObject(data)) {
      return !Utils.hasObjectKeys(data);
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
    /* istanbul ignore next */
    return process.argv[0].endsWith('ts-node') // running via ts-node directly
      // @ts-ignore
      || !!process[Symbol.for('ts-node.register.instance')] // check if internal ts-node symbol exists
      || !!process.env.TS_JEST // check if ts-jest is used (works only with v27.0.4+)
      || !!process.env.VITEST // check if vitest is used
      || process.argv.slice(1).some(arg => arg.includes('ts-node')) // registering ts-node runner
      || (require.extensions && !!require.extensions['.ts']); // check if the extension is registered
  }

  /**
   * Uses some dark magic to get source path to caller where decorator is used.
   * Analyses stack trace of error created inside the function call.
   */
  static lookupPathFromDecorator(name: string, stack?: string[]): string {
    // use some dark magic to get source path to caller
    stack = stack || new Error().stack!.split('\n');
    // In some situations (e.g. swc 1.3.4+), the presence of a source map can obscure the call to
    // __decorate(), replacing it with the constructor name. To support these cases we look for
    // Reflect.decorate() as well.
    let line = stack.findIndex(line => line.includes('__decorate') || line.includes('Reflect.decorate'))!;

    if (line === -1) {
      return name;
    }

    if (stack[line].includes('Reflect.decorate')) {
      line++;
    }

    if (Utils.normalizePath(stack[line]).includes('node_modules/tslib/tslib')) {
      line++;
    }

    try {
      const re = stack[line].match(/\(.+\)/i) ? /\((.*):\d+:\d+\)/ : /at\s*(.*):\d+:\d+$/;
      return Utils.normalizePath(stack[line].match(re)![1]);
    } catch {
      return name;
    }
  }

  /**
   * Gets the type of the argument.
   */
  static getObjectType(value: any): string {
    const simple = typeof value;

    if (['string', 'number', 'boolean', 'bigint'].includes(simple)) {
      return simple;
    }

    const objectType = Object.prototype.toString.call(value);
    const type = objectType.match(/\[object (\w+)]/)![1];

    if (type === 'Uint8Array') {
      return 'Buffer';
    }

    return ['Date', 'Buffer', 'RegExp'].includes(type) ? type : type.toLowerCase();
  }

  /**
   * Checks whether the value is POJO (e.g. `{ foo: 'bar' }`, and not instance of `Foo`)
   */
  static isPlainObject<T extends Dictionary>(value: any): value is T {
    return (
      value !== null
      && typeof value === 'object'
      && typeof value.constructor === 'function'
      // eslint-disable-next-line no-prototype-builtins
      && (value.constructor.prototype.hasOwnProperty('isPrototypeOf') || Object.getPrototypeOf(value.constructor.prototype) === null)
    )
      || (value && Object.getPrototypeOf(value) === null)
      || value instanceof PlainObject;
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

  static isCollection<T extends object, O extends object = object>(item: any): item is Collection<T, O> {
    return item?.__collection;
  }

  static fileURLToPath(url: string | URL) {
    // expose `fileURLToPath` on Utils so that it can be properly mocked in tests
    return fileURLToPath(url);
  }

  /**
   * Resolves and normalizes a series of path parts relative to each preceeding part.
   * If any part is a `file:` URL, it is converted to a local path. If any part is an
   * absolute path, it replaces preceeding paths (similar to `path.resolve` in NodeJS).
   * Trailing directory separators are removed, and all directory separators are converted
   * to POSIX-style separators (`/`).
   */
  static normalizePath(...parts: string[]): string {
    let start = 0;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (isAbsolute(part)) {
        start = i;
      } else if (part.startsWith('file:')) {
        start = i;
        parts[i] = Utils.fileURLToPath(part);
      }
    }
    if (start > 0) {
      parts = parts.slice(start);
    }

    let path = parts.join('/').replace(/\\/g, '/').replace(/\/$/, '');
    path = normalize(path).replace(/\\/g, '/');

    return (path.match(/^[/.]|[a-zA-Z]:/) || path.startsWith('!')) ? path : './' + path;
  }

  /**
   * Determines the relative path between two paths. If either path is a `file:` URL,
   * it is converted to a local path.
   */
  static relativePath(path: string, relativeTo: string): string {
    if (!path) {
      return path;
    }

    path = Utils.normalizePath(path);

    if (path.startsWith('.')) {
      return path;
    }

    path = relative(Utils.normalizePath(relativeTo), path);

    return Utils.normalizePath(path);
  }

  /**
   * Computes the absolute path to for the given path relative to the provided base directory.
   * If either `path` or `baseDir` are `file:` URLs, they are converted to local paths.
   */
  static absolutePath(path: string, baseDir = process.cwd()): string {
    if (!path) {
      return Utils.normalizePath(baseDir);
    }

    if (!isAbsolute(path) && !path.startsWith('file://')) {
      path = baseDir + '/' + path;
    }

    return Utils.normalizePath(path);
  }

  static hash(data: string, length?: number): string {
    const hash = createHash('md5').update(data).digest('hex');

    if (length) {
      return hash.substring(0, length);
    }

    return hash;
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

  static removeDuplicates<T>(items: T[]): T[] {
    const ret: T[] = [];
    const contains = (arr: unknown[], val: unknown) => !!arr.find(v => equals(val, v));

    for (const item of items) {
      if (!contains(ret, item)) {
        ret.push(item);
      }
    }

    return ret;
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
    const constEnum = values.length % 2 === 0 // const enum will have even number of items
      && values.slice(0, values.length / 2).every(v => typeof v === 'string') // first half are strings
      && values.slice(values.length / 2).every(v => typeof v === 'number') // second half are numbers
      && this.equals(keys, values.slice(values.length / 2).concat(values.slice(0, values.length / 2)).map(v => '' + v)); // and when swapped, it will match the keys

    if (numeric || constEnum) {
      return values.filter(val => !keys.includes(val as string));
    }

    return values;
  }

  static flatten<T>(arrays: T[][]): T[] {
    return ([] as T[]).concat.apply([], arrays);
  }

  static isOperator(key: PropertyKey, includeGroupOperators = true): boolean {
    if (!includeGroupOperators) {
      return key in QueryOperator;
    }

    return key in GroupOperator || key in QueryOperator;
  }

  static isGroupOperator(key: PropertyKey): boolean {
    return key in GroupOperator;
  }

  static isArrayOperator(key: PropertyKey): boolean {
    return ARRAY_OPERATORS.includes(key as string);
  }

  static hasNestedKey(object: unknown, key: string): boolean {
    if (!object) {
      return false;
    }

    if (Array.isArray(object)) {
      return object.some(o => this.hasNestedKey(o, key));
    }

    if (typeof object === 'object') {
      return Object.entries(object).some(([k, v]) => k === key || this.hasNestedKey(v, key));
    }

    return false;
  }

  static getGlobalStorage(namespace: string): Dictionary {
    const key = `mikro-orm-${namespace}` as keyof typeof globalThis;
    (globalThis as Dictionary)[key] = globalThis[key] || {};

    return globalThis[key];
  }

  /**
   * Require a module from a specific location
   * @param id The module to require
   * @param [from] Location to start the node resolution
   */
  static requireFrom<T extends Dictionary>(id: string, from = process.cwd()): T {
    if (!extname(from)) {
      from = join(from, '__fake.js');
    }

    return createRequire(resolve(from))(id);
  }

  /**
   * Hack to keep dynamic imports even when compiling to CJS.
   * We can't use it always, as it would break ts-node.
   * @see https://github.com/microsoft/TypeScript/issues/43329#issuecomment-922544562
   */
  static async dynamicImport<T = any>(id: string): Promise<T> {
    if (id.endsWith('.json') || process.env.TS_JEST) {
      return require(id);
    }

    /* istanbul ignore next */
    if (platform() === 'win32') {
      try {
        id = pathToFileURL(id).toString();
      } catch {
        // ignore
      }
    }

    /* istanbul ignore next */
    return this.dynamicImportProvider(id);
  }

  /* istanbul ignore next */
  static setDynamicImportProvider(provider: (id: string) => Promise<unknown>): void {
    this.dynamicImportProvider = provider;
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

  /* istanbul ignore next */
  static createFunction(context: Map<string, any>, code: string) {
    try {
      return new Function(...context.keys(), `'use strict';\n` + code)(...context.values());
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(code);
      throw e;
    }
  }

  /* istanbul ignore next */
  static callCompiledFunction<T extends unknown[], R>(fn: (...args: T) => R, ...args: T) {
    try {
      return fn(...args);
    } catch (e: any) {
      if ([SyntaxError, TypeError, EvalError, ReferenceError].some(t => e instanceof t)) {
        const position = e.stack.match(/<anonymous>:(\d+):(\d+)/);
        let code = fn.toString();

        if (position) {
          const lines = code.split('\n').map((line, idx) => {
            if (idx === +position[1] - 5) {
              return '> ' + line;
            }

            return '  ' + line;
          });
          lines.splice(+position[1] - 4, 0, ' '.repeat(+position[2]) + '^');
          code = lines.join('\n');
        }

        // eslint-disable-next-line no-console
        console.error(`JIT runtime error: ${e.message}\n\n${code}`);
      }

      throw e;
    }
  }

  /**
   * @see https://github.com/mikro-orm/mikro-orm/issues/840
   */
  static propertyDecoratorReturnValue(): any {
    if (process.env.BABEL_DECORATORS_COMPAT) {
      return {};
    }
  }

  static unwrapProperty<T>(entity: T, meta: EntityMetadata<T>, prop: EntityProperty<T>, payload = false): [unknown, number[]][] {
    let p = prop;
    const path: string[] = [];

    function isObjectProperty(prop: EntityProperty): boolean {
      return prop.embedded ? prop.object || prop.array || isObjectProperty(meta.properties[prop.embedded[0] as EntityKey<T>]) : prop.object || !!prop.array;
    }

    if (!isObjectProperty(prop) && !prop.embedded) {
      return entity[prop.name] != null ? [[entity[prop.name], []]] : [];
    }

    while (p.embedded) {
      const child = meta.properties[p.embedded[0]];

      if (payload && !child.object && !child.array) {
        break;
      }

      path.shift();
      path.unshift(p.embedded[0], p.embedded[1]);
      p = child;
    }

    const ret: [unknown, number[]][] = [];
    const follow = (t: Dictionary | Dictionary[], idx = 0, i: number[] = []): void => {
      const k = path[idx];

      if (Array.isArray(t)) {
        return t.forEach((t, ii) => follow(t, idx, [...i, ii]));
      }

      if (t == null) {
        return;
      }

      const target = t[k];

      if (path[++idx]) {
        follow(target, idx, i);
      } else if (target != null) {
        ret.push([target, i]);
      }
    };
    follow(entity as Dictionary);

    return ret;
  }

  static setPayloadProperty<T>(entity: EntityDictionary<T>, meta: EntityMetadata<T>, prop: EntityProperty<T>, value: unknown, idx: number[]): void {
    function isObjectProperty(prop: EntityProperty): boolean {
      return prop.embedded ? prop.object || prop.array || isObjectProperty(meta.properties[prop.embedded[0] as EntityKey<T>]) : prop.object || !!prop.array;
    }

    if (!isObjectProperty(prop)) {
      entity[prop.name] = value as T[keyof T & string];
      return;
    }

    let target = entity as Dictionary;
    let p = prop;
    const path: string[] = [];

    while (p.embedded) {
      path.shift();
      path.unshift(p.embedded[0], p.embedded[1]);
      const prev = p;
      p = meta!.properties[p.embedded[0]];

      if (!p.object) {
        path.shift();
        path[0] = prev.name;
        break;
      }
    }

    let j = 0;
    path.forEach((k, i) => {
      if (i === path.length - 1) {
        if (Array.isArray(target)) {
          target[idx[j++]][k] = value;
        } else {
          target[k] = value;
        }
      } else {
        if (Array.isArray(target)) {
          target = target[idx[j++]][k];
        } else {
          target = target[k];
        }
      }
    });
  }

  static tryRequire<T extends Dictionary = any>({ module, from, allowError, warning }: { module: string; warning: string; from?: string; allowError?: string }): T | undefined {
    allowError ??= `Cannot find module '${module}'`;
    from ??= process.cwd();

    try {
      return Utils.requireFrom<T>(module, from);
    } catch (err: any) {
      if (err.message.includes(allowError)) {
        // eslint-disable-next-line no-console
        console.warn(warning);
        return undefined;
      }

      throw err;
    }

  }

  static stripRelativePath(str: string): string {
    return str.replace(/^(?:\.\.\/|\.\/)+/, '/');
  }

  /**
   * simple process.argv parser, supports only properties with long names, prefixed with `--`
   */
  static parseArgs<T extends Dictionary = Dictionary>(): T {
    let lastKey: string | undefined;

    return process.argv.slice(2).reduce((args, arg) => {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        args[key.substring(2)] = value;
      } else if (lastKey) {
        args[lastKey] = arg;
        lastKey = undefined;
      } else if (arg.startsWith('--')) {
        lastKey = arg.substring(2);
      }

      return args;
    }, {} as Dictionary) as T;
  }

  static xor(a: boolean, b: boolean): boolean {
    return (a || b) && !(a && b);
  }

  static keys<T extends object>(obj: T) {
    return Object.keys(obj) as (keyof T)[];
  }

  static values<T extends object>(obj: T) {
    return Object.values(obj) as T[keyof T][];
  }

  static entries<T extends object>(obj: T) {
    return Object.entries(obj) as [keyof T, T[keyof T]][];
  }

  static isRawSql(value: unknown): value is { sql: string; params: unknown[]; use: () => void } {
    return typeof value === 'object' && !!value && '__raw' in value;
  }

  static primaryKeyToObject<T>(meta: EntityMetadata<T>, primaryKey: Primary<T> | T) {
    const pks = meta.compositePK && Utils.isPlainObject(primaryKey) ? Object.values(primaryKey) : Utils.asArray(primaryKey);
    const pkProps = meta.getPrimaryProps();

    return meta.primaryKeys.reduce((o, pk, idx) => {
      const pkProp = pkProps[idx];

      if (Utils.isPlainObject(pks[idx]) && pkProp.targetMeta) {
        o[pk] = Utils.getOrderedPrimaryKeys(pks[idx], pkProp.targetMeta) as any;
        return o;
      }

      o[pk] = pks[idx] as any;
      return o;
    }, {} as T);
  }

}
