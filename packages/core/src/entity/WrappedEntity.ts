import { v4 as uuid } from 'uuid';
import { EntityManager } from '../EntityManager';
import { Platform } from '../platforms';
import { MetadataStorage } from '../metadata';
import { EntityValidator } from './EntityValidator';
import { Dictionary, EntityData, EntityMetadata, Primary } from '../typings';
import { IdentifiedReference, Reference } from './Reference';
import { EntityTransformer } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';
import { EntityHelper } from './EntityHelper';
import { Utils } from '../utils';
import { wrap } from './wrap';

export class WrappedEntity<T, PK extends keyof T> {

  __initialized = true;
  __populated = false;
  __lazyInitialized = false;
  __em?: EntityManager;

  readonly __uuid = uuid();
  readonly __internal: {
    platform: Platform;
    metadata: MetadataStorage;
    validator: EntityValidator;
  };

  constructor(private readonly entity: T,
              readonly __meta: EntityMetadata<T>,
              em: EntityManager) {
    this.__internal = {
      platform: em.getDriver().getPlatform(),
      metadata: em.getMetadata(),
      validator: em.getValidator(),
    };
  }

  isInitialized(): boolean {
    return this.__initialized;
  }

  populated(populated = true): void {
    this.__populated = populated;
    this.__lazyInitialized = false;
  }

  toReference(): IdentifiedReference<T, PK> {
    return Reference.create<T, PK>(this.entity);
  }

  toObject(ignoreFields: string[] = []): EntityData<T> {
    return EntityTransformer.toObject(this.entity, ignoreFields) as EntityData<T>;
  }

  toJSON(...args: any[]): EntityData<T> & Dictionary {
    // toJSON methods is added to thee prototype during discovery to support automatic serialization via JSON.stringify()
    return (this.entity as Dictionary).toJSON(...args);
  }

  assign(data: EntityData<T>, options?: AssignOptions): T {
    if ('assign' in this.entity) {
      return (this.entity as Dictionary).assign(data, options);
    }

    return EntityAssigner.assign(this.entity, data, options);
  }

  init(populated = true): Promise<T> {
    return EntityHelper.init<T>(this.entity, populated) as Promise<T>;
  }

  get __primaryKey(): Primary<T> {
    return Utils.getPrimaryKeyValue(this.entity, this.__meta.primaryKeys);
  }

  set __primaryKey(id: Primary<T>) {
    this.entity[this.__meta.primaryKeys[0] as string] = id;
  }

  get __primaryKeys(): Primary<T>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.__meta.primaryKeys);
  }

  get __serializedPrimaryKey(): Primary<T> | string {
    if (this.__meta.compositePK) {
      return Utils.getCompositeKeyHash(this.entity, this.__meta);
    }

    if (Utils.isEntity(this.entity[this.__meta.serializedPrimaryKey])) {
      return wrap(this.entity[this.__meta.serializedPrimaryKey], true).__serializedPrimaryKey as string;
    }

    return this.entity[this.__meta.serializedPrimaryKey] as unknown as string;
  }

}
