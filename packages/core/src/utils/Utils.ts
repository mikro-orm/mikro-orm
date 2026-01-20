import { clone } from './clone.js';
import type {
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityKey,
  EntityMetadata,
  EntityName,
  EntityProperty,
  Primary,
} from '../typings.js';
import { GroupOperator, PlainObject, QueryOperator, ReferenceKind } from '../enums.js';
import type { Collection } from '../entity/Collection.js';
import type { Platform } from '../platforms/Platform.js';
import { helper } from '../entity/wrap.js';
import type { ScalarReference } from '../entity/Reference.js';
import { Raw, type RawQueryFragmentSymbol } from './RawQueryFragment.js';

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
  if (a === b || (a == null && b == null)) {
    return true;
  }

  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || !compareConstructors(a, b)) {
    return false;
  }

  if (a.__raw && b.__raw) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return a.sql === b.sql && compareArrays(a.params, b.params);
  }

  if ((a instanceof Date && b instanceof Date)) {
    const timeA = a.getTime();
    const timeB = b.getTime();
    if (isNaN(timeA) || isNaN(timeB)) {
      throw new Error('Comparing invalid dates is not supported');
    }
    return timeA === timeB;
  }

  /* v8 ignore next */
  if (
    (typeof a === 'function' && typeof b === 'function') ||
    (a instanceof RegExp && b instanceof RegExp) ||
    (a instanceof String && b instanceof String) ||
    (a instanceof Number && b instanceof Number)
  ) {
    return a.toString() === b.toString();
  }

  const keys = Object.keys(a);
  const length = keys.length;

  if (length !== Object.keys(b).length) {
    return false;
  }

  for (let i = length; i-- !== 0;) {
    if (!Object.hasOwn(b, keys[i])) {
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
    /* v8 ignore next */
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
  static readonly #ORM_VERSION = '[[MIKRO_ORM_VERSION]]';

  /**
   * Checks if the argument is instance of `Object`. Returns false for arrays.
   */
  static isObject<T = Dictionary>(o: any): o is T {
    return !!o && typeof o === 'object' && !Array.isArray(o);
  }

  /**
   * Removes `undefined` properties (recursively) so they are not saved as nulls
   */
  static dropUndefinedProperties(o: any, value?: undefined | null, visited = new Set()): void {
    if (Array.isArray(o)) {
      for (const item of o) {
        Utils.dropUndefinedProperties(item, value, visited);
      }

      return;
    }

    if (!Utils.isPlainObject(o) || visited.has(o)) {
      return;
    }

    visited.add(o);

    for (const key of Object.keys(o)) {
      if (o[key] === value) {
        delete o[key];
        continue;
      }

      Utils.dropUndefinedProperties(o[key], value, visited);
    }
  }

  /**
   * Returns the number of properties on `obj`. This is 20x faster than Object.keys(obj).length.
   * @see https://github.com/deepkit/deepkit-framework/blob/master/packages/core/src/core.ts
   */
  static getObjectKeysSize(object: Dictionary): number {
    let size = 0;

    for (const key in object) {
      if (Object.hasOwn(object, key)) {
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
      if (Object.hasOwn(object, key)) {
        return true;
      }
    }

    return false;
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
    if (items.length < 2) {
      return items;
    }

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
  static mergeConfig<T>(target: T, ...sources: Dictionary[]): T {
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
      for (const [key, value] of Object.entries(source)) {
        if (ignoreUndefined && typeof value === 'undefined') {
          continue;
        }

        if (Utils.isPlainObject(value)) {
          if (!Utils.isObject(target[key])) {
            target[key] = Utils.copy(value);
            continue;
          }

          /* v8 ignore next */
          if (!(key in target)) {
            Object.assign(target, { [key]: {} });
          }

          Utils._merge(target[key], [value], ignoreUndefined);
        } else {
          Object.assign(target, { [key]: value });
        }
      }
    }

    return Utils._merge(target, sources, ignoreUndefined);
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
      for (const key of Object.keys(payload)) {
        const value = payload[key];
        delete payload[key];
        payload[from === key ? to : key as keyof T] = value;
      }
    }
  }

  /**
   * Returns array of functions argument names. Uses basic regex for source code analysis, might not work with advanced syntax.
   */
  static getConstructorParams(func: { toString(): string }): string[] | undefined {
    const source = func.toString();
    const i = source.indexOf('constructor');

    if (i === -1) {
      return undefined;
    }

    const start = source.indexOf('(', i);

    if (start === -1) {
      return undefined;
    }

    let depth = 0;
    let end = start;

    for (; end < source.length; end++) {
      if (source[end] === '(') {
        depth++;
      }

      if (source[end] === ')') {
        depth--;
      }

      if (depth === 0) {
        break;
      }
    }

    const raw = source.slice(start + 1, end);

    return raw
      .split(',')
      .map(s => s.trim().replace(/=.*$/, '').trim())
      .filter(Boolean)
      .map(raw => raw.startsWith('{') && raw.endsWith('}') ? '' : raw);
  }

  /**
   * Checks whether the argument looks like primary key (string, number or ObjectId).
   */
  static isPrimaryKey<T>(key: any, allowComposite = false): key is Primary<T> {
    if (['string', 'number', 'bigint'].includes(typeof key)) {
      return true;
    }

    if (allowComposite && Array.isArray(key) && key.every(v => Utils.isPrimaryKey(v, true))) {
      return true;
    }

    if (Utils.isObject(key)) {
      if (key.constructor?.name === 'ObjectId') {
        return true;
      }

      if (!Utils.isPlainObject(key) && !Utils.isEntity(key, true)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extracts primary key from `data`. Accepts objects or primary keys directly.
   */
  static extractPK<T extends object>(data: any, meta?: EntityMetadata<T>, strict = false): Primary<T> | string | null {
    if (Utils.isPrimaryKey(data)) {
      return data as Primary<T>;
    }

    if (Utils.isEntity<T>(data, true)) {
      const wrapped = helper(data);

      if (wrapped.__meta.compositePK) {
        return wrapped.getPrimaryKeys() as Primary<T>;
      }

      return wrapped.getPrimaryKey() as Primary<T>;
    }

    if (strict && meta && Utils.getObjectKeysSize(data) !== meta.primaryKeys.length) {
      return null;
    }

    if (Utils.isPlainObject(data) && meta) {
      if (meta.compositePK) {
        return this.getCompositeKeyValue(data as T, meta);
      }

      return data[meta.primaryKeys[0]] ?? data[meta.serializedPrimaryKey!] ?? null;
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

  static getPrimaryKeyHash(pks: (string | Buffer | Date)[]): string {
    return pks.map(pk => {
      if (Buffer.isBuffer(pk)) {
        return pk.toString('hex');
      }

      if (pk instanceof Date) {
        return pk.toISOString();
      }

      return pk;
    }).join(this.PK_SEPARATOR);
  }

  static splitPrimaryKeys<T extends object>(key: string): EntityKey<T>[] {
    return key.split(this.PK_SEPARATOR) as EntityKey<T>[];
  }

  static getPrimaryKeyValues<T>(entity: T, meta: EntityMetadata<T>, allowScalar = false, convertCustomTypes = false) {
    /* v8 ignore next */
    if (entity == null) {
      return entity;
    }

    function toArray(val: unknown): unknown {
      if (Utils.isPlainObject(val)) {
        return Object.values(val).flatMap(v => toArray(v));
      }

      return val;
    }

    let pk;

    if (Utils.isEntity(entity, true)) {
      pk = helper(entity).getPrimaryKey(convertCustomTypes);
    } else {
      pk = meta.primaryKeys.reduce((o, pk) => {
        const targetMeta = meta.properties[pk as EntityKey<T>].targetMeta;

        if (targetMeta && Utils.isPlainObject(entity[pk])) {
          o[pk] = Utils.getPrimaryKeyValues(entity[pk], targetMeta, allowScalar, convertCustomTypes);
        } else {
          o[pk] = entity[pk];
        }

        return o;
      }, {} as Dictionary);
    }

    if (meta.primaryKeys.length > 1) {
      return toArray(pk!);
    }

    if (allowScalar) {
      if (Utils.isPlainObject(pk)) {
        return pk[(meta.primaryKeys)[0]];
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

  static getOrderedPrimaryKeys<T>(id: Primary<T> | Record<string, Primary<T>>, meta: EntityMetadata<T>, platform?: Platform, convertCustomTypes = false, allowScalar = false): Primary<T>[] {
    const data = (Utils.isPrimaryKey(id) ? { [meta.primaryKeys[0]]: id } : id) as Record<string, Primary<T>>;
    const pks = meta.primaryKeys.map((pk, idx) => {
      const prop = meta.properties[pk];
      // `data` can be a composite PK in form of array of PKs, or a DTO
      let value = Array.isArray(data) ? data[idx] : (data[pk] ?? data);

      if (convertCustomTypes && platform && prop.customType && !prop.targetMeta) {
        value = prop.customType.convertToJSValue(value, platform);
      }

      if (prop.kind !== ReferenceKind.SCALAR && prop.targetMeta) {
        const value2 = this.getOrderedPrimaryKeys(value, prop.targetMeta, platform, convertCustomTypes, allowScalar);
        value = value2.length > 1 ? value2 : value2[0];
      }

      return value;
    });

    if (allowScalar && pks.length === 1) {
      return pks[0] as Primary<T>[];
    }

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
  static className<T>(classOrName: string | EntityName<T>): string {
    if (typeof classOrName === 'string') {
      return classOrName;
    }

    return classOrName.name as string;
  }

  static extractChildElements(items: string[], prefix: string, allSymbol?: string) {
    return items
      .filter(field => field === allSymbol || field.startsWith(`${prefix}.`))
      .map(field => field === allSymbol ? allSymbol : field.substring(prefix.length + 1));
  }

  /**
   * Tries to detect TypeScript support.
   */
  static detectTypeScriptSupport(): boolean {
    /* v8 ignore next */
    const process = globalThis.process ?? {};

    /* v8 ignore next */
    return process.argv?.[0]?.endsWith('ts-node') // running via ts-node directly
      || !!process.env?.MIKRO_ORM_CLI_ALWAYS_ALLOW_TS // forced explicitly or enabled via `registerTypeScriptSupport()`
      || !!process.env?.TS_JEST // check if ts-jest is used
      || !!process.env?.VITEST // check if vitest is used
      || !!process.versions?.bun // check if bun is used
      || process.argv?.slice(1).some(arg => arg.match(/\.([mc]?ts|tsx)$/)) // executing `.ts` file
      || process.execArgv?.some(arg => {
        return arg.includes('ts-node') // check for ts-node loader
          || arg.includes('@swc-node/register') // check for swc-node/register loader
          || arg.includes('node_modules/tsx/'); // check for tsx loader
      });
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
    const type = objectType.match(/^\[object (.+)]$/)![1];

    if (type === 'Uint8Array') {
      return 'Buffer';
    }

    return type;
  }

  /**
   * Checks whether the value is POJO (e.g. `{ foo: 'bar' }`, and not instance of `Foo`)
   */
  static isPlainObject<T extends Dictionary>(value: any): value is T {
    return (
      value !== null
      && typeof value === 'object'
      && typeof value.constructor === 'function'
      && (Object.hasOwn(value.constructor.prototype, 'isPrototypeOf') || Object.getPrototypeOf(value.constructor.prototype) === null)
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

  // FNV-1a 64-bit
  static hash(data: string, length?: number): string {
    let h1 = 0xcbf29ce484222325n;

    for (let i = 0; i < data.length; i++) {
      h1 ^= BigInt(data.charCodeAt(i));
      h1 = (h1 * 0x100000001b3n) & 0xffffffffffffffffn;
    }

    const hash = h1.toString(16).padStart(16, '0');

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

  static flatten<T>(arrays: T[][], deep?: boolean): T[] {
    return arrays.flatMap(v => deep && Array.isArray(v) ? this.flatten(v as unknown as T[][], true) : v) as T[];
  }

  static isOperator(key: PropertyKey, includeGroupOperators = true): boolean {
    if (!includeGroupOperators) {
      return key in QueryOperator;
    }

    return key in GroupOperator || key in QueryOperator;
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

  static getORMVersion(): string {
    return this.#ORM_VERSION;
  }

  static createFunction(context: Map<string, any>, code: string) {
    try {
      return new Function(...context.keys(), `'use strict';\n` + code)(...context.values());
      /* v8 ignore next */
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(code);
      throw e;
    }
  }

  static callCompiledFunction<T extends unknown[], R>(fn: (...args: T) => R, ...args: T) {
    try {
      return fn(...args);
    } catch (e: any) {
      /* v8 ignore next */
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

  static unwrapProperty<T>(entity: T, meta: EntityMetadata<T>, prop: EntityProperty<T>, payload = false): [unknown, number[]][] {
    let p = prop;
    const path: string[] = [];

    if (!prop.object && !prop.array && !prop.embedded) {
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
        for (const t1 of t) {
          const ii = t.indexOf(t1);
          follow(t1, idx, [...i, ii]);
        }
        return;
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
    if (!prop.object && !prop.array && !prop.embedded) {
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
    for (const k of path) {
      const i = path.indexOf(k);
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
    }
  }

  static async tryImport<T extends Dictionary = any>({ module, warning }: { module: string; warning?: string }): Promise<T | undefined> {
    try {
      return await import(module);
    } catch (err: any) {
      if (err.code === 'ERR_MODULE_NOT_FOUND') {
        if (warning) {
          // eslint-disable-next-line no-console
          console.warn(warning);
        }

        return undefined;
      }

      throw err;
    }
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

  static primaryKeyToObject<T>(meta: EntityMetadata<T>, primaryKey: Primary<T> | T, visible?: (keyof T)[]) {
    const pks = meta.compositePK && Utils.isPlainObject(primaryKey) ? Object.values(primaryKey) : Utils.asArray(primaryKey);
    const pkProps = meta.getPrimaryProps();

    return meta.primaryKeys.reduce((o, pk, idx) => {
      const pkProp = pkProps[idx];

      if (visible && !visible.includes(pkProp.name)) {
        return o;
      }

      if (Utils.isPlainObject(pks[idx]) && pkProp.targetMeta) {
        o[pk] = Utils.getOrderedPrimaryKeys(pks[idx], pkProp.targetMeta) as any;
        return o;
      }

      o[pk] = pks[idx] as any;
      return o;
    }, {} as T);
  }

  static getObjectQueryKeys<T extends Dictionary, K extends string = Extract<keyof T, string>>(obj: T) {
    return Reflect.ownKeys(obj).filter(key => {
      if (!Object.prototype.propertyIsEnumerable.call(obj, key)) {
        return false;
      }

      return typeof key === 'string' || Raw.isKnownFragmentSymbol(key);
    }) as (K | RawQueryFragmentSymbol)[];
  }

}
