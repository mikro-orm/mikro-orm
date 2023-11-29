import { MetadataStorage, MetadataValidator } from '../metadata';
import { Utils } from '../utils';
import { ReferenceKind, type Cascade, type LoadStrategy } from '../enums';
import type {
  EntityName,
  EntityProperty,
  Constructor,
  CheckCallback,
  GeneratedColumnCallback,
  AnyString,
  AnyEntity,
  EntityKey,
} from '../typings';
import type { Type, types } from '../types';

export function Property<T extends object>(options: PropertyOptions<T> = {}) {
  return function (target: any, propertyName: string) {
    const meta = MetadataStorage.getMetadataFromDecorator(target.constructor as T);
    const desc = Object.getOwnPropertyDescriptor(target, propertyName) || {};
    MetadataValidator.validateSingleDecorator(meta, propertyName, ReferenceKind.SCALAR);
    const name = options.name || propertyName;

    if (propertyName !== name && !(desc.value instanceof Function)) {
      Utils.renameKey(options, 'name', 'fieldName');
    }

    options.name = propertyName;
    const { check, ...opts } = options;
    const prop = { kind: ReferenceKind.SCALAR, ...opts } as EntityProperty<T>;
    prop.getter = !!desc.get;
    prop.setter = !!desc.set;

    if (desc.value instanceof Function) {
      prop.getter = true;
      prop.persist = false;
      prop.type = 'method';
      prop.getterName = propertyName as EntityKey<T>;
      prop.name = name as EntityKey<T>;
    }

    if (check) {
      meta.checks.push({ property: prop.name, expression: check });
    }

    meta.properties[prop.name] = prop;

    return Utils.propertyDecoratorReturnValue();
  };
}

export type PropertyOptions<Owner> = {
  /**
   * Alias for `fieldName`.
   */
  name?: string;
  /**
   * Specify database column name for this property.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldName?: string;
  /**
   * Specify database column names for this property.
   * Same as `fieldName` but for composite FKs.
   *
   * @see https://mikro-orm.io/docs/naming-strategy
   */
  fieldNames?: string[];
  /**
   * Specify exact database column type for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  columnType?: ColumnType | AnyString;
  /**
   * Explicitly specify the runtime type.
   *
   * @see https://mikro-orm.io/docs/metadata-providers
   * @see https://mikro-orm.io/docs/custom-types
   */
  type?: keyof typeof types | 'ObjectId' | Date | Constructor<AnyEntity> | Constructor<Type<any>> | Type<any> | (() => unknown) | ColumnType | AnyString;
  /**
   * Set length of database column, used for datetime/timestamp/varchar column types for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  length?: number;
  /**
   * Set precision of database column to represent the number of significant digits. (SQL only)
   */
  precision?: number;
  /**
   * Set scale of database column to represents the number of digits after the decimal point. (SQL only)
   */
  scale?: number;
  /**
   * Explicitly specify the auto increment of the primary key.
   */
  autoincrement?: boolean;
  /**
   * Add the property to the `returning` statement.
   */
  returning?: boolean;
  /**
   * Automatically set the property value when entity gets created, executed during flush operation.
   * @param entity
   */
  onCreate?: (entity: Owner) => any;
  /**
   * Automatically update the property value every time entity gets updated, executed during flush operation.
   * @param entity
   */
  onUpdate?: (entity: Owner) => any;
  /**
   * Specify default column value for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   * This is a runtime value, assignable to the entity property. (SQL only)
   */
  default?: string | string[] | number | number[] | boolean | null;
  /**
   * Specify SQL functions for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   * Since v4 you should use defaultRaw for SQL functions. e.g. now()
   */
  defaultRaw?: string;
  /**
   * Set to map some SQL snippet for the entity.
   *
   * @see https://mikro-orm.io/docs/defining-entities#formulas Formulas
   */
  formula?: string | ((alias: string) => string);
  /**
   * For generated columns. This will be appended to the column type after the `generated always` clause.
   */
  generated?: string | GeneratedColumnCallback<Owner>;
  /**
   * Set column as nullable for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}.
   */
  nullable?: boolean;
  /**
   * Set column as unsigned for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unsigned?: boolean;
  /**
   * Set false to define {@link https://mikro-orm.io/docs/serializing#shadow-properties Shadow Property}.
   */
  persist?: boolean;
  /**
   * Set false to disable hydration of this property. Useful for persisted getters.
   */
  hydrate?: boolean;
  /**
   * Enable `ScalarReference` wrapper for lazy values. Use this in combination with `lazy: true` to have a type-safe accessor object in place of the value.
   */
  ref?: boolean;
  /**
   * Set false to disable change tracking on a property level.
   *
   * @see https://mikro-orm.io/docs/unit-of-work#change-tracking-and-performance-considerations
   */
  trackChanges?: boolean;
  /**
   * Set to true to omit the property when {@link https://mikro-orm.io/docs/serializing Serializing}.
   */
  hidden?: boolean;
  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via version field. (SQL only)
   */
  version?: boolean;
  /**
   * Set to true to enable {@link https://mikro-orm.io/docs/transactions#optimistic-locking Optimistic Locking} via concurrency fields.
   */
  concurrencyCheck?: boolean;
  /**
   * Explicitly specify index on a property.
   */
  index?: boolean | string;
  /**
   * Set column as unique for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  unique?: boolean | string;
  /**
   * Specify column with check constraints. (Postgres driver only)
   *
   * @see https://mikro-orm.io/docs/defining-entities#check-constraints
   */
  check?: string | CheckCallback<Owner>;
  /**
   * Set to omit the property from the select clause for lazy loading.
   *
   * @see https://mikro-orm.io/docs/defining-entities#lazy-scalar-properties
   */
  lazy?: boolean;
  /**
   * Set true to define entity's unique primary key identifier.
   * Alias for `@PrimaryKey()` decorator
   *
   * @see https://mikro-orm.io/docs/decorators#primarykey
   */
  primary?: boolean;
  /**
   * Set true to define the properties as setter. (virtual)
   *
   * @example
   * ```
   * @Property({ setter: true })
   * set address(value: string) {
   *     this._address = value.toLocaleLowerCase();
   * }
   * ```
   */
  setter?: boolean;
  /**
   * Set true to define the properties as getter. (virtual)
   *
   * @example
   * ```
   * @Property({ getter: true })
   * get fullName() {
   *   return this.firstName + this.lastName;
   * }
   * ```
   */
  getter?: boolean;
  /**
   * Set to define serialized primary key for MongoDB. (virtual)
   * Alias for `@SerializedPrimaryKey()` decorator.
   *
   * @see https://mikro-orm.io/docs/decorators#serializedprimarykey
   */
  serializedPrimaryKey?: boolean;
  /**
   * Set to use serialize property. Allow to specify a callback that will be used when serializing a property.
   *
   * @see https://mikro-orm.io/docs/serializing#property-serializers
   */
  serializer?: (value: any) => any;
  /**
   * Specify name of key for the serialized value.
   */
  serializedName?: string;
  /**
   * Specify a custom order based on the values. (SQL only)
   */
  customOrder?: string[] | number[] | boolean[];
  /**
   * Specify comment of column for {@link https://mikro-orm.io/docs/schema-generator Schema Generator}. (SQL only)
   */
  comment?: string;
  /** mysql only */
  extra?: string;
  /**
   * Set to avoid a perpetual diff from the {@link https://mikro-orm.io/docs/schema-generator Schema Generator} when columns are generated.
   *
   * @see https://mikro-orm.io/docs/defining-entities#sql-generated-columns
   */
  ignoreSchemaChanges?: ('type' | 'extra')[];
};

export interface ReferenceOptions<Owner, Target> extends PropertyOptions<Owner> {
  entity?: string | (() => EntityName<Target>);
  cascade?: Cascade[];
  eager?: boolean;
  strategy?: LoadStrategy;
}

/**
 * Inspired by https://github.com/typeorm/typeorm/blob/941b584ba135617e55d6685caef671172ec1dc03/src/driver/types/ColumnTypes.ts
 * @ignore
 */
export type ColumnType =
  | 'int' | 'int4' | 'integer' | 'bigint' | 'int8' | 'int2' | 'tinyint' | 'smallint' | 'mediumint'
  | 'double' | 'double precision' | 'real' | 'float8' | 'decimal' | 'numeric' | 'float' | 'float4'
  | 'datetime' | 'time' | 'time with time zone' | 'timestamp' | 'timestamp with time zone' | 'timetz' | 'timestamptz' | 'date' | 'interval'
  | 'character varying' | 'varchar' | 'char' | 'character' | 'uuid' | 'text' | 'tinytext' | 'mediumtext' | 'longtext'
  | 'boolean' | 'bool' | 'bit' | 'enum'
  | 'blob' | 'tinyblob' | 'mediumblob' | 'longblob' | 'bytea'
  | 'point' | 'line' | 'lseg' | 'box' | 'circle' | 'path' | 'polygon' | 'geometry'
  | 'tsvector' | 'tsquery'
  | 'json' | 'jsonb';
