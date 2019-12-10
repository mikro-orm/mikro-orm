import { Dictionary, EntityMetadata, AnyEntity, Primary } from '../types';
import { EntityManager } from '../EntityManager';
import { wrap } from './EntityHelper';

export type IdentifiedReference<T extends AnyEntity<T>, PK extends keyof T = 'id' & keyof T> = { [K in PK]: T[K] } & Reference<T>;

export class Reference<T extends AnyEntity<T>> {

  constructor(private entity: T) {
    this.set(entity);
    const wrapped = wrap(this.entity);

    Object.defineProperty(this, wrapped.__meta.primaryKey, {
      get() {
        return wrap(this.entity).__primaryKey;
      },
    });

    if (wrapped.__meta.serializedPrimaryKey && wrapped.__meta.primaryKey !== wrapped.__meta.serializedPrimaryKey) {
      Object.defineProperty(this, wrapped.__meta.serializedPrimaryKey, {
        get() {
          return wrap(this.entity).__serializedPrimaryKey;
        },
      });
    }
  }

  static create<T extends AnyEntity<T>, PK extends keyof T>(entity: T | IdentifiedReference<T, PK>): IdentifiedReference<T, PK> {
    if (entity instanceof Reference) {
      return entity;
    }

    return new Reference(entity) as IdentifiedReference<T, PK>;
  }

  async load(): Promise<T> {
    if (this.isInitialized()) {
      return this.entity;
    }

    return wrap(this.entity).init();
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
  }

  unwrap(): T {
    return wrap(this.entity);
  }

  isInitialized(): boolean {
    return wrap(this.entity).isInitialized();
  }

  populated(populated?: boolean): void {
    wrap(this.entity).populated!(populated);
  }

  toJSON(...args: any[]): Dictionary {
    return wrap(this.entity).toJSON!(...args);
  }

  get __primaryKey(): Primary<T> {
    return wrap(this.entity).__primaryKey as Primary<T>;
  }

  get __uuid(): string {
    return wrap(this.entity).__uuid;
  }

  get __em(): EntityManager {
    return wrap(this.entity).__em;
  }

  get __meta(): EntityMetadata {
    return wrap(this.entity).__meta;
  }

  get __populated(): boolean {
    return wrap(this.entity).__populated;
  }

  get __lazyInitialized(): boolean {
    return wrap(this.entity).__lazyInitialized;
  }

}
