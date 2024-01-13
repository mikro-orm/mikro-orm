import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * This type will automatically convert string values returned from the database to native JS bigints (default)
 * or numbers (safe only for values up to `Number.MAX_SAFE_INTEGER`), or strings, depending on the `mode`.
 */
export class BigIntType extends Type<string | bigint | number | null | undefined, string | null | undefined> {

  constructor(public mode?: 'bigint' | 'number' | 'string') {
    super();
  }

  override convertToDatabaseValue(value: string | bigint | null | undefined): string | null | undefined {
    if (value == null) {
      return value as null | undefined;
    }

    return '' + value;
  }

  override convertToJSValue(value: string | bigint | null | undefined): bigint | number | string | null | undefined {
    if (value == null) {
      return value as null | undefined;
    }

    switch (this.mode) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'bigint':
      default:
        return BigInt(value);
    }
  }

  override toJSON(value: string | bigint | null | undefined): string | bigint | null | undefined {
    return this.convertToDatabaseValue(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? 'bigint';
  }

}
