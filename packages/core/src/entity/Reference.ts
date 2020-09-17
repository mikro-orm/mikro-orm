import { AnyEntity, Dictionary, EntityProperty, Primary } from '../typings';
import { wrap } from './wrap';

export type IdentifiedReference<T extends AnyEntity<T>, PK extends keyof T = 'id' & keyof T> = { [K in PK]: T[K] } & Reference<T>;

export class Reference<T extends AnyEntity<T>> {

  constructor(private entity: T) {
    this.set(entity);
    const meta = this.entity.__meta!;
    Object.defineProperty(this, '__reference', { value: true });

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
          return this.entity.__helper!.__serializedPrimaryKey;
        },
      });
    }
  }

  static create<T extends AnyEntity<T>, PK extends keyof T>(entity: T | IdentifiedReference<T, PK>): IdentifiedReference<T, PK> {
    if (Reference.isReference(entity)) {
      return entity as IdentifiedReference<T, PK>;
    }

    return new Reference(entity as T) as IdentifiedReference<T, PK>;
  }

  /**
   * Checks whether the argument is instance or `Reference` wrapper.
   */
  static isReference<T extends AnyEntity<T>>(data: any): data is Reference<T> {
    return data && !!data.__reference;
  }

  /**
   * Wraps the entity in a `Reference` wrapper if the property is defined as `wrappedReference`.
   */
  static wrapReference<T extends AnyEntity<T>>(entity: T | Reference<T>, prop: EntityProperty<T>): Reference<T> | T {
    if (entity && prop.wrappedReference && !Reference.isReference(entity)) {
      return Reference.create(entity as T);
    }

    return entity;
  }

  /**
   * Returns wrapped entity.
   */
  static unwrapReference<T extends AnyEntity<T>>(ref: T | Reference<T>): T {
    return Reference.isReference<T>(ref) ? (ref as Reference<T>).unwrap() : ref;
  }

  async load(): Promise<T>;
  async load<K extends keyof T>(prop: K): Promise<T[K]>;
  async load<K extends keyof T = never>(prop?: K): Promise<T | T[K]> {
    if (!this.isInitialized()) {
      await this.entity.__helper!.init();
    }

    if (prop) {
      return this.entity[prop];
    }

    return this.entity;
  }

  set(entity: T | IdentifiedReference<T>): void {
    if (entity instanceof Reference) {
      entity = entity.unwrap();
    }

    this.entity = entity;
    Object.defineProperty(this, '__meta', { value: this.entity.__meta!, writable: true });
    Object.defineProperty(this, '__platform', { value: this.entity.__platform!, writable: true });
    Object.defineProperty(this, '__helper', { value: this.entity.__helper!, writable: true });
    Object.defineProperty(this, '$', { value: this.entity, writable: true });
    Object.defineProperty(this, 'get', { value: () => this.entity, writable: true });
  }

  unwrap(): T {
    return this.entity;
  }

  getEntity(): T {
    if (!this.isInitialized()) {
      throw new Error(`Reference<${this.entity.__meta!.name}> ${(this.entity.__helper!.__primaryKey as Primary<T>)} not initialized`);
    }

    return this.entity;
  }

  getProperty<K extends keyof T>(prop: K): T[K] {
    return this.getEntity()[prop];
  }

  isInitialized(): boolean {
    return this.entity.__helper!.__initialized;
  }

  populated(populated?: boolean): void {
    this.entity.__helper!.populated!(populated);
  }

  toJSON(...args: any[]): Dictionary {
    return wrap(this.entity).toJSON!(...args);
  }

}
