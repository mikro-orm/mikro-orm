import type {
  Populate, Cast, Constructor, Dictionary, EntityProperty, IsUnknown, Primary,
  PrimaryProperty, ConnectionType,
} from '../typings';
import type { EntityFactory } from './EntityFactory';
import type { LockMode } from '../enums';
import { helper, wrap } from './wrap';

export type IdentifiedReference<T, PK extends keyof T | unknown = PrimaryProperty<T>> = true extends IsUnknown<PK> ? Reference<T> : ({ [K in Cast<PK, keyof T>]: T[K] } & Reference<T>);

export class Reference<T> {

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

  static create<T extends object, PK extends keyof T | unknown = PrimaryProperty<T>>(entity: T | IdentifiedReference<T, PK>): IdentifiedReference<T, PK> {
    if (Reference.isReference(entity)) {
      return entity as IdentifiedReference<T, PK>;
    }

    return new Reference(entity as T) as IdentifiedReference<T, PK>;
  }

  static createFromPK<T extends object, PK extends keyof T | unknown = PrimaryProperty<T>>(entityType: Constructor<T>, pk: Primary<T>): IdentifiedReference<T, PK> {
    const ref = this.createNakedFromPK(entityType, pk);
    return new Reference(ref) as IdentifiedReference<T, PK>;
  }

  static createNakedFromPK<T extends object, PK extends keyof T | unknown = PrimaryProperty<T>>(entityType: Constructor<T>, pk: Primary<T>): T {
    const factory = entityType.prototype.__factory as EntityFactory;
    return factory.createReference(entityType, pk, { merge: false });
  }

  /**
   * Checks whether the argument is instance of `Reference` wrapper.
   */
  static isReference<T extends object>(data: any): data is Reference<T> {
    return data && !!data.__reference;
  }

  /**
   * Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.
   */
  static wrapReference<T extends object>(entity: T | Reference<T>, prop: EntityProperty<T>): Reference<T> | T {
    if (entity && prop.wrappedReference && !Reference.isReference(entity)) {
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
  async load<K extends keyof T = never, P extends string = never>(options?: LoadReferenceOptions<T, P>): Promise<T>;

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns the requested property instead of the whole entity.
   */
  async load<K extends keyof T>(prop: K): Promise<T[K]>;

  /**
   * Ensures the underlying entity is loaded first (without reloading it if it already is loaded).
   * Returns either the whole entity, or the requested property.
   */
  async load<K extends keyof T = never, P extends string = never>(options?: LoadReferenceOptions<T, P> | K): Promise<T | T[K]> {
    const opts: Dictionary = typeof options === 'object' ? options : { prop: options };

    if (!this.isInitialized()) {
      await helper(this.entity).init(undefined, opts?.populate, opts?.lockMode, opts?.connectionType);
    }

    if (opts.prop) {
      return this.entity[opts.prop];
    }

    return this.entity;
  }

  set(entity: T | IdentifiedReference<T>): void {
    if (entity instanceof Reference) {
      entity = entity.unwrap();
    }

    this.entity = entity;
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
