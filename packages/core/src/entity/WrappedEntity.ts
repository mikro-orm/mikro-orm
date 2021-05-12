import { inspect } from 'util';
import { EntityManager } from '../EntityManager';
import { AnyEntity, Dictionary, EntityData, EntityMetadata, Populate, PopulateOptions, Primary } from '../typings';
import { IdentifiedReference, Reference } from './Reference';
import { EntityTransformer, SerializationContext } from './EntityTransformer';
import { AssignOptions, EntityAssigner } from './EntityAssigner';
import { Utils } from '../utils/Utils';
import { LockMode } from '../enums';
import { ValidationError } from '../errors';
import { EntityIdentifier } from './EntityIdentifier';

export class WrappedEntity<T extends AnyEntity<T>, PK extends keyof T> {

  __initialized = true;
  __populated?: boolean;
  __lazyInitialized?: boolean;
  __managed?: boolean;
  __em?: EntityManager;
  __serializationContext: { root?: SerializationContext<T>; populate?: PopulateOptions<T>[] } = {};

  /** holds last entity data snapshot so we can compute changes when persisting managed entities */
  __originalEntityData?: EntityData<T>;

  /** holds wrapped primary key so we can compute change set without eager commit */
  __identifier?: EntityIdentifier;

  constructor(private readonly entity: T,
              private readonly pkGetter: (e: T) => Primary<T>,
              private readonly pkSerializer: (e: T) => string,
              private readonly pkGetterConverted: (e: T) => Primary<T>) { }

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

  toPOJO(): EntityData<T> {
    return EntityTransformer.toObject(this.entity, [], true);
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
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await this.__em.findOne(this.entity.constructor.name, this.entity, { refresh: true, lockMode, populate });
    this.populated(populated);
    this.__lazyInitialized = true;

    return this.entity;
  }

  hasPrimaryKey(): boolean {
    const pk = this.getPrimaryKey();
    return pk !== undefined && pk !== null;
  }

  getPrimaryKey(convertCustomTypes = false): Primary<T> | null {
    if (convertCustomTypes) {
      return this.pkGetterConverted(this.entity);
    }

    return this.pkGetter(this.entity);
  }

  setPrimaryKey(id: Primary<T> | null) {
    this.entity[this.entity.__meta!.primaryKeys[0] as string] = id;
  }

  getSerializedPrimaryKey(): string {
    return this.pkSerializer(this.entity);
  }

  get __meta(): EntityMetadata<T> {
    return this.entity.__meta!;
  }

  get __platform() {
    return this.entity.__platform!;
  }

  get __primaryKeys(): Primary<T>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.entity.__meta!.primaryKeys);
  }

  // TODO used only at one place, probably replaceable
  get __primaryKeyCond(): Primary<T> | Primary<T>[] | null {
    if (this.entity.__meta!.compositePK) {
      return this.__primaryKeys;
    }

    return this.getPrimaryKey();
  }

  [inspect.custom]() {
    return `[WrappedEntity<${this.entity.__meta!.className}>]`;
  }

}
