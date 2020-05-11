import { Type } from './Type';
import { Utils, ValidationError } from '../utils';
import { EntityProperty } from '../typings';
import { Platform } from '../platforms';

export class ArrayType<T extends string | number = string> extends Type<T[] | null, string | null> {

  constructor(private readonly hydrate: (i: string) => T = i => i as T) {
    super();
  }

  convertToDatabaseValue(value: T[] | null, platform: Platform): string | null {
    if (!value) {
      return value as null;
    }

    if (Array.isArray(value)) {
      return platform.marshallArray(value as string[]);
    }

    throw ValidationError.invalidType(ArrayType, value, 'JS');
  }

  convertToJSValue(value: T[] | string | null, platform: Platform): T[] | null {
    if (!value) {
      return value as null;
    }

    if (Utils.isString(value)) {
      value = platform.unmarshallArray(value) as T[];
    }

    return value.map(i => this.hydrate(i as string));
  }

  toJSON(value: T[]): T[] {
    return value;
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getArrayDeclarationSQL();
  }

}
