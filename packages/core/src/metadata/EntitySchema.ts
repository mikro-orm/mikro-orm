import {
  EntityMetadata,
  type AnyEntity,
  type EntityKey,
  type Constructor,
  type DeepPartial,
  type Dictionary,
  type EntityName,
  type EntityProperty,
  type ExcludeFunctions,
  type ExpandProperty,
  type IsNever,
} from '../typings';
import type {
  EmbeddedOptions, EnumOptions, IndexOptions, ManyToManyOptions, ManyToOneOptions, OneToManyOptions, OneToOneOptions, PrimaryKeyOptions, PropertyOptions,
  SerializedPrimaryKeyOptions, UniqueOptions,
} from '../decorators';
import type { EntityRepository } from '../entity/EntityRepository';
import { BaseEntity } from '../entity/BaseEntity';
import { Cascade, ReferenceKind } from '../enums';
import { Type } from '../types';
import { Utils } from '../utils';
import { EnumArrayType } from '../types/EnumArrayType';

type TypeType = string | NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | Constructor<Type<any>> | Type<any>;
type TypeDef<Target> = { type: TypeType } | { entity: string | (() => string | EntityName<Target>) };
export type EntitySchemaProperty<Target, Owner> =
  | ({ kind: ReferenceKind.MANY_TO_ONE | 'm:1' } & TypeDef<Target> & ManyToOneOptions<Owner, Target>)
  | ({ kind: ReferenceKind.ONE_TO_ONE | '1:1' } & TypeDef<Target> & OneToOneOptions<Owner, Target>)
  | ({ kind: ReferenceKind.ONE_TO_MANY | '1:m' } & TypeDef<Target> & OneToManyOptions<Owner, Target>)
  | ({ kind: ReferenceKind.MANY_TO_MANY | 'm:n' } & TypeDef<Target> & ManyToManyOptions<Owner, Target>)
  | ({ kind: ReferenceKind.EMBEDDED | 'embedded' } & TypeDef<Target> & EmbeddedOptions & PropertyOptions<Owner>)
  | ({ enum: true } & EnumOptions<Owner>)
  | (TypeDef<Target> & PropertyOptions<Owner>);
type OmitBaseProps<Entity, Base> = IsNever<Base> extends true ? Entity : Omit<Entity, keyof Base>;
export type EntitySchemaMetadata<Entity, Base = never> =
  & Omit<Partial<EntityMetadata<Entity>>, 'name' | 'properties' | 'extends'>
  & ({ name: string } | { class: Constructor<Entity>; name?: string })
  & { extends?: string | EntitySchema<Base> }
  & { properties?: { [Key in keyof OmitBaseProps<Entity, Base> as ExcludeFunctions<OmitBaseProps<Entity, Base>, Key>]-?: EntitySchemaProperty<ExpandProperty<NonNullable<Entity[Key]>>, Entity> } };

export class EntitySchema<Entity = any, Base = never> {

  /**
   * When schema links the entity class via `class` option, this registry allows the lookup from opposite side,
   * so we can use the class in `entities` option just like the EntitySchema instance.
   */
  static REGISTRY = new Map<AnyEntity, EntitySchema>();

  private readonly _meta = new EntityMetadata<Entity>();
  private internal = false;
  private initialized = false;

  constructor(meta: EntitySchemaMetadata<Entity, Base>) {
    meta.name = meta.class ? meta.class.name : meta.name;

    if (meta.name) {
      meta.abstract ??= false;
    }

    if (meta.class && !(meta as Dictionary).internal) {
      EntitySchema.REGISTRY.set(meta.class, this);
    }

    if (meta.tableName || meta.collection) {
      Utils.renameKey(meta, 'tableName', 'collection');
      meta.tableName = meta.collection;
    }

    Object.assign(this._meta, { className: meta.name }, meta);
    this._meta.root ??= this._meta;
  }

  static fromMetadata<T = AnyEntity, U = never>(meta: EntityMetadata<T> | DeepPartial<EntityMetadata<T>>): EntitySchema<T, U> {
    const schema = new EntitySchema<T, U>({ ...meta, internal: true } as unknown as EntitySchemaMetadata<T, U>);
    schema.internal = true;

    return schema;
  }

  addProperty(name: EntityKey<Entity>, type?: TypeType, options: PropertyOptions<Entity> | EntityProperty<Entity> = {}): void {
    const rename = <U> (data: U, from: string, to: string): void => {
      if (from in options && !(to in options)) {
        // @ts-ignore
        options[to] = [options[from]];
        // @ts-ignore
        delete options[from];
      }
    };

    if (name !== options.name) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    rename(options, 'fieldName', 'fieldNames');
    rename(options, 'ref', 'ref');
    rename(options, 'joinColumn', 'joinColumns');
    rename(options, 'inverseJoinColumn', 'inverseJoinColumns');
    rename(options, 'referenceColumnName', 'referencedColumnNames');
    rename(options, 'columnType', 'columnTypes');

    const prop = { name, kind: ReferenceKind.SCALAR, ...options, type: this.normalizeType(options, type) } as EntityProperty<Entity>;

    if (type && Type.isMappedType((type as Constructor).prototype)) {
      prop.type = type as string;
    }

    if (Utils.isString(prop.formula)) {
      const formula = prop.formula as string; // tmp var is needed here
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
    this.addProperty(name, type, options);
  }

  addEmbedded<Target = AnyEntity>(name: EntityKey<Entity>, options: EmbeddedOptions): void {
    Utils.defaultValue(options, 'prefix', true);

    if (options.array) {
      options.object = true; // force object mode for arrays
    }

    this._meta.properties[name] = {
      name,
      type: this.normalizeType(options),
      kind: ReferenceKind.EMBEDDED,
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

    this.addProperty(name, type, prop);
  }

  addManyToMany<Target = AnyEntity>(name: EntityKey<Entity>, type: TypeType, options: ManyToManyOptions<Entity, Target>): void {
    options.fixedOrder = options.fixedOrder || !!options.fixedOrderColumn;

    if (!options.owner && !options.mappedBy) {
      options.owner = true;
    }

    if (options.owner) {
      Utils.renameKey(options, 'mappedBy', 'inversedBy');
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

    if (prop.owner && options.mappedBy) {
      Utils.renameKey(prop, 'mappedBy', 'inversedBy');
    }

    if (prop.joinColumns && !prop.fieldNames) {
      prop.fieldNames = prop.joinColumns;
    }

    if (prop.fieldNames && !prop.joinColumns) {
      prop.joinColumns = prop.fieldNames;
    }

    this.addProperty(name, type, prop);
  }

  addIndex(options: IndexOptions<Entity>): void {
    this._meta.indexes.push(options as any);
  }

  addUnique(options: UniqueOptions<Entity>): void {
    this._meta.uniques.push(options as any);
  }

  setCustomRepository(repository: () => Constructor): void {
    this._meta.repository = repository as () => Constructor<EntityRepository<any>>;
  }

  setExtends(base: string | EntitySchema): void {
    this._meta.extends = base as string;
  }

  setClass(proto: Constructor<Entity>) {
    this._meta.class = proto;
    this._meta.prototype = proto.prototype;
    this._meta.className = proto.name;
    const tokens = Utils.tokenize(proto);
    this._meta.constructorParams = Utils.getParamNames(tokens, 'constructor') as EntityKey<Entity>[];
    this._meta.toJsonParams = Utils.getParamNames(tokens, 'toJSON').filter(p => p !== '...args');

    if (!this.internal) {
      EntitySchema.REGISTRY.set(proto, this);
    }

    if (Object.getPrototypeOf(proto) !== BaseEntity) {
      this._meta.extends = this._meta.extends || Object.getPrototypeOf(proto).name || undefined;
    }
  }

  get meta() {
    return this._meta;
  }

  get name(): EntityName<Entity>  {
    return this._meta.className;
  }

  /**
   * @internal
   */
  init() {
    if (this.initialized) {
      return this;
    }

    if (!this._meta.class) {
      const name = this.name as string;
      this._meta.class = ({ [name]: class {} })[name] as Constructor<Entity>;
    }

    this.setClass(this._meta.class);

    if (this._meta.abstract && !this._meta.discriminatorColumn) {
      delete this._meta.name;
    }

    const tableName = this._meta.collection ?? this._meta.tableName;

    if (tableName?.includes('.') && !this._meta.schema) {
      this._meta.schema = tableName.substring(0, tableName.indexOf('.'));
      this._meta.collection = tableName.substring(tableName.indexOf('.') + 1);
    }

    this.initProperties();
    this.initPrimaryKeys();
    this._meta.props = Object.values(this._meta.properties);
    this._meta.relations = this._meta.props.filter(prop => prop.kind !== ReferenceKind.SCALAR && prop.kind !== ReferenceKind.EMBEDDED);
    this.initialized = true;

    return this;
  }

  private initProperties(): void {
    Utils.entries(this._meta.properties).forEach(([name, options]) => {
      if (Type.isMappedType(options.type)) {
        options.type ??= (options.type as Dictionary).constructor.name;
      }

      switch (options.kind) {
        case ReferenceKind.ONE_TO_ONE:
          this.addOneToOne<any>(name, options.type, options);
          break;
        case ReferenceKind.ONE_TO_MANY:
          this.addOneToMany<any>(name, options.type, options);
          break;
        case ReferenceKind.MANY_TO_ONE:
          this.addManyToOne<any>(name, options.type, options);
          break;
        case ReferenceKind.MANY_TO_MANY:
          this.addManyToMany<any>(name, options.type, options);
          break;
        case ReferenceKind.EMBEDDED:
          this.addEmbedded(name, options as EmbeddedOptions);
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

    if (pks.length === 1 && pks[0].type === 'number') {
      pks[0].autoincrement ??= true;
    }

    const serializedPrimaryKey = Object.values<EntityProperty<Entity>>(this._meta.properties).find(prop => prop.serializedPrimaryKey);

    if (serializedPrimaryKey) {
      this._meta.serializedPrimaryKey = serializedPrimaryKey.name;
    }
  }

  private normalizeType(options: PropertyOptions<Entity> | EntityProperty, type?: string | any | Constructor<Type>) {
    if ('entity' in options) {
      if (Utils.isString(options.entity)) {
        type = options.type = options.entity;
      } else if (options.entity) {
        const tmp = options.entity();
        type = options.type = Array.isArray(tmp) ? tmp.map(t => Utils.className(t)).sort().join(' | ') : Utils.className(tmp);
      }
    }

    if (type instanceof Function) {
      type = type.name;
    }

    if (['String', 'Number', 'Boolean', 'Array'].includes(type)) {
      type = type.toLowerCase();
    }

    return type;
  }

  private createProperty<T>(kind: ReferenceKind, options: PropertyOptions<T> | EntityProperty): EntityProperty<T> {
    return {
      kind,
      cascade: [Cascade.PERSIST],
      ...options,
    } as EntityProperty<T>;
  }

}
