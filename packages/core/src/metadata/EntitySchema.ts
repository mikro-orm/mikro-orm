import { AnyEntity, Constructor, DeepPartial, Dictionary, EntityMetadata, EntityName, EntityProperty, ExpandProperty, NonFunctionPropertyNames } from '../typings';
import {
  EmbeddedOptions, EnumOptions, IndexOptions, ManyToManyOptions, ManyToOneOptions, OneToManyOptions, OneToOneOptions, PrimaryKeyOptions, PropertyOptions,
  SerializedPrimaryKeyOptions, UniqueOptions,
} from '../decorators';
import { BaseEntity, EntityRepository } from '../entity';
import { Cascade, ReferenceType } from '../enums';
import { Type } from '../types';
import { Utils } from '../utils';

type TypeType = string | NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ArrayConstructor | Constructor<Type<any>>;
type TypeDef<T> = { type: TypeType } | { customType: Type<any> } | { entity: string | (() => string | EntityName<T>) };
type Property<T, O> =
  | ({ reference: ReferenceType.MANY_TO_ONE | 'm:1' } & TypeDef<T> & ManyToOneOptions<T, O>)
  | ({ reference: ReferenceType.ONE_TO_ONE | '1:1' } & TypeDef<T> & OneToOneOptions<T, O>)
  | ({ reference: ReferenceType.ONE_TO_MANY | '1:m' } & TypeDef<T> & OneToManyOptions<T, O>)
  | ({ reference: ReferenceType.MANY_TO_MANY | 'm:n' } & TypeDef<T> & ManyToManyOptions<T, O>)
  | ({ reference: ReferenceType.EMBEDDED | 'embedded' } & TypeDef<T> & EmbeddedOptions & PropertyOptions<O>)
  | ({ enum: true } & EnumOptions<O>)
  | (TypeDef<T> & PropertyOptions<O>);
type PropertyKey<T, U> = NonFunctionPropertyNames<Omit<T, keyof U>>;
type Metadata<T, U> =
  & Omit<Partial<EntityMetadata<T>>, 'name' | 'properties'>
  & ({ name: string } | { class: Constructor<T>; name?: string })
  & { properties?: { [K in PropertyKey<T, U> & string]-?: Property<ExpandProperty<NonNullable<T[K]>>, T> } };

export class EntitySchema<T extends AnyEntity<T> = AnyEntity, U extends AnyEntity<U> | undefined = undefined> {

  private readonly _meta: EntityMetadata<T> = {} as EntityMetadata<T>;
  private internal = false;
  private initialized = false;

  constructor(meta: Metadata<T, U>) {
    meta.name = meta.class ? meta.class.name : meta.name;

    if (meta.tableName || meta.collection) {
      Utils.renameKey(meta, 'tableName', 'collection');
      meta.tableName = meta.collection;
    }

    Object.assign(this._meta, { className: meta.name, properties: {}, hooks: {}, filters: {}, primaryKeys: [], indexes: [], uniques: [] }, meta);
  }

  static fromMetadata<T extends AnyEntity<T> = AnyEntity, U extends AnyEntity<U> | undefined = undefined>(meta: EntityMetadata<T> | DeepPartial<EntityMetadata<T>>): EntitySchema<T, U> {
    const schema = new EntitySchema<T, U>(meta as Metadata<T, U>);
    schema.internal = true;

    return schema;
  }

  addProperty(name: string & keyof T, type?: TypeType, options: PropertyOptions<T> | EntityProperty = {}): void {
    const rename = <U> (data: U, from: string, to: string): void => {
      if (options[from] && !options[to]) {
        options[to] = [options[from]];
        delete options[from];
      }
    };

    if (name !== options.name) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    rename(options, 'fieldName', 'fieldNames');
    rename(options, 'joinColumn', 'joinColumns');
    rename(options, 'inverseJoinColumn', 'inverseJoinColumns');
    rename(options, 'referenceColumnName', 'referencedColumnNames');
    rename(options, 'columnType', 'columnTypes');

    const prop = { name, reference: ReferenceType.SCALAR, ...options, type: this.normalizeType(options, type) } as EntityProperty<T>;

    if (type && Object.getPrototypeOf(type) === Type) {
      prop.type = type as string;
    }

    if (Utils.isString(prop.formula)) {
      const formula = prop.formula as string; // tmp var is needed here
      prop.formula = () => formula;
    }

    this._meta.properties[name] = prop;
  }

  addEnum(name: string & keyof T, type?: TypeType, options: EnumOptions<T> = {}): void {
    if (options.items instanceof Function) {
      options.items = Utils.extractEnumValues(options.items());
    }

    const prop = { enum: true, ...options };
    this.addProperty(name, this.internal ? type : type || 'enum', prop);
  }

  addVersion(name: string & keyof T, type: TypeType, options: PropertyOptions<T> = {}): void {
    this.addProperty(name, type, { version: true, ...options });
  }

  addPrimaryKey(name: string & keyof T, type: TypeType, options: PrimaryKeyOptions<T> = {}): void {
    this.addProperty(name, type, { primary: true, ...options });
  }

  addSerializedPrimaryKey(name: string & keyof T, type: TypeType, options: SerializedPrimaryKeyOptions<T> = {}): void {
    this._meta.serializedPrimaryKey = name;
    this.addProperty(name, type, options);
  }

  addEmbedded<K = unknown>(name: string & keyof T, options: EmbeddedOptions): void {
    Utils.defaultValue(options, 'prefix', true);
    this._meta.properties[name] = {
      name,
      type: this.normalizeType(options),
      reference: ReferenceType.EMBEDDED,
      ...options,
    } as EntityProperty<T>;
  }

  addManyToOne<K = unknown>(name: string & keyof T, type: TypeType, options: ManyToOneOptions<K, T>): void {
    const prop = this.createProperty(ReferenceType.MANY_TO_ONE, options);
    Utils.defaultValue(prop, 'nullable', prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL));

    if (prop.joinColumns && !prop.fieldNames) {
      prop.fieldNames = prop.joinColumns;
    }

    if (prop.fieldNames && !prop.joinColumns) {
      prop.joinColumns = prop.fieldNames;
    }

    this.addProperty(name, type, prop);
  }

  addManyToMany<K = unknown>(name: string & keyof T, type: TypeType, options: ManyToManyOptions<K, T>): void {
    options.fixedOrder = options.fixedOrder || !!options.fixedOrderColumn;

    if (!options.owner && !options.mappedBy) {
      options.owner = true;
    }

    if (options.owner) {
      Utils.renameKey(options, 'mappedBy', 'inversedBy');
    }

    const prop = this.createProperty(ReferenceType.MANY_TO_MANY, options);
    this.addProperty(name, type, prop);
  }

  addOneToMany<K = unknown>(name: string & keyof T, type: TypeType, options: OneToManyOptions<K, T>): void {
    const prop = this.createProperty<T>(ReferenceType.ONE_TO_MANY, options);
    this.addProperty(name, type, prop);
  }

  addOneToOne<K = unknown>(name: string & keyof T, type: TypeType, options: OneToOneOptions<K, T>): void {
    const prop = this.createProperty(ReferenceType.ONE_TO_ONE, options) as EntityProperty;
    Utils.defaultValue(prop, 'nullable', prop.cascade.includes(Cascade.REMOVE) || prop.cascade.includes(Cascade.ALL));
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

  addIndex<T>(options: Required<Omit<IndexOptions<T>, 'name' | 'type' | 'options'>> & { name?: string; type?: string; options?: Dictionary }): void {
    this._meta.indexes.push(options as any);
  }

  addUnique<T>(options: Required<Omit<UniqueOptions<T>, 'name' | 'options'>> & { name?: string; options?: Dictionary }): void {
    this._meta.uniques.push(options as any);
  }

  setCustomRepository(repository: () => Constructor<EntityRepository<T>>): void {
    this._meta.customRepository = repository;
  }

  setExtends(base: string): void {
    this._meta.extends = base;
  }

  setClass(proto: Constructor<T>) {
    this._meta.class = proto;
    this._meta.prototype = proto.prototype;
    this._meta.className = proto.name;
    this._meta.constructorParams = Utils.getParamNames(proto, 'constructor');
    this._meta.toJsonParams = Utils.getParamNames(proto, 'toJSON').filter(p => p !== '...args');

    if (Object.getPrototypeOf(proto) !== BaseEntity) {
      this._meta.extends = this._meta.extends || Object.getPrototypeOf(proto).name || undefined;
    }
  }

  get meta() {
    return this._meta;
  }

  get name(): EntityName<T>  {
    return this._meta.name!;
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
      this._meta.class = ({ [name]: class {} })[name] as Constructor<T>;
    }

    this.setClass(this._meta.class);

    if (this._meta.abstract && !this._meta.discriminatorColumn) {
      delete this._meta.name;
    }

    this.initProperties();
    this.initPrimaryKeys();
    this._meta.props = Object.values(this._meta.properties);
    this.initialized = true;

    return this;
  }

  private initProperties(): void {
    Object.entries<Property<T, unknown>>(this._meta.properties as Dictionary).forEach(([name, options]) => {
      options.type = 'customType' in options ? options.customType!.constructor.name : options.type;

      switch ((options as EntityProperty).reference) {
        case ReferenceType.ONE_TO_ONE:
          this.addOneToOne(name as keyof T & string, options.type as string, options as OneToOneOptions<T, AnyEntity>);
          break;
        case ReferenceType.ONE_TO_MANY:
          this.addOneToMany(name as keyof T & string, options.type as string, options as OneToManyOptions<T, AnyEntity>);
          break;
        case ReferenceType.MANY_TO_ONE:
          this.addManyToOne(name as keyof T & string, options.type as string, options as ManyToOneOptions<T, AnyEntity>);
          break;
        case ReferenceType.MANY_TO_MANY:
          this.addManyToMany(name as keyof T & string, options.type as string, options as ManyToManyOptions<T, AnyEntity>);
          break;
        case ReferenceType.EMBEDDED:
          this.addEmbedded(name as keyof T & string, options as EmbeddedOptions);
          break;
        default:
          if ((options as EntityProperty).enum) {
            this.addEnum(name as keyof T & string, options.type as string, options);
          } else if (options.primary) {
            this.addPrimaryKey(name as keyof T & string, options.type as string, options);
          } else if (options.serializedPrimaryKey) {
            this.addSerializedPrimaryKey(name as keyof T & string, options.type as string, options);
          } else if (options.version) {
            this.addVersion(name as keyof T & string, options.type as string, options);
          } else {
            this.addProperty(name as keyof T & string, options.type as string, options);
          }
      }
    });
  }

  private initPrimaryKeys(): void {
    const pks = Object.values<EntityProperty<T>>(this._meta.properties).filter(prop => prop.primary);

    if (pks.length > 0) {
      this._meta.primaryKeys = pks.map(prop => prop.name);
      this._meta.compositePK = pks.length > 1;
    }

    // FK used as PK, we need to cascade
    if (pks.length === 1 && pks[0].reference !== ReferenceType.SCALAR) {
      pks[0].onDelete = 'cascade';
    }

    const serializedPrimaryKey = Object.values<EntityProperty<T>>(this._meta.properties).find(prop => prop.serializedPrimaryKey);

    if (serializedPrimaryKey) {
      this._meta.serializedPrimaryKey = serializedPrimaryKey.name;
    }
  }

  private normalizeType(options: PropertyOptions<T> | EntityProperty, type?: string | any | Constructor<Type>) {
    if ('entity' in options) {
      if (Utils.isString(options.entity)) {
        type = options.type = options.entity;
      } else if (options.entity) {
        type = options.type = Utils.className(options.entity());
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

  private createProperty<T>(reference: ReferenceType, options: PropertyOptions<T> | EntityProperty) {
    return {
      reference,
      cascade: [Cascade.PERSIST],
      ...options,
    };
  }

}
