import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class DateTimeType extends Type<Date, string> {

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

  compareAsType(): string {
    return 'Date';
  }

  ensureComparable(): boolean {
    return false;
  }

}
