import { type TransformContext, Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export interface StringTypeOptions {
  trim?: boolean;
  case?: 'upper' | 'lower';
}

const stringTypeOptions = Symbol('StringTypeOptions');

/** Maps a database VARCHAR column to a JS `string`. */
export class StringType extends Type<string | null | undefined, string | null | undefined> {
  declare private readonly [stringTypeOptions]: StringTypeOptions;

  constructor(options: StringTypeOptions = {}) {
    super();
    Object.defineProperty(this, stringTypeOptions, { value: options, enumerable: false });
  }

  override convertToDatabaseValue(
    value: string | null | undefined,
    _platform: Platform,
    _context?: TransformContext,
  ): string | null | undefined {
    return this.normalize(value);
  }

  override convertToJSValue(
    value: string | null | undefined,
    _platform: Platform,
    _context?: TransformContext,
  ): string | null | undefined {
    return this.normalize(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getVarcharTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return this[stringTypeOptions].trim === true || this[stringTypeOptions].case != null;
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultVarcharLength();
  }

  private normalize(value: string | null | undefined): string | null | undefined {
    if (value == null) {
      return value;
    }

    if (this[stringTypeOptions].trim) {
      value = value.trim();
    }

    if (this[stringTypeOptions].case === 'upper') {
      return value.toUpperCase();
    }

    if (this[stringTypeOptions].case === 'lower') {
      return value.toLowerCase();
    }

    return value;
  }
}
