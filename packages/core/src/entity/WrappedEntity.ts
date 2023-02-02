import { inspect } from 'util';
import type { EntityManager } from '../EntityManager';
import type {
  AnyEntity, ConnectionType, Dictionary, EntityData, EntityDictionary, EntityMetadata, IHydrator,
  IWrappedEntityInternal, Populate, PopulateOptions, Primary, AutoPath, Loaded, Ref,
} from '../typings';
import { Reference } from './Reference';
import { EntityTransformer } from '../serialization/EntityTransformer';
import type { AssignOptions } from './EntityAssigner';
import { EntityAssigner } from './EntityAssigner';
import type { EntityLoaderOptions } from './EntityLoader';
import { Utils } from '../utils/Utils';
import type { LockMode } from '../enums';
import { ValidationError } from '../errors';
import type { EntityIdentifier } from './EntityIdentifier';
import { helper } from './wrap';
import type { SerializationContext } from '../serialization/SerializationContext';

export class WrappedEntity<T extends object> {

  __initialized = true;
  __touched = false;
  __populated?: boolean;
  __lazyInitialized?: boolean;
  __managed?: boolean;
  __onLoadFired?: boolean;
  __schema?: string;
  __em?: EntityManager;
  __serializationContext: { root?: SerializationContext<T>; populate?: PopulateOptions<T>[] } = {};
  __loadedProperties = new Set<string>();
  __data: Dictionary = {};
  __processing = false;

  /** stores last known primary key, as its current state might be broken due to propagation/orphan removal, but we need to know the PK to be able t remove the entity */
  __pk?: Primary<T>;

  /** holds the reference wrapper instance (if created), so we can maintain the identity on reference wrappers too */
  __reference?: Reference<T>;

  /** holds last entity data snapshot, so we can compute changes when persisting managed entities */
  __originalEntityData?: EntityData<T>;

  /** holds wrapped primary key, so we can compute change set without eager commit */
  __identifier?: EntityIdentifier;

  constructor(private readonly entity: T,
              private readonly hydrator: IHydrator,
              private readonly pkGetter?: (e: T) => Primary<T>,
              private readonly pkSerializer?: (e: T) => string,
              private readonly pkGetterConverted?: (e: T) => Primary<T>) { }

  isInitialized(): boolean {
    return this.__initialized;
  }

  isTouched(): boolean {
    return this.__touched;
  }

  populated(populated = true): void {
    this.__populated = populated;
    this.__lazyInitialized = false;
  }

  toReference(): Ref<T> {
    this.__reference ??= new Reference(this.entity);
    return this.__reference as Ref<T>;
  }

  toObject(ignoreFields: string[] = []): EntityData<T> {
    return EntityTransformer.toObject(this.entity, ignoreFields) as EntityData<T>;
  }

  toPOJO(): EntityData<T> {
    return EntityTransformer.toObject(this.entity, [], true);
  }

  toJSON(...args: any[]): EntityDictionary<T> {
    // toJSON methods is added to the prototype during discovery to support automatic serialization via JSON.stringify()
    return (this.entity as Dictionary).toJSON(...args);
  }

  assign(data: EntityData<T>, options?: AssignOptions): T {
    if ('assign' in this.entity) {
      return (this.entity as Dictionary).assign(data, options);
    }

    return EntityAssigner.assign(this.entity, data, options);
  }

  async init<P extends Populate<T> = Populate<T>>(populated = true, populate?: P, lockMode?: LockMode, connectionType?: ConnectionType): Promise<T> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await this.__em.findOne(this.entity.constructor.name, this.entity, { refresh: true, lockMode, populate, connectionType, schema: this.__schema });
    this.populated(populated);
    this.__lazyInitialized = true;

    return this.entity;
  }

  async populate<Hint extends string = never>(
    populate: AutoPath<T, Hint>[] | boolean,
    options: EntityLoaderOptions<T, Hint> = {},
  ): Promise<Loaded<T, Hint>> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await this.__em.populate(this.entity, populate, options);

    return this.entity as Loaded<T, Hint>;
  }

  hasPrimaryKey(): boolean {
    const pk = this.getPrimaryKey();
    return pk != null;
  }

  getPrimaryKey(convertCustomTypes = false): Primary<T> | null {
    const prop = this.__meta.getPrimaryProps()[0];

    if (this.__pk != null && this.__meta.compositePK) {
      return Utils.getCompositeKeyValue(this.__pk, this.__meta, convertCustomTypes ? 'convertToDatabaseValue' : false, this.__platform);
    }

    if (convertCustomTypes && this.__pk != null && prop.customType) {
      return prop.customType.convertToDatabaseValue(this.__pk, this.__platform);
    }

    if (convertCustomTypes) {
      return this.__pk ?? this.pkGetterConverted!(this.entity);
    }

    return this.__pk ?? this.pkGetter!(this.entity);
  }

  // this method is currently used only in `Driver.syncCollection` and can be probably removed
  getPrimaryKeys(convertCustomTypes = false): Primary<T>[] | null {
    const pk = this.getPrimaryKey(convertCustomTypes);

    if (pk == null) {
      return null;
    }

    if (this.__meta.compositePK) {
      return this.__meta.primaryKeys.reduce((ret, pk) => {
        const child = this.entity[pk] as AnyEntity<T> | Primary<unknown>;

        if (Utils.isEntity(child, true)) {
          const childPk = helper(child).getPrimaryKeys(convertCustomTypes);
          ret.push(...childPk as Primary<T>[]);
        } else {
          ret.push(child as Primary<T>);
        }

        return ret;
      }, [] as Primary<T>[]);
    }

    return [pk];
  }

  getSchema(): string | undefined {
    return this.__schema;
  }

  setSchema(schema?: string): void {
    this.__schema = schema;
  }

  setPrimaryKey(id: Primary<T> | null) {
    this.entity[this.__meta!.primaryKeys[0] as string] = id;
    this.__pk = id!;
  }

  getSerializedPrimaryKey(): string {
    return this.pkSerializer!(this.entity);
  }

  get __meta(): EntityMetadata<T> {
    return (this.entity as IWrappedEntityInternal<T>).__meta!;
  }

  get __platform() {
    return (this.entity as IWrappedEntityInternal<T>).__platform!;
  }

  get __primaryKeys(): Primary<T>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.__meta!.primaryKeys);
  }

  [inspect.custom]() {
    return `[WrappedEntity<${this.__meta!.className}>]`;
  }

}
