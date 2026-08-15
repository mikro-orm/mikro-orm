import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';
import { ValidationError } from '../errors.js';

/**
 * This type will automatically convert string values returned from the database to native JS bigints (default)
 * or numbers (safe only for values up to `Number.MAX_SAFE_INTEGER`), or strings, depending on the `mode`.
 */
export class BigIntType<Mode extends 'bigint' | 'number' | 'string' = 'bigint'> extends Type<
  JSTypeByMode<Mode> | null | undefined,
  string | null | undefined
> {
  constructor(public mode?: Mode) {
    super();
  }

  override convertToDatabaseValue(value: JSTypeByMode<Mode> | null | undefined): string | null | undefined {
    if (value == null) {
      return value;
    }

    return '' + value;
  }

  override convertToJSValue(value: string | bigint | null | undefined): JSTypeByMode<Mode> | null | undefined {
    /* v8 ignore next */
    if (value == null) {
      return value;
    }

    switch (this.mode) {
      case 'number':
        return Number(value) as JSTypeByMode<Mode>;
      case 'string':
        return String(value) as JSTypeByMode<Mode>;
      case 'bigint':
      default:
        return BigInt(String(value)) as JSTypeByMode<Mode>;
    }
  }

  override toJSON(value: JSTypeByMode<Mode> | null | undefined): JSTypeByMode<Mode> | null | undefined {
    if (this.mode === 'number') {
      return value;
    }

    return this.convertToDatabaseValue(value) as JSTypeByMode<Mode> | null | undefined;
  }

  override fromJSON(value: unknown): JSTypeByMode<Mode> | null | undefined {
    // the serialized form is a decimal string, or a plain number in `number` mode
    const valid =
      (typeof value === 'string' && /^-?\d+$/.test(value)) || (typeof value === 'number' && Number.isInteger(value));

    if (!valid) {
      throw ValidationError.invalidType(BigIntType, value, 'JSON');
    }

    switch (this.mode) {
      case 'number': {
        // `Number` silently rounds past `MAX_SAFE_INTEGER`, tampered cursors must fail loudly
        const num = Number(value);

        if (!Number.isSafeInteger(num)) {
          throw ValidationError.invalidType(BigIntType, value, 'JSON');
        }

        return num as JSTypeByMode<Mode>;
      }
      case 'string':
        return String(value) as JSTypeByMode<Mode>;
      case 'bigint':
      default:
        return BigInt(value) as JSTypeByMode<Mode>;
    }
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? 'bigint';
  }

  override compareValues(a: string, b: string): boolean {
    return String(a) === String(b);
  }
}

type JSTypeByMode<Mode extends 'bigint' | 'number' | 'string'> = Mode extends 'bigint'
  ? bigint
  : Mode extends 'number'
    ? number
    : string;
