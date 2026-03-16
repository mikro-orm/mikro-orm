import type { PopulatePath } from '../enums.js';
import type { EntityManager } from '../EntityManager.js';
import type {
  AnyEntity,
  Dictionary,
  EntityData,
  EntityDictionary,
  EntityMetadata,
  IHydrator,
  EntityValue,
  EntityKey,
  IWrappedEntityInternal,
  PopulateOptions,
  Primary,
  AutoPath,
  Ref,
  AddEager,
  LoadedReference,
  EntityDTO,
  Loaded,
  SerializeDTO,
  FromEntityType,
  IsSubset,
  MergeSelected,
} from '../typings.js';
import { Reference } from './Reference.js';
import { EntityTransformer } from '../serialization/EntityTransformer.js';
import { type AssignOptions, EntityAssigner } from './EntityAssigner.js';
import type { EntityLoaderOptions } from './EntityLoader.js';
import { Utils } from '../utils/Utils.js';
import { ValidationError } from '../errors.js';
import type { EntityIdentifier } from './EntityIdentifier.js';
import { helper } from './wrap.js';
import type { SerializationContext } from '../serialization/SerializationContext.js';
import { EntitySerializer, type SerializeOptions } from '../serialization/EntitySerializer.js';
import type { FindOneOptions, LoadHint } from '../drivers/IDatabaseDriver.js';
import { expandDotPaths } from './utils.js';
import type { Platform } from '../platforms/Platform.js';
import type { Configuration } from '../utils/Configuration.js';

/** @internal Wrapper attached to every managed entity, holding ORM state such as initialization flags, identity map references, and change tracking snapshots. */
export class WrappedEntity<Entity extends object> {
  declare __initialized: boolean;
  declare __populated?: boolean;
  declare __managed?: boolean;
  declare __onLoadFired?: boolean;
  declare __schema?: string;
  declare __em?: EntityManager;
  declare __loadedProperties: Set<string>;
  declare __data: Dictionary;
  declare __processing: boolean;
  declare __serializationContext: {
    root?: SerializationContext<Entity>;
    populate?: PopulateOptions<Entity>[];
    fields?: Set<string>;
    exclude?: readonly string[];
  };

  /** stores last known primary key, as its current state might be broken due to propagation/orphan removal, but we need to know the PK to be able t remove the entity */
  declare __pk?: Primary<Entity>;

  /** holds the reference wrapper instance (if created), so we can maintain the identity on reference wrappers too */
  declare __reference?: Reference<Entity>;

  /** holds last entity data snapshot, so we can compute changes when persisting managed entities */
  declare __originalEntityData?: EntityData<Entity>;

  /** holds wrapped primary key, so we can compute change set without eager commit */
  declare __identifier?: EntityIdentifier;

  declare private readonly entity: Entity;
  declare private readonly hydrator: IHydrator;
  declare private readonly pkGetter?: (e: Entity) => Primary<Entity>;
  declare private readonly pkSerializer?: (e: Entity) => string;
  declare private readonly pkGetterConverted?: (e: Entity) => Primary<Entity>;

  constructor(
    entity: Entity,
    hydrator: IHydrator,
    pkGetter?: (e: Entity) => Primary<Entity>,
    pkSerializer?: (e: Entity) => string,
    pkGetterConverted?: (e: Entity) => Primary<Entity>,
  ) {
    this.entity = entity;
    this.hydrator = hydrator;
    this.pkGetter = pkGetter;
    this.pkSerializer = pkSerializer;
    this.pkGetterConverted = pkGetterConverted;
    this.__initialized = true;
    this.__serializationContext = {};
    this.__loadedProperties = new Set<string>();
    this.__data = {};
    this.__processing = false;
  }

  /** Returns whether the entity has been fully loaded from the database. */
  isInitialized(): boolean {
    return this.__initialized;
  }

  /** Returns whether the entity is managed by an EntityManager (tracked in the identity map). */
  isManaged(): boolean {
    return !!this.__managed;
  }

  /** Marks the entity as populated or not for serialization purposes. */
  populated(populated: boolean | undefined = true): void {
    this.__populated = populated;
  }

  /** Sets the serialization context with populate hints, field selections, and exclusions. */
  setSerializationContext<Hint extends string = never, Fields extends string = never, Exclude extends string = never>(
    options: LoadHint<Entity, Hint, Fields, Exclude>,
  ): void {
    const exclude = (options.exclude as readonly string[]) ?? [];
    const context = this.__serializationContext;
    const populate = expandDotPaths(this.__meta, options.populate as any);
    context.populate = context.populate ? context.populate.concat(populate) : populate;
    context.exclude = context.exclude ? context.exclude.concat(exclude) : exclude;

    if (context.fields && options.fields) {
      options.fields.forEach(f => context.fields!.add(f as string));
    } else if (options.fields) {
      context.fields = new Set(options.fields);
    } else {
      context.fields = new Set(['*']);
    }
  }

  /** Returns a Reference wrapper for this entity, creating one if it does not already exist. */
  toReference(): Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>> {
    this.__reference ??= new Reference(this.entity);
    return this.__reference as Ref<Entity> & LoadedReference<Loaded<Entity, AddEager<Entity>>>;
  }

  /** Converts the entity to a plain object representation, optionally excluding specified fields. */
  toObject<Ignored extends EntityKey<Entity> = never>(ignoreFields?: Ignored[]): Omit<EntityDTO<Entity>, Ignored> {
    return EntityTransformer.toObject(this.entity, ignoreFields);
  }

  /** Serializes the entity with control over which relations and fields to include or exclude. */
  serialize<Hint extends string = never, Exclude extends string = never>(
    options?: SerializeOptions<Entity, Hint, Exclude>,
  ): SerializeDTO<Entity, Hint, Exclude> {
    return EntitySerializer.serialize(this.entity, options);
  }

  /** Converts the entity to a plain object, including all properties regardless of serialization rules. */
  toPOJO(): EntityDTO<Entity> {
    return EntityTransformer.toObject(this.entity, [], true) as EntityDTO<Entity>;
  }

  /** Serializes the entity using its `toJSON` method (supports `JSON.stringify`). */
  toJSON(...args: any[]): EntityDictionary<Entity> {
    // toJSON methods is added to the prototype during discovery to support automatic serialization via JSON.stringify()
    return (this.entity as Dictionary).toJSON(...args);
  }

  /** Assigns the given data to this entity, updating its properties and relations. */
  assign<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> =
      | EntityData<Naked, Convert>
      | Partial<EntityDTO<Naked>>,
  >(
    data: Data & IsSubset<EntityData<Naked>, Data>,
    options?: AssignOptions<Convert>,
  ): MergeSelected<Entity, Naked, keyof Data & string> {
    if ('assign' in this.entity) {
      return (this.entity as Dictionary).assign(data, options);
    }

    return EntityAssigner.assign(this.entity, data as any, options) as any;
  }

  /** Initializes (refreshes) the entity by reloading it from the database. Returns null if not found. */
  async init<Hint extends string = never, Fields extends string = never, Excludes extends string = never>(
    options?: FindOneOptions<Entity, Hint, Fields, Excludes>,
  ): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    return this.__em.findOne(this.entity.constructor, this.entity, {
      ...options,
      refresh: true,
      schema: this.__schema,
    });
  }

  /** Loads the specified relations on this entity. */
  async populate<Hint extends string = never, Fields extends string = never>(
    populate: AutoPath<Entity, Hint, PopulatePath.ALL>[] | false,
    options: EntityLoaderOptions<Entity, Fields> = {},
  ): Promise<Loaded<Entity, Hint>> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    // @ts-ignore hard to type
    await this.__em.populate(this.entity, populate, options);

    return this.entity as Loaded<Entity, Hint>;
  }

  /** Returns whether this entity has a primary key value set. */
  hasPrimaryKey(): boolean {
    const pk = this.getPrimaryKey();
    return pk != null;
  }

  /** Returns the primary key value, optionally converting custom types to their database representation. */
  getPrimaryKey(convertCustomTypes = false): Primary<Entity> | null {
    const prop = this.__meta.getPrimaryProps()[0];

    if (!prop) {
      return null;
    }

    if (this.__pk != null && this.__meta.compositePK) {
      return Utils.getCompositeKeyValue(
        this.__pk,
        this.__meta,
        convertCustomTypes ? 'convertToDatabaseValue' : false,
        this.__platform,
      );
    }

    if (convertCustomTypes && this.__pk != null && prop.customType) {
      return prop.customType.convertToDatabaseValue(this.__pk, this.__platform);
    }

    if (convertCustomTypes) {
      return this.__pk ?? this.pkGetterConverted!(this.entity);
    }

    return this.__pk ?? this.pkGetter!(this.entity);
  }

  /** Returns all primary key values as an array. Used internally for composite key handling. */
  // TODO: currently used only in `Driver.syncCollection` — candidate for removal
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
          ret.push(...(childPk as Primary<Entity>[]));
        } else {
          ret.push(child as Primary<Entity>);
        }

        return ret;
      }, [] as Primary<Entity>[]);
    }

    return [pk];
  }

  /** Returns the database schema this entity belongs to. */
  getSchema(): string | undefined {
    return this.__schema;
  }

  /** Sets the database schema for this entity. */
  setSchema(schema?: string): void {
    this.__schema = schema;
  }

  /** Sets the primary key value on the entity. */
  setPrimaryKey(id: Primary<Entity> | null) {
    this.entity[this.__meta.primaryKeys[0]] = id as EntityValue<Entity>;
    this.__pk = id!;
  }

  /** Returns the primary key serialized as a string suitable for identity map lookups. */
  getSerializedPrimaryKey(): string {
    return this.pkSerializer!(this.entity);
  }

  get __meta(): EntityMetadata<Entity> {
    return (this.entity as IWrappedEntityInternal<Entity>).__meta;
  }

  get __platform(): Platform {
    return (this.entity as IWrappedEntityInternal<Entity>).__platform;
  }

  get __config(): Configuration {
    return this.__em?.config ?? (this.entity as IWrappedEntityInternal<Entity>).__config;
  }

  get __primaryKeys(): Primary<Entity>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.__meta) as Primary<Entity>[];
  }

  /** @ignore */
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `[WrappedEntity<${this.__meta.className}>]`;
  }
}
