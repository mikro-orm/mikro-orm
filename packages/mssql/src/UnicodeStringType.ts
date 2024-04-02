import { Type, type EntityProperty } from '@mikro-orm/core';

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

  override getColumnType(prop: EntityProperty) {
    return `nvarchar(${prop.length ?? 255})`;
  }

  override convertToJSValue(value: string | null | UnicodeString): string | null {
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

  override toJSON(value: string | null | UnicodeString): string | null {
    return this.convertToJSValue(value);
  }

}
