import type { PopulatePath } from '../enums.js';
import { inspect } from 'node:util';
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

export class WrappedEntity<Entity extends object> {

  declare __initialized: boolean;
  declare __touched: boolean;
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
    this.__touched = false;
    this.__serializationContext = {};
    this.__loadedProperties = new Set<string>();
    this.__data = {};
    this.__processing = false;
  }

  isInitialized(): boolean {
    return this.__initialized;
  }

  isTouched(): boolean {
    return this.__touched;
  }

  isManaged(): boolean {
    return !!this.__managed;
  }

  populated(populated: boolean | undefined = true): void {
    this.__populated = populated;
  }

  setSerializationContext<
    Hint extends string = never,
    Fields extends string = '*',
    Exclude extends string = never,
  >(options: LoadHint<Entity, Hint, Fields, Exclude>): void {
    const exclude = options.exclude as readonly string[] ?? [];
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

  assign<
    Naked extends FromEntityType<Entity> = FromEntityType<Entity>,
    Convert extends boolean = false,
    Data extends EntityData<Naked, Convert> | Partial<EntityDTO<Naked>> = EntityData<Naked, Convert> | Partial<EntityDTO<Naked>>,
  >(data: Data & IsSubset<EntityData<Naked>, Data>, options?: AssignOptions<Convert>): MergeSelected<Entity, Naked, keyof Data & string> {
    if ('assign' in this.entity) {
      return (this.entity as Dictionary).assign(data, options);
    }

    return EntityAssigner.assign(this.entity, data as any, options) as any;
  }

  async init<
    Hint extends string = never,
    Fields extends string = '*',
    Excludes extends string = never,
  >(options?: FindOneOptions<Entity, Hint, Fields, Excludes>): Promise<Loaded<Entity, Hint, Fields, Excludes> | null> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    return this.__em.findOne(this.entity.constructor.name, this.entity, { ...options, refresh: true, schema: this.__schema });
  }

  async populate<Hint extends string = never>(
    populate: AutoPath<Entity, Hint, PopulatePath.ALL>[] | false,
    options: EntityLoaderOptions<Entity> = {},
  ): Promise<Loaded<Entity, Hint>> {
    if (!this.__em) {
      throw ValidationError.entityNotManaged(this.entity);
    }

    // @ts-ignore hard to type
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
    return this.__em?.config ?? (this.entity as IWrappedEntityInternal<Entity>).__config;
  }

  get __primaryKeys(): Primary<Entity>[] {
    return Utils.getPrimaryKeyValues(this.entity, this.__meta!.primaryKeys) as Primary<Entity>[];
  }

  /** @ignore */
  [inspect.custom]() {
    return `[WrappedEntity<${this.__meta!.className}>]`;
  }

}
