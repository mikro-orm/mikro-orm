import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * This type will automatically convert string values returned from the database to native JS bigints (default)
 * or numbers (safe only for values up to `Number.MAX_SAFE_INTEGER`), or strings, depending on the `mode`.
 */
export class BigIntType extends Type<string | bigint | number | null | undefined, string | null | undefined> {

  constructor(readonly mode: 'bigint' | 'number' | 'string' = 'bigint') {
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
      case 'bigint':
        return BigInt(value);
      case 'number':
        return Number(value);
      case 'string':
      default:
        return String(value);
    }
  }

  override toJSON(value: string | bigint | null | undefined): string | bigint | null | undefined {
    return this.convertToDatabaseValue(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'bigint';
  }

}
