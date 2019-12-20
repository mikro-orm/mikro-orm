import { Platform } from '../platforms';
import { Constructor, EntityProperty } from '../typings';

export abstract class Type {

  private static readonly types = new Map();

  /**
   * Converts a value from its JS representation to its database representation of this type.
   */
  convertToDatabaseValue(value: any, platform: Platform): any {
    return value;
  }

  /**
   * Converts a value from its database representation to its JS representation of this type.
   */
  convertToJSValue(value: any, platform: Platform): any {
    return value;
  }

  /**
   * Converts a value from its JS representation to its serialized JSON form of this type.
   * By default converts to the database value.
   */
  toJSON(value: any, platform: Platform): any {
    return this.convertToDatabaseValue(value, platform);
  }

  /**
   * Gets the SQL declaration snippet for a field of this type.
   */
  getColumnType(prop: EntityProperty, platform: Platform): string {
    return prop.columnType;
  }

  static getType(cls: Constructor<Type>): Type {
    const key = cls.name;

    if (!Type.types.has(key)) {
      Type.types.set(key, new cls());
    }

    return Type.types.get(key);
  }

}
