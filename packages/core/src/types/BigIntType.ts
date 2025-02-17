import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

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
      return value;
    }

    return '' + value;
  }

  override convertToJSValue(value: string | bigint | null | undefined): bigint | number | string | null | undefined {
    /* v8 ignore next 3 */
    if (value == null) {
      return value;
    }

    switch (this.mode) {
      case 'number':
        return Number(value);
      case 'string':
        return String(value);
      case 'bigint':
      default:
        return BigInt(String(value));
    }
  }

  override toJSON(value: string | bigint | null | undefined): string | bigint | null | undefined {
    if (this.mode === 'number') {
      return value;
    }

    return this.convertToDatabaseValue(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? 'bigint';
  }

  override compareValues(a: string, b: string): boolean {
    return String(a) === String(b);
  }

}
