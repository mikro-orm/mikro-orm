import { inspect } from 'util';
import type { Platform } from '../platforms';
import type { Constructor, EntityMetadata, EntityProperty } from '../typings';

export interface TransformContext {
  fromQuery?: boolean;
  key?: string;
  mode?: 'hydration' | 'query' | 'query-data' | 'discovery' | 'serialization';
}

export abstract class Type<JSType = string, DBType = JSType> {

  private static readonly types = new Map();

  platform?: Platform;
  meta?: EntityMetadata;
  prop?: EntityProperty;

  /**
   * Converts a value from its JS representation to its database representation of this type.
   */
  convertToDatabaseValue(value: JSType, platform: Platform, context?: TransformContext): DBType {
    return value as unknown as DBType;
  }

  /**
   * Converts a value from its database representation to its JS representation of this type.
   */
  convertToJSValue(value: DBType, platform: Platform): JSType {
    return value as unknown as JSType;
  }

  /**
   * Converts a value from its JS representation to its database representation of this type.
   */
  convertToDatabaseValueSQL?(key: string, platform: Platform): string;

  /**
   * Modifies the SQL expression (identifier, parameter) to convert to a JS value.
   */
  convertToJSValueSQL?(key: string, platform: Platform): string;

  /**
   * How should the raw database values be compared? Used in `EntityComparator`.
   * Possible values: string | number | boolean | date | any | buffer | array
   */
  compareAsType(): string {
    return 'any';
  }

  /**
   * Allows to override the internal comparison logic.
   */
  compareValues?(a: DBType, b: DBType): boolean;

  get runtimeType(): string {
    const compareType = this.compareAsType();
    return compareType === 'any' ? 'string' : compareType;
  }

  get name(): string {
    return this.constructor.name;
  }

  /**
   * When a value is hydrated, we convert it back to the database value to ensure comparability,
   * as often the raw database response is not the same as the `convertToDatabaseValue` result.
   * This allows to disable the additional conversion in case you know it is not needed.
   */
  ensureComparable<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T>): boolean {
    return true;
  }

  /**
   * Converts a value from its JS representation to its serialized JSON form of this type.
   * By default uses the runtime value.
   */
  toJSON(value: JSType, platform: Platform): JSType | DBType {
    return value;
  }

  /**
   * Gets the SQL declaration snippet for a field of this type.
   */
  getColumnType(prop: EntityProperty, platform: Platform): string {
    return prop.columnTypes?.[0] ?? platform.getTextTypeDeclarationSQL(prop);
  }

  static getType<JSType, DBType = JSType>(cls: Constructor<Type<JSType, DBType>>): Type<JSType, DBType> {
    const key = cls.name;

    if (!Type.types.has(key)) {
      Type.types.set(key, new cls());
    }

    return Type.types.get(key);
  }

  /**
   * Checks whether the argument is instance of `Type`.
   */
  static isMappedType(data: any): data is Type<any> {
    return !!data?.__mappedType;
  }

  /**
   * Checks whether the argument is instance of custom `Type` class provided by the user.
   */
  static isCustomType(data: any): data is Type<any> {
    return false;
  }

  /** @ignore */
  [inspect.custom](depth: number) {
    const object = { ...this };
    const hidden = ['prop', 'platform', 'meta'] as const;
    hidden.forEach(k => delete object[k]);
    const ret = inspect(object, { depth });
    const name = (this as object).constructor.name;

    /* istanbul ignore next */
    return ret === '[Object]' ? `[${name}]` : name + ' ' + ret;
  }

}

Object.defineProperties(Type.prototype, {
  __mappedType: { value: true, enumerable: false, writable: false },
});
