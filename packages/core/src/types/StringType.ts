import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export interface StringTypeOptions {
  trim?: boolean;
  case?: 'upper' | 'lower';
}

/** @internal */
export abstract class BaseStringType extends Type<string | null | undefined, string | null | undefined> {
  constructor(readonly options: StringTypeOptions = {}) {
    super();

    // a defined `compareValues` replaces the inline `!==` comparator, so only provide it when normalization is configured
    if (options.trim || options.case) {
      this.compareValues = (a, b) => this.normalize(a) === this.normalize(b);
    }
  }

  override convertToDatabaseValue(value: string | null | undefined): string | null | undefined {
    return this.normalize(value);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }

  private normalize(value: string | null | undefined): string | null | undefined {
    if (value == null) {
      return value;
    }

    if (this.options.trim) {
      value = value.trim();
    }

    if (this.options.case === 'upper') {
      return value.toUpperCase();
    }

    if (this.options.case === 'lower') {
      return value.toLowerCase();
    }

    return value;
  }
}

/** Maps a database VARCHAR column to a JS `string`. */
export class StringType extends BaseStringType {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getVarcharTypeDeclarationSQL(prop);
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultVarcharLength();
  }
}
