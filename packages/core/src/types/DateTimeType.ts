import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';
import { ValidationError } from '../errors.js';

/** Maps a database DATETIME/TIMESTAMP column to a JS `Date` object. */
export class DateTimeType extends Type<Date, string> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

  override compareAsType(): string {
    return 'Date';
  }

  override fromJSON(value: unknown): Date {
    const date = new Date(value as string);

    if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
      throw ValidationError.invalidType(DateTimeType, value, 'JSON');
    }

    return date;
  }

  override get runtimeType(): string {
    return 'Date';
  }

  override ensureComparable(): boolean {
    return false;
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultDateTimeLength();
  }
}
