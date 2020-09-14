import { EntityManager } from '../EntityManager';
import { Platform } from '../platforms';
import { MetadataStorage } from '../metadata';
import { EntityValidator } from './EntityValidator';
import { AnyEntity, Dictionary, EntityData, EntityMetadata, Populate, Primary } from '../typings';
import { IdentifiedReference, Reference } from './Reference';
import { EntityTransformer } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';
import { Utils } from '../utils/Utils';
import { LockMode } from '../enums';
import { ValidationError } from '../errors';

export class WrappedEntity<T extends AnyEntity<T>, PK extends keyof T> {

  readonly __meta: EntityMetadata<T>;
  __initialized = true;
  __populated = false;
  __lazyInitialized = false;
  __managed = false;
  __em?: EntityManager;

  /** holds last entity data snapshot so we can compute changes when persisting managed entities */
  __originalEntityData?: EntityData<T>;

  /** holds wrapped primary key so we can compute change set without eager commit */
  __identifier?: EntityData<T>;

  readonly __internal: {
    platform: Platform;
    metadata: MetadataStorage;
    validator: EntityValidator;
  };

  constructor(private readonly entity: T, em: EntityManager) {
    this.__meta = (entity as Dictionary).__meta;
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

  async init<P extends Populate<T> = Populate<T>>(populated = true, populate?: P, lockMode?: LockMode): Promise<T> {
    const wrapped = this.entity.__helper!;
    const em = wrapped.__em;

    if (!em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await em.findOne(this.entity.constructor.name, this.entity, { refresh: true, lockMode, populate });
    wrapped.populated(populated);
    wrapped.__lazyInitialized = true;

    return this.entity;
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

    const value = this.entity[this.__meta.serializedPrimaryKey];

    if (Utils.isEntity<T>(value)) {
      return value.__helper!.__serializedPrimaryKey as string;
    }

    return value as unknown as string;
  }

}
