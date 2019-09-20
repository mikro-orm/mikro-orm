import { EntityMetadata, IEntityType, IPrimaryKey } from '../decorators';
import { EntityManager } from '../EntityManager';
import { Utils } from '../utils';

export type IdentifiedReference<T extends IEntityType<T>, PK extends keyof T = 'id'> = { [K in PK]: T[K] } & Reference<T>;

export class Reference<T extends IEntityType<T>> {

  constructor(private readonly entity: T) {
    Object.defineProperty(this, this.entity.__primaryKeyField, {
      get() {
        return this.entity.__primaryKey;
      },
    });

    if (this.entity.__serializedPrimaryKeyField && this.entity.__primaryKeyField !== this.entity.__serializedPrimaryKeyField) {
      Object.defineProperty(this, this.entity.__serializedPrimaryKeyField, {
        get() {
          return this.entity.__serializedPrimaryKey;
        },
      });
    }
  }

  static create<T extends IEntityType<T>, PK extends keyof T>(entity: T | IdentifiedReference<T, PK>): IdentifiedReference<T, PK> {
    if (entity instanceof Reference) {
      return entity;
    }

    return new Reference(entity) as IdentifiedReference<T, PK>;
  }

  async load(): Promise<T> {
    if (this.isInitialized()) {
      return this.entity;
    }

    return this.entity.init();
  }

  unwrap(): T {
    return this.entity;
  }

  isInitialized(): boolean {
    return this.entity.isInitialized();
  }

  populated(populated?: boolean): void {
    this.entity.populated(populated);
  }

  toJSON(...args: any[]): Record<string, any> {
    return this.entity.toJSON(...args);
  }

  get __primaryKey(): IPrimaryKey {
    return this.entity.__primaryKey;
  }

  get __uuid(): string {
    return this.entity.__uuid;
  }

  get __em(): EntityManager {
    return this.entity.__em;
  }

  get __meta(): EntityMetadata {
    return this.entity.__meta;
  }

  get __populated(): boolean {
    return this.entity.__populated;
  }

  get __lazyInitialized(): boolean {
    return this.entity.__lazyInitialized;
  }

}
