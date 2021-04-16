import { Platform } from '../platforms';
import { Constructor, EntityProperty } from '../typings';

export abstract class Type<JSType = string, DBType = JSType> {

  private static readonly types = new Map();

  /**
   * Converts a value from its JS representation to its database representation of this type.
   */
  convertToDatabaseValue(value: JSType | DBType, platform: Platform, fromQuery?: boolean): DBType {
    return value as DBType;
  }

  /**
   * Converts a value from its database representation to its JS representation of this type.
   */
  convertToJSValue(value: JSType | DBType, platform: Platform): JSType {
    return value as JSType;
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

}
