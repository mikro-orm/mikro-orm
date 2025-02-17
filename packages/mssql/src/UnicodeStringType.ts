import { type Platform, Type } from '@mikro-orm/core';

export class UnicodeString {

  constructor(
    readonly value: string,
  ) {}

  valueOf(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }

  [Symbol.toPrimitive]() {
    return this.value;
  }

}

export class UnicodeStringType extends Type<string | null, string | null> {

  override getColumnType(prop: { length?: number }, platform: Platform) {
    const length = prop.length === -1 ? 'max' : (prop.length ?? this.getDefaultLength(platform));
    return `nvarchar(${length})`;
  }

  override convertToJSValue(value: string | null | UnicodeString): string | null {
    /* v8 ignore next 3 */
    if (value instanceof UnicodeString) {
      return value.value;
    }

    return value;
  }

  override convertToDatabaseValue(value: string | null): string | null {
    if (typeof value === 'string') {
      return new UnicodeString(value) as any;
    }

    return value;
  }

  override get runtimeType(): string {
    return 'string';
  }

  override toJSON(value: string | null | UnicodeString): string | null {
    return this.convertToJSValue(value);
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultVarcharLength();
  }

}
