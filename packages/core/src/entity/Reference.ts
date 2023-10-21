import { inspect } from 'util';
import type {
  ConnectionType,
  Dictionary,
  EntityClass,
  EntityProperty,
  Loaded,
  EntityKey,
  LoadedReference,
  Populate,
  Primary,
  Ref, AddEager,
} from '../typings';
import type { EntityFactory } from './EntityFactory';
import type { LockMode } from '../enums';
import { helper, wrap } from './wrap';
import { Utils } from '../utils/Utils';

export class Reference<T extends object> {

  constructor(private entity: T) {
    this.set(entity);
    const meta = helper(this.entity).__meta;

    meta.primaryKeys.forEach(primaryKey => {
      Object.defineProperty(this, primaryKey, {
        get() {
          return this.entity[primaryKey];
        },
      });
    });

    if (meta.serializedPrimaryKey && meta.primaryKeys[0] !== meta.serializedPrimaryKey) {
      Object.defineProperty(this, meta.serializedPrimaryKey, {
        get() {
          return helper(this.entity).getSerializedPrimaryKey();
        },
      });
    }
  }

  static create<T extends object>(entity: T | Ref<T>): Ref<T> {
    const unwrapped = Reference.unwrapReference(entity);
    const ref = helper(entity).toReference() as Ref<T>;

    if (unwrapped !== ref.unwrap()) {
      ref.set(unwrapped);
    }

    return ref;
  }

  static createFromPK<T extends object>(entityType: EntityClass<T>, pk: Primary<T>, options?: { schema?: string }): Ref<T> {
    const ref = this.createNakedFromPK(entityType, pk, options);
    return helper(ref).toReference();
  }

  static createNakedFromPK<T extends object>(entityType: EntityClass<T>, pk: Primary<T>, options?: { schema?: string }): T {
    const factory = entityType.prototype.__factory as EntityFactory;
    const entity = factory.createReference(entityType, pk, {
      merge: false,
      convertCustomTypes: false,
      ...options,
    });

    const wrapped = helper(entity);
    wrapped.__meta.primaryKeys.forEach(key => wrapped.__loadedProperties.add(key));
    wrapped.__originalEntityData = factory.getComparator().prepareEntity(entity);

    return entity;
  }

  /**
   * Checks whether the argument is instance of `Reference` wrapper.
   */
  static isReference<T extends object>(data: any): data is Reference<T> {
    return data && !!data.__reference;
  }

  /**
   * Wraps the entity in a `Reference` wrapper if the property is defined as `ref`.
   */
  static wrapReference<T extends object>(entity: T | Reference<T>, prop: EntityProperty<T>): Reference<T> | T {
    if (entity && prop.ref && !Reference.isReference(entity)) {
      return Reference.create(entity as T);
    }

    return entity;
  }

  /**
   * Returns wrapped entity.
   */
  static unwrapReference<T extends object>(ref: T | Reference<T>): T {
    return Reference.isReference<T>(ref) ? (ref as Reference<T>).unwrap() : ref;
  }

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns the entity.
   */
  async load<TT extends T, P extends string = never>(options?: LoadReferenceOptions<T, P>): Promise<Loaded<TT, P>>;

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns the requested property instead of the whole entity.
   */
  async load<K extends keyof T>(prop: K): Promise<T[K]>;

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns either the whole entity, or the requested property.
   */
  async load<TT extends T, K extends keyof T = never, P extends string = never>(options?: LoadReferenceOptions<T, P> | K): Promise<Loaded<TT, P> | T[K]> {
    const opts: Dictionary = typeof options === 'object' ? options : { prop: options };

    if (!this.isInitialized()) {
      await helper(this.entity).init(undefined, opts?.populate, opts?.lockMode, opts?.connectionType);
    }

    if (opts.prop) {
      return this.entity[opts.prop as EntityKey];
    }

    return this.entity as Loaded<TT, P>;
  }

  set<TT extends T>(entity: TT | Ref<TT>): void {
    this.entity = Reference.unwrapReference(entity as T & object);
    delete helper(this.entity).__reference;
  }

  unwrap(): T {
    return this.entity;
  }

  getEntity(): T {
    if (!this.isInitialized()) {
      throw new Error(`Reference<${helper(this.entity).__meta.name}> ${helper(this.entity).getPrimaryKey()} not initialized`);
    }

    return this.entity;
  }

  getProperty<K extends keyof T>(prop: K): T[K] {
    return this.getEntity()[prop];
  }

  isInitialized(): boolean {
    return helper(this.entity).__initialized;
  }

  populated(populated?: boolean): void {
    helper(this.entity).populated(populated);
  }

  toJSON(...args: any[]): Dictionary {
    return wrap(this.entity).toJSON!(...args);
  }

  /* istanbul ignore next */
  [inspect.custom](depth: number) {
    const object = { ...this };
    const hidden = ['meta'];
    hidden.forEach(k => delete object[k as keyof this]);
    const ret = inspect(object, { depth });
    const wrapped = helper(this.entity);
    const meta = wrapped.__meta;
    const pk = wrapped.hasPrimaryKey() ? '<' + wrapped.getSerializedPrimaryKey() + '>' : '';
    const name = `Ref<${meta.className}${pk}>`;

    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

Object.defineProperties(Reference.prototype, {
  __reference: { value: true, enumerable: false },
  __meta: { get() { return this.entity.__meta!; } },
  __platform: { get() { return this.entity.__platform!; } },
  __helper: { get() { return this.entity.__helper!; } },
  $: { get() { return this.entity; } },
  get: { get() { return () => this.entity; } },
});

export interface LoadReferenceOptions<T, P extends string = never> {
  populate?: Populate<T, P>;
  lockMode?: Exclude<LockMode, LockMode.OPTIMISTIC>;
  connectionType?: ConnectionType;
}

/**
 * shortcut for `wrap(entity).toReference()`
 */
export function ref<T extends object>(entity: T | Ref<T>): Ref<T> & LoadedReference<Loaded<T, AddEager<T>>>;

/**
 * shortcut for `Reference.createFromPK(entityType, pk)`
 */
export function ref<T extends object, PKV extends Primary<T> = Primary<T>>(entityType: EntityClass<T>, pk?: T | PKV): Ref<T>;

/**
 * shortcut for `wrap(entity).toReference()`
 */
export function ref<T extends object, PKV extends Primary<T> = Primary<T>>(entityOrType?: T | Ref<T> | EntityClass<T>, pk?: T | PKV): Ref<T> | undefined | null {
  if (entityOrType == null) {
    return entityOrType as unknown as null;
  }

  if (Utils.isEntity(entityOrType, true)) {
    return helper(entityOrType).toReference() as Ref<T>;
  }

  if (Utils.isEntity(pk, true)) {
    return helper(pk).toReference() as Ref<T>;
  }

  if (pk == null) {
    return pk as null;
  }

  return Reference.createFromPK<T>(entityOrType as EntityClass<T>, pk);
}

/**
 * shortcut for `Reference.createNakedFromPK(entityType, pk)`
 */
export function rel<T extends object, PK extends Primary<T>>(entityType: EntityClass<T>, pk: T | PK): T;

/**
 * shortcut for `Reference.createNakedFromPK(entityType, pk)`
 */
export function rel<T extends object, PK extends Primary<T>>(entityType: EntityClass<T>, pk?: T | PK): T | undefined | null {
  if (pk == null || Utils.isEntity(pk)) {
    return pk as T;
  }

  return Reference.createNakedFromPK(entityType, pk) as T;
}

export { Reference as Ref };
