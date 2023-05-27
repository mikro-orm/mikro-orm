import { Type, type TransformContext } from './Type';
import { Utils } from '../utils';
import type { EntityProperty } from '../typings';
import type { Platform } from '../platforms';
import { ValidationError } from '../errors';

export class ArrayType<T extends string | number = string> extends Type<T[] | null, string | null> {

  constructor(private readonly hydrate: (i: string) => T = i => i as T) {
    super();
  }

  override convertToDatabaseValue(value: T[] | null, platform: Platform, context?: TransformContext): string | null {
    if (!value) {
      return value as null;
    }

    if (Array.isArray(value)) {
      return platform.marshallArray(value as string[]);
    }

    /* istanbul ignore next */
    if (context?.fromQuery) {
      return value;
    }

    throw ValidationError.invalidType(ArrayType, value, 'JS');
  }

  override convertToJSValue(value: T[] | string | null, platform: Platform): T[] | null {
    if (value == null) {
      return value as null;
    }

    if (Utils.isString(value)) {
      value = platform.unmarshallArray(value) as T[];
    }

    return value.map(i => this.hydrate(i as string));
  }

  override compareAsType(): string {
    return 'string[]';
  }

  override toJSON(value: T[]): T[] {
    return value;
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getArrayDeclarationSQL();
  }

}
