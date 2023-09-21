import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class DateType extends Type<Date | null | undefined, string | null | undefined> {

  // override convertToDatabaseValue(value: Date | string | undefined | null, platform: Platform): string {
  //   if (value instanceof Date) {
  //     return value.toISOString().substr(0, 10);
  //   }
  //
  //   if (!value || value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
  //     return value as string;
  //   }
  //
  //   throw ValidationError.invalidType(DateType, value, 'JS');
  // }
  //
  // override convertToJSValue(value: Date | string | null | undefined, platform: Platform): Date {
  //   if (!value || value instanceof Date) {
  //     return value as Date;
  //   }
  //
  //   const date = new Date(value);
  //
  //   if (date.toString() === 'Invalid Date') {
  //     throw ValidationError.invalidType(DateType, value, 'database');
  //   }
  //
  //   return date;
  // }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTypeDeclarationSQL(prop.length);
  }

  override toJSON(value: Date, platform: Platform): Date | null | undefined | string {
    return this.convertToDatabaseValue(value, platform);
  }

}
