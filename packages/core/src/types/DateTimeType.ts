import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class DateTimeType extends Type<Date | null | undefined, string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

  override convertToJSValue(value: string | number | Date | null | undefined, platform: Platform): Date | null | undefined {
    if (value == null || value instanceof Date) {
      return value as Date;
    }

    const tz = platform.getTimezone();

    if (!tz || tz === 'local') {
      return new Date(value as string);
    }

    if (typeof value === 'number' || value.includes('+')) {
      return new Date(value as string);
    }

    return new Date(value + tz);
  }

  override compareAsType(): string {
    return 'Date';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
