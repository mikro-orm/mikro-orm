import { inspect } from 'node:util';
import type {
  AddEager,
  Dictionary,
  EntityClass,
  EntityKey,
  EntityProperty,
  Loaded,
  LoadedReference,
  Primary,
  Ref,
} from '../typings';
import type { EntityFactory } from './EntityFactory';
import { DataloaderType } from '../enums';
import { helper, wrap } from './wrap';
import { DataloaderUtils, Utils } from '../utils';
import type { FindOneOptions, FindOneOrFailOptions } from '../drivers/IDatabaseDriver';

export class Reference<T extends object> {

  constructor(private entity: T) {
    this.set(entity);
    const meta = helper(this.entity as object).__meta;

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
    const unwrapped = Reference.unwrapReference(entity) as T;
    const ref = helper(entity).toReference() as Reference<T>;

    if (unwrapped !== ref.unwrap()) {
      ref.set(unwrapped);
    }

    return ref as Ref<T>;
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

    return entity as T;
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
  static wrapReference<T extends object, O extends object>(entity: T | Reference<T>, prop: EntityProperty<O, T>): Reference<T> | T {
    if (entity && prop.ref && !Reference.isReference(entity)) {
      return Reference.create(entity as T) as Reference<T>;
    }

    return entity;
  }

  /**
   * Returns wrapped entity.
   */
  static unwrapReference<T extends object>(ref: T | Reference<T> | ScalarReference<T> | Ref<T>): T {
    return Reference.isReference<T>(ref) ? (ref as Reference<T>).unwrap() : ref as T;
  }

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded). Returns the entity.
   * If the entity is not found in the database (e.g. it was deleted in the meantime, or currently active filters disallow loading of it)
   * the method returns `null`. Use `loadOrFail()` if you want an error to be thrown in such a case.
   */
  async load<TT extends T, P extends string = never, F extends string = '*', E extends string = never>(options: LoadReferenceOptions<TT, P, F, E> = {}): Promise<Loaded<TT, P, F, E> | null> {
    const wrapped = helper(this.entity as TT & object);

    if (!wrapped.__em) {
      return this.entity as Loaded<TT, P, F, E>;
    }

    if (this.isInitialized() && !options.refresh && options.populate) {
      await wrapped.__em.populate(this.entity, options.populate as any, options as any);
    }

    if (!this.isInitialized() || options.refresh) {
      if (options.dataloader ?? [DataloaderType.ALL, DataloaderType.REFERENCE].includes(DataloaderUtils.getDataloaderType(wrapped.__em.config.get('dataloader')))) {
        // eslint-disable-next-line dot-notation
        return wrapped.__em!['refLoader'].load([this, options as any]);
      }

      return wrapped.init(options);
    }

    return this.entity as Loaded<TT, P, F, E>;
  }

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns the entity or throws an error just like `em.findOneOrFail()` (and respects the same config options).
   */
  async loadOrFail<TT extends T, P extends string = never, F extends string = '*', E extends string = never>(options: LoadReferenceOrFailOptions<TT, P, F, E> = {}): Promise<Loaded<TT, P, F, E>> {
    const ret = await this.load(options);

    if (!ret) {
      const wrapped = helper(this.entity);
      options.failHandler ??= wrapped.__em!.config.get('findOneOrFailHandler');
      const entityName = this.entity.constructor.name;
      const where = wrapped.getPrimaryKey() as any;
      throw options.failHandler!(entityName, where);
    }

    return ret;
  }

  private set<TT extends T>(entity: TT | Ref<TT>): void {
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

  async loadProperty<TT extends T, P extends string = never, K extends keyof TT = keyof TT>(prop: K, options?: LoadReferenceOrFailOptions<TT, P>): Promise<Loaded<TT, P>[K]> {
    await this.loadOrFail(options);
    return (this.getEntity() as TT)[prop] as Loaded<TT, P>[K];
  }

  isInitialized(): boolean {
    return helper(this.entity).__initialized;
  }

  populated(populated?: boolean): void {
    helper(this.entity).populated(populated);
  }

  toJSON(...args: any[]): Dictionary {
    return wrap(this.entity as object).toJSON!(...args);
  }

  /* istanbul ignore next */
  /** @ignore */
  [inspect.custom](depth = 2) {
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

export class ScalarReference<Value> {

  private entity?: object;
  private property?: string;

  constructor(private value?: Value, private initialized = value != null) {}

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns either the whole entity, or the requested property.
   */
  async load(options?: Omit<LoadReferenceOptions<any, any>, 'populate' | 'fields' | 'exclude'>): Promise<Value | undefined> {
    const opts: Dictionary = typeof options === 'object' ? options : { prop: options } as LoadReferenceOptions<any, any>;

    if (!this.initialized || opts.refresh) {
      if (this.entity == null || this.property == null) {
        throw new Error('Cannot load scalar reference that is not bound to an entity property.');
      }

      await helper(this.entity).populate<any>([this.property], opts);
    }

    return this.value;
  }

  set(value: Value): void {
    this.value = value;
    this.initialized = true;
  }

  bind<Entity extends object>(entity: Entity, property: EntityKey<Entity>): void {
    this.entity = entity;
    this.property = property;
    Object.defineProperty(this, 'entity', { enumerable: false, value: entity });
  }

  unwrap(): Value | undefined {
    return this.value;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  /* istanbul ignore next */
  /** @ignore */
  [inspect.custom]() {
    return this.initialized ? `Ref<${inspect(this.value)}>` : `Ref<?>`;
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

Object.defineProperties(ScalarReference.prototype, {
  __scalarReference: { value: true, enumerable: false },
  $: { get() { return this.value; } },
  get: { get() { return () => this.value; } },
});

export interface LoadReferenceOptions<T extends object, P extends string = never, F extends string = '*', E extends string = never> extends FindOneOptions<T, P, F, E> {
  dataloader?: boolean;
}

export interface LoadReferenceOrFailOptions<T extends object, P extends string = never, F extends string = '*', E extends string = never> extends FindOneOrFailOptions<T, P, F, E> {
  dataloader?: boolean;
}

/**
 * shortcut for `wrap(entity).toReference()`
 */
export function ref<T>(entity: T | Ref<T>): Ref<T> & LoadedReference<Loaded<T, AddEager<T>>>;

/**
 * shortcut for `Reference.createFromPK(entityType, pk)`
 */
export function ref<T, PKV extends Primary<T> = Primary<T>>(entityType: EntityClass<T>, pk?: T | PKV): Ref<T>;

/**
 * shortcut for `wrap(entity).toReference()`
 */
export function ref<T>(value: T | Ref<T>): Ref<T> & LoadedReference<Loaded<T, AddEager<T>>>;

/**
 * shortcut for `wrap(entity).toReference()`
 */
export function ref<T, PKV extends Primary<T> = Primary<T>>(entityOrType?: T | Ref<T> | EntityClass<T>, pk?: T | PKV): Ref<T> | undefined | null {
  if (entityOrType == null) {
    return entityOrType as unknown as null;
  }

  if (Utils.isEntity(entityOrType, true)) {
    return helper(entityOrType).toReference() as Ref<T>;
  }

  if (Utils.isEntity(pk, true)) {
    return helper(pk).toReference() as Ref<T>;
  }

  if (arguments.length === 1) {
    return new ScalarReference<T>(entityOrType, true) as Ref<T>;
  }

  if (pk == null) {
    return pk as null;
  }

  return Reference.createFromPK(entityOrType as EntityClass<T>, pk as PKV) as Ref<T>;
}

/**
 * shortcut for `Reference.createNakedFromPK(entityType, pk)`
 */
export function rel<T, PK extends Primary<T>>(entityType: EntityClass<T>, pk: T | PK): T;

/**
 * shortcut for `Reference.createNakedFromPK(entityType, pk)`
 */
export function rel<T, PK extends Primary<T>>(entityType: EntityClass<T>, pk?: T | PK): T | undefined | null {
  if (pk == null || Utils.isEntity(pk)) {
    return pk as T;
  }

  return Reference.createNakedFromPK(entityType, pk) as T;
}

export { Reference as Ref };
