import {
  EntityMetadata,
  type AnyEntity,
  type EntityKey,
  type Constructor,
  type DeepPartial,
  type Dictionary,
  type EntityName,
  type EntityProperty,
  type CleanKeys,
  type ExpandProperty,
  type IsNever,
  type EntityCtor,
} from '../typings.js';
import type { EntityRepository } from '../entity/EntityRepository.js';
import { BaseEntity } from '../entity/BaseEntity.js';
import { type EventType, Cascade, ReferenceKind } from '../enums.js';
import type { EventSubscriber } from '../events/EventSubscriber.js';
import { Type } from '../types/Type.js';
import { Utils } from '../utils/Utils.js';
import { EnumArrayType } from '../types/EnumArrayType.js';
import type {
  PropertyOptions,
  ManyToOneOptions,
  OneToOneOptions,
  OneToManyOptions,
  ManyToManyOptions,
  EmbeddedOptions,
  EnumOptions,
  PrimaryKeyOptions,
  SerializedPrimaryKeyOptions,
  IndexOptions,
  UniqueOptions,
} from './types.js';

type TypeType = string | NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | Constructor<Type<any>> | Type<any>;
type TypeDef<Target> = { type: TypeType } | { entity: () => EntityName<Target> | EntityName[] };
type EmbeddedTypeDef<Target> = { type: TypeType } | { entity: () => EntityName<Target> | EntityName[] };
export type EntitySchemaProperty<Target, Owner> =
  | ({ kind: ReferenceKind.MANY_TO_ONE | 'm:1' } & TypeDef<Target> & ManyToOneOptions<Owner, Target>)
  | ({ kind: ReferenceKind.ONE_TO_ONE | '1:1' } & TypeDef<Target> & OneToOneOptions<Owner, Target>)
  | ({ kind: ReferenceKind.ONE_TO_MANY | '1:m' } & TypeDef<Target> & OneToManyOptions<Owner, Target>)
  | ({ kind: ReferenceKind.MANY_TO_MANY | 'm:n' } & TypeDef<Target> & ManyToManyOptions<Owner, Target>)
  | ({ kind: ReferenceKind.EMBEDDED | 'embedded' } & EmbeddedTypeDef<Target> & EmbeddedOptions<Owner, Target> & PropertyOptions<Owner>)
  | ({ enum: true } & EnumOptions<Owner>)
  | (TypeDef<Target> & PropertyOptions<Owner>);
type OmitBaseProps<Entity, Base> = IsNever<Base> extends true ? Entity : Omit<Entity, keyof Base>;
export type EntitySchemaMetadata<Entity, Base = never, Class extends EntityCtor = EntityCtor<Entity>> =
  & Omit<Partial<EntityMetadata<Entity>>, 'name' | 'properties' | 'extends'>
  & ({ name: string } | { class: Class; name?: string })
  & { extends?: EntityName<Base> }
  & { properties?: { [Key in keyof OmitBaseProps<Entity, Base> as CleanKeys<OmitBaseProps<Entity, Base>, Key>]-?: EntitySchemaProperty<ExpandProperty<NonNullable<Entity[Key]>>, Entity> } }
  & { inheritance?: 'tpt' };

export class EntitySchema<Entity = any, Base = never, Class extends EntityCtor = EntityCtor<Entity>> {

  /**
   * When schema links the entity class via `class` option, this registry allows the lookup from opposite side,
   * so we can use the class in `entities` option just like the EntitySchema instance.
   */
  static REGISTRY = new Map<AnyEntity, EntitySchema>();

  /** @internal Type-level marker for fast entity type inference */
  declare readonly '~entity': Entity;

  private readonly _meta: EntityMetadata<Entity, Class>;
  private internal = false;
  private initialized = false;

  constructor(meta: EntitySchemaMetadata<Entity, Base, Class>) {
    meta.name = meta.class ? meta.class.name : meta.name;

    if (meta.name) {
      meta.abstract ??= false;
    }

    this._meta = new EntityMetadata<Entity, Class>({
      className: meta.name,
      ...(meta as Partial<EntityMetadata<Entity>>),
    });
    this._meta.root ??= this._meta;

    if (meta.class && !(meta as Dictionary).internal) {
      EntitySchema.REGISTRY.set(meta.class, this);
    }
  }

  static fromMetadata<T = AnyEntity, U = never>(meta: EntityMetadata<T> | DeepPartial<EntityMetadata<T>>): EntitySchema<T, U> {
    const schema = new EntitySchema<T, U>({ ...meta, internal: true } as unknown as EntitySchemaMetadata<T, U>);
    schema.internal = true;

    return schema;
  }

  addProperty(name: EntityKey<Entity>, type?: TypeType, options: PropertyOptions<Entity> | EntityProperty<Entity> = {}): void {
    this.renameCompositeOptions(name, options);
    const prop = { name, kind: ReferenceKind.SCALAR, ...options, ...this.normalizeType(options, type) } as EntityProperty<Entity>;

    if (type && Type.isMappedType((type as Constructor).prototype)) {
      prop.type = type as string;
    }

    if (typeof prop.formula === 'string') {
      const formula = prop.formula;
      prop.formula = () => formula;
    }

    if (prop.formula) {
      prop.persist ??= false;
    }

    this._meta.properties[name] = prop;
  }

  addEnum(name: EntityKey<Entity>, type?: TypeType, options: EnumOptions<Entity> = {}): void {
    if (options.items instanceof Function) {
      options.items = Utils.extractEnumValues(options.items());
    }

    // enum arrays are simple numeric/string arrays, the constraint is enforced in the custom type only
    if (options.array && !options.type) {
      options.type = new EnumArrayType(`${this._meta.className}.${name}`, options.items);
      (options as EntityProperty).enum = false;
    }

    const prop = { enum: true, ...options };

    if (prop.array) {
      prop.enum = false;
    }

    // force string labels on native enums
    if (prop.nativeEnumName && Array.isArray(prop.items)) {
      prop.items = prop.items.map(val => '' + val);
    }

    this.addProperty(name, this.internal ? type : type || 'enum', prop);
  }

  addVersion(name: EntityKey<Entity>, type: TypeType, options: PropertyOptions<Entity> = {}): void {
    this.addProperty(name, type, { version: true, ...options });
  }

  addPrimaryKey(name: EntityKey<Entity>, type: TypeType, options: PrimaryKeyOptions<Entity> = {}): void {
    this.addProperty(name, type, { primary: true, ...options });
  }

  addSerializedPrimaryKey(name: EntityKey<Entity>, type: TypeType, options: SerializedPrimaryKeyOptions<Entity> = {}): void {
    this._meta.serializedPrimaryKey = name;
    this.addProperty(name, type, { serializedPrimaryKey: true, ...options });
  }

  addEmbedded<Target = AnyEntity>(name: EntityKey<Entity>, options: EmbeddedOptions<Entity, Target>): void {
    this.renameCompositeOptions(name, options);
    Utils.defaultValue(options, 'prefix', true);

    if (options.array) {
      options.object = true; // force object mode for arrays
    }

    this._meta.properties[name] = {
      name,
      kind: ReferenceKind.EMBEDDED,
      ...this.normalizeType(options),
      ...options,
    } as EntityProperty<Entity>;
  }

  addManyToOne<Target = AnyEntity>(name: EntityKey<Entity>, type: TypeType, options: ManyToOneOptions<Entity, Target>): void {
    const prop = this.createProperty(ReferenceKind.MANY_TO_ONE, options);
    prop.owner = true;

    if (prop.joinColumns && !prop.fieldNames) {
      prop.fieldNames = prop.joinColumns;
    }

    if (prop.fieldNames && !prop.joinColumns) {
      prop.joinColumns = prop.fieldNames;
    }

    // By default, the foreign key constraint is created on the relation
    Utils.defaultValue(prop, 'createForeignKeyConstraint', true);

    this.addProperty(name, type, prop);
  }

  addManyToMany<Target = AnyEntity>(name: EntityKey<Entity>, type: TypeType, options: ManyToManyOptions<Entity, Target>): void {
    options.fixedOrder = options.fixedOrder || !!options.fixedOrderColumn;

    if (!options.owner && !options.mappedBy) {
      options.owner = true;
    }

    if (options.owner) {
      Utils.renameKey(options, 'mappedBy', 'inversedBy');

      // By default, the foreign key constraint is created on the relation
      Utils.defaultValue(options, 'createForeignKeyConstraint', true);
    }

    const prop = this.createProperty(ReferenceKind.MANY_TO_MANY, options);
    this.addProperty(name, type, prop);
  }

  addOneToMany<Target = AnyEntity>(name: EntityKey<Entity>, type: TypeType, options: OneToManyOptions<Entity, Target>): void {
    const prop = this.createProperty<Entity>(ReferenceKind.ONE_TO_MANY, options);
    this.addProperty(name, type, prop);
  }

  addOneToOne<Target = AnyEntity>(name: EntityKey<Entity>, type: TypeType, options: OneToOneOptions<Entity, Target>): void {
    const prop = this.createProperty(ReferenceKind.ONE_TO_ONE, options) as EntityProperty;
    Utils.defaultValue(prop, 'owner', !!prop.inversedBy || !prop.mappedBy);
    Utils.defaultValue(prop, 'unique', prop.owner);

    if (prop.owner) {
      if (options.mappedBy) {
        Utils.renameKey(prop, 'mappedBy', 'inversedBy');
      }

      // By default, the foreign key constraint is created on the relation
      Utils.defaultValue(prop, 'createForeignKeyConstraint', true);
    }

    if (prop.joinColumns && !prop.fieldNames) {
      prop.fieldNames = prop.joinColumns;
    }

    if (prop.fieldNames && !prop.joinColumns) {
      prop.joinColumns = prop.fieldNames;
    }

    this.addProperty(name, type, prop);
  }

  addIndex<Key extends string>(options: IndexOptions<Entity, Key>): void {
    this._meta.indexes.push(options as any);
  }

  addUnique<Key extends string>(options: UniqueOptions<Entity, Key>): void {
    this._meta.uniques.push(options as any);
  }

  setCustomRepository(repository: () => Constructor): void {
    this._meta.repository = repository as () => Constructor<EntityRepository<any>>;
  }

  setExtends(base: EntityName): void {
    this._meta.extends = base;
  }

  setClass(cls: Class) {
    const oldClass = this._meta.class;
    const sameClass = this._meta.class === cls;
    this._meta.class = cls;
    this._meta.prototype = cls.prototype;
    this._meta.className = this._meta.name ?? cls.name;

    if (!sameClass || !this._meta.constructorParams) {
      this._meta.constructorParams = Utils.getConstructorParams(cls) as EntityKey<Entity>[];
    }

    if (!this.internal) {
      // Remove old class from registry if it's being replaced with a different class
      if (oldClass && oldClass !== cls && EntitySchema.REGISTRY.get(oldClass) === this) {
        EntitySchema.REGISTRY.delete(oldClass);
      }

      EntitySchema.REGISTRY.set(cls, this);
    }

    const base = Object.getPrototypeOf(cls);

    // Only set extends if the parent is NOT the auto-generated class for this same entity.
    // When the user extends the auto-generated class (from defineEntity without a class option)
    // and registers their custom class via setClass, we don't want to discover the
    // auto-generated class as a separate parent entity.
    if (base !== BaseEntity && base.name !== this._meta.className) {
      this._meta.extends ??= base.name ? base : undefined;
    }
  }

  get meta() {
    return this._meta;
  }

  get name(): string | EntityName<Entity>  {
    return this._meta.className;
  }

  get tableName(): string {
    return this._meta.tableName;
  }

  get class(): Class {
    return this._meta.class as Class;
  }

  get properties(): Record<string, any> {
    return this._meta.properties;
  }

  new(...params: ConstructorParameters<Class>): Entity {
    return new (this._meta.class as any)(...params);
  }

  /**
   * @internal
   */
  init() {
    if (this.initialized) {
      return this;
    }

    this.setClass(this._meta.class);

    // Abstract TPT entities keep their name because they have their own table
    const isTPT = (this._meta as any).inheritance === 'tpt' || this.isPartOfTPTHierarchy();

    if (this._meta.abstract && !this._meta.discriminatorColumn && !isTPT) {
      delete this._meta.name;
    }

    const tableName = this._meta.collection ?? this._meta.tableName;

    if (tableName?.includes('.') && !this._meta.schema) {
      this._meta.schema = tableName.substring(0, tableName.indexOf('.'));
      this._meta.tableName = tableName.substring(tableName.indexOf('.') + 1);
    }

    this.initProperties();
    this.initPrimaryKeys();
    this._meta.props = Object.values(this._meta.properties);
    this._meta.relations = this._meta.props.filter(prop => typeof prop.kind !== 'undefined' && prop.kind !== ReferenceKind.SCALAR && prop.kind !== ReferenceKind.EMBEDDED);
    this.initialized = true;

    return this;
  }

  /**
   * Check if this entity is part of a TPT hierarchy by walking up the extends chain.
   * This handles mid-level abstract entities (e.g., Animal -> Mammal -> Dog where Mammal is abstract).
   */
  private isPartOfTPTHierarchy(): boolean {
    let parent = this._meta.extends;

    while (parent) {
      const parentSchema = parent instanceof EntitySchema ? parent : EntitySchema.REGISTRY.get(parent as any);

      if (!parentSchema) {
        break;
      }

      if ((parentSchema._meta as any).inheritance === 'tpt') {
        return true;
      }

      parent = parentSchema._meta.extends;
    }

    return false;
  }

  private initProperties(): void {
    Utils.entries(this._meta.properties).forEach(([name, options]) => {
      if (Type.isMappedType(options.type)) {
        options.type ??= (options.type as Dictionary).constructor.name;
      }

      switch (options.kind) {
        case ReferenceKind.ONE_TO_ONE:
          this.addOneToOne<any>(name, options.type, options as unknown as OneToOneOptions<any, any>);
          break;
        case ReferenceKind.ONE_TO_MANY:
          this.addOneToMany<any>(name, options.type, options);
          break;
        case ReferenceKind.MANY_TO_ONE:
          this.addManyToOne<any>(name, options.type, options as unknown as ManyToOneOptions<any, any>);
          break;
        case ReferenceKind.MANY_TO_MANY:
          this.addManyToMany<any>(name, options.type, options as unknown as ManyToManyOptions<any, any>);
          break;
        case ReferenceKind.EMBEDDED:
          this.addEmbedded(name, options as EmbeddedOptions<any, any>);
          break;
        default:
          if (options.enum) {
            this.addEnum(name, options.type, options);
          } else if (options.primary) {
            this.addPrimaryKey(name, options.type, options);
          } else if (options.serializedPrimaryKey) {
            this.addSerializedPrimaryKey(name, options.type, options);
          } else if (options.version) {
            this.addVersion(name, options.type, options);
          } else {
            this.addProperty(name, options.type, options);
          }
      }
    });
  }

  private initPrimaryKeys(): void {
    const pks = Object.values<EntityProperty<Entity>>(this._meta.properties).filter(prop => prop.primary);

    if (pks.length > 0) {
      this._meta.primaryKeys = pks.map(prop => prop.name);
      this._meta.compositePK = pks.length > 1;
      this._meta.simplePK = !this._meta.compositePK && pks[0].kind === ReferenceKind.SCALAR && !pks[0].customType;
    }

    if (pks.length === 1 && ['number', 'bigint'].includes(pks[0].type)) {
      pks[0].autoincrement ??= true;
    }

    const serializedPrimaryKey = Object.values<EntityProperty<Entity>>(this._meta.properties).find(prop => prop.serializedPrimaryKey);

    if (serializedPrimaryKey) {
      this._meta.serializedPrimaryKey = serializedPrimaryKey.name;
    }
  }

  private normalizeType(options: PropertyOptions<Entity> | EntityProperty | EmbeddedOptions<Entity, any>, type?: string | any | Constructor<Type>) {
    if ('entity' in options) {
      /* v8 ignore next */
      if (typeof options.entity === 'string') {
        throw new Error(`Relation target needs to be an entity class or EntitySchema instance, string '${options.entity}' given instead for ${this._meta.className}.${options.name}.`);
      } else if (options.entity) {
        const tmp = options.entity();
        type = options.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
        const target = tmp instanceof EntitySchema ? tmp.meta.class : tmp;
        return { type, target };
      }
    }

    if (type instanceof Function) {
      type = type.name;
    }

    if (['String', 'Number', 'Boolean', 'Array'].includes(type)) {
      type = type.toLowerCase();
    }

    return { type };
  }

  private createProperty<T>(kind: ReferenceKind, options: PropertyOptions<T> | EntityProperty): EntityProperty<T> {
    return {
      kind,
      cascade: [Cascade.PERSIST],
      ...options,
    } as EntityProperty<T>;
  }

  private rename<U extends object>(data: U, from: string, to: string): void {
    if (from in data && !(to in data)) {
      // @ts-ignore
      data[to] = [data[from]];
      // @ts-ignore
      delete data[from];
    }
  }

  private renameCompositeOptions(name: EntityKey<Entity>, options: PropertyOptions<Entity> | EntityProperty<Entity> | EmbeddedOptions<Entity, any> = {}): void {
    if (name !== options.name && !options.fieldNames) {
      Utils.renameKey(options, 'name', 'fieldName');
    } else if (options.name && (options.fieldNames?.length ?? 0) > 1) {
      delete options.name;
    }

    this.rename(options, 'fieldName', 'fieldNames');
    this.rename(options, 'joinColumn', 'joinColumns');
    this.rename(options, 'inverseJoinColumn', 'inverseJoinColumns');
    this.rename(options, 'referenceColumnName', 'referencedColumnNames');
    this.rename(options, 'columnType', 'columnTypes');
  }

  /**
   * Adds a lifecycle hook handler to the entity schema.
   * This method allows registering hooks after the entity is defined,
   * which can be useful for avoiding circular type references.
   *
   * @example
   * ```ts
   * export const Article = defineEntity({
   *   name: 'Article',
   *   properties: { ... },
   * });
   *
   * Article.addHook('beforeCreate', async args => {
   *   args.entity.slug = args.entity.title.toLowerCase();
   * });
   * ```
   */
  addHook<Event extends EventType | `${EventType}`, T extends Entity = Entity>(
    event: Event,
    handler: NonNullable<EventSubscriber<T>[Event]>,
  ): this {
    this._meta.hooks[event as EventType] ??= [];
    this._meta.hooks[event as EventType]!.push(handler as any);
    return this;
  }

}
