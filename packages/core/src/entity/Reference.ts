import { AnyEntity, Dictionary, EntityProperty, IWrappedEntityInternal, Primary } from '../typings';
import { wrap } from './wrap';

export type IdentifiedReference<T, PK extends keyof T = 'id' & keyof T> = { [K in PK]: T[K] } & Reference<T>;

export class Reference<T> {

  private __helper?: IWrappedEntityInternal<T, keyof T>;

  constructor(private entity: T) {
    this.set(entity);
    const wrapped = wrap(this.entity, true);
    Object.defineProperty(this, '__reference', { value: true });

    wrapped.__meta.primaryKeys.forEach(primaryKey => {
      Object.defineProperty(this, primaryKey, {
        get() {
          return this.entity[primaryKey];
        },
      });
    });

    if (wrapped.__meta.serializedPrimaryKey && wrapped.__meta.primaryKeys[0] !== wrapped.__meta.serializedPrimaryKey) {
      Object.defineProperty(this, wrapped.__meta.serializedPrimaryKey, {
        get() {
          return wrap(this.entity, true).__serializedPrimaryKey;
        },
      });
    }
  }

  static create<T, PK extends keyof T>(entity: T | IdentifiedReference<T, PK>): IdentifiedReference<T, PK> {
    if (entity instanceof Reference) {
      return entity;
    }

    return new Reference(entity) as IdentifiedReference<T, PK>;
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

  async load(): Promise<T> {
    if (this.isInitialized()) {
      return this.entity;
    }

    return wrap(this.entity, true).init();
  }

  async get<K extends keyof T>(prop: K): Promise<T[K]> {
    await this.load();
    return this.entity[prop];
  }

  set(entity: T | IdentifiedReference<T>): void {
    if (entity instanceof Reference) {
      entity = entity.unwrap();
    }

    this.entity = entity;
    this.__helper = wrap(this.entity, true);
  }

  unwrap(): T {
    return this.entity;
  }

  getEntity(): T {
    if (!this.isInitialized()) {
      throw new Error(`Reference<${wrap(this, true).__meta.name}> ${(wrap(this.entity, true).__primaryKey as Primary<T>)} not initialized`);
    }

    return this.entity;
  }

  getProperty<K extends keyof T>(prop: K): T[K] {
    return this.getEntity()[prop];
  }

  isInitialized(): boolean {
    return wrap(this.entity, true).isInitialized();
  }

  populated(populated?: boolean): void {
    wrap(this.entity, true).populated!(populated);
  }

  toJSON(...args: any[]): Dictionary {
    return wrap(this.entity).toJSON!(...args);
  }

}
