import { inspect } from 'util';
import type { EntityManager } from '../EntityManager';
import type {
  AnyEntity,
  ConnectionType,
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityMetadata,
  IHydrator,
  EntityValue,
  EntityKey,
  IWrappedEntityInternal,
  Populate,
  PopulateOptions,
  Primary,
  AutoPath,
  Ref,
  AddEager,
  LoadedReference,
  EntityDTO,
  Loaded,
} from '../typings';
import { Reference } from './Reference';
import { EntityTransformer } from '../serialization/EntityTransformer';
import { EntityAssigner, type AssignOptions } from './EntityAssigner';
import type { EntityLoaderOptions } from './EntityLoader';
import { Utils } from '../utils/Utils';
import type { LockMode } from '../enums';
import { ValidationError } from '../errors';
import type { EntityIdentifier } from './EntityIdentifier';
import { helper } from './wrap';
import type { SerializationContext } from '../serialization/SerializationContext';
import { EntitySerializer, type SerializeOptions } from '../serialization/EntitySerializer';

export class WrappedEntity<Entity extends object> {

  __initialized = true;
  __touched = false;
  __populated?: boolean;
  __managed?: boolean;
  __onLoadFired?: boolean;
  __schema?: string;
  __em?: EntityManager;
  __serializationContext: { root?: SerializationContext<Entity>; populate?: PopulateOptions<Entity>[]; fields?: string[] } = {};
  __loadedProperties = new Set<string>();
  __data: Dictionary = {};
  __processing = false;

  /** stores last known primary key, as its current state might be broken due to propagation/orphan removal, but we need to know the PK to be able t remove the entity */
  __pk?: Primary<Entity>;

  /** holds the reference wrapper instance (if created), so we can maintain the identity on reference wrappers too */
  __reference?: Reference<Entity>;

  /** holds last entity data snapshot, so we can compute changes when persisting managed entities */
  __originalEntityData?: EntityData<Entity>;

  /** holds wrapped primary key, so we can compute change set without eager commit */
  __identifier?: EntityIdentifier;

  constructor(private readonly entity: Entity,
              private readonly hydrator: IHydrator,
              private readonly pkGetter?: (e: Entity) => Primary<Entity>,
              private readonly pkSerializer?: (e: Entity) => string,
              private readonly pkGetterConverted?: (e: Entity) => Primary<Entity>) { }

  isInitialized(): boolean {
    return this.__initialized;
  }

  isTouched(): boolean {
    return this.__touched;
  }

  populated(populated: boolean | undefined = true): void {
    this.__populated = populated;
  }

  toReference(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    this.__reference ??= new Reference(this.entity);
    return this.__reference as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  toObject<Ignored extends EntityKey<Entity> = never>(ignoreFields?: Ignored[]): Omit<EntityDTO<Entity>, Ignored> {
    return EntityTransformer.toObject(this.entity, ignoreFields);
  }

  serialize<Hint extends string = never, Exclude extends string = never>(options?: SerializeOptions<Entity, Hint, Exclude>): EntityDTO<Loaded<Entity, Hint>> {
    return EntitySerializer.serialize(this.entity, options);
  }

  toPOJO(): EntityDTO<Entity> {
    return EntityTransformer.toObject(this.entity, [], true) as EntityDTO<Entity>;
  }

  toJSON(...args: any[]): EntityDictionary<Entity> {
    // toJSON methods is added to the prototype during discovery to support automatic serialization via JSON.stringify()
    return (this.entity as Dictionary).toJSON(...args);
  }

  assign(data: EntityData<Entity>, options?: AssignOptions): Entity {
    if ('assign' in this.entity) {
      return (this.entity as Dictionary).assign(data, options);
    }

    return EntityAssigner.assign(this.entity, data, options);
  }

  async init<P extends Populate<Entity> = Populate<Entity>>(populated = true, populate?: P, lockMode?: LockMode, connectionType?: ConnectionType): Promise<Entity> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await this.__em.findOne(this.entity.constructor.name, this.entity, { refresh: true, lockMode, populate, connectionType, schema: this.__schema });

    return this.entity;
  }

  async populate<Hint extends string = never>(
    populate: AutoPath<Entity, Hint>[] | boolean,
    options: EntityLoaderOptions<Entity, Hint> = {},
  ): Promise<Loaded<Entity, Hint>> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    await this.__em.populate(this.entity, populate, options);

    return this.entity as Loaded<Entity, Hint>;
  }

  hasPrimaryKey(): boolean {
    const pk = this.getPrimaryKey();
    return pk != null;
  }

  getPrimaryKey(convertCustomTypes = false): Primary<Entity> | null {
    const prop = this.__meta.getPrimaryProps()[0];

    if (!prop) {
      return null;
    }

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
  getPrimaryKeys(convertCustomTypes = false): Primary<Entity>[] | null {
    const pk = this.getPrimaryKey(convertCustomTypes);

    if (pk == null) {
      return null;
    }

    if (this.__meta.compositePK) {
      return this.__meta.primaryKeys.reduce((ret, pk) => {
        const child = this.entity[pk] as AnyEntity<Entity>;

        if (Utils.isEntity(child, true)) {
          const childPk = helper(child).getPrimaryKeys(convertCustomTypes);
          ret.push(...childPk as Primary<Entity>[]);
        } else {
          ret.push(child as Primary<Entity>);
        }

        return ret;
      }, [] as Primary<Entity>[]);
    }

    return [pk];
  }

  getSchema(): string | undefined {
    return this.__schema;
  }

  setSchema(schema?: string): void {
    this.__schema = schema;
  }

  setPrimaryKey(id: Primary<Entity> | null) {
    this.entity[this.__meta!.primaryKeys[0]] = id as EntityValue<Entity>;
    this.__pk = id!;
  }

  getSerializedPrimaryKey(): string {
    return this.pkSerializer!(this.entity);
  }

  get __meta(): EntityMetadata<Entity> {
    return (this.entity as IWrappedEntityInternal<Entity>).__meta!;
  }

  get __platform() {
    return (this.entity as IWrappedEntityInternal<Entity>).__platform!;
  }

  get __config() {
    return (this.entity as IWrappedEntityInternal<Entity>).__config!;
  }

  get __primaryKeys(): Primary<Entity>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.__meta!.primaryKeys) as Primary<Entity>[];
  }

  [inspect.custom]() {
    return `[WrappedEntity<${this.__meta!.className}>]`;
  }

}
