import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

export class DateTimeType extends Type<Date, string> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTimeTypeDeclarationSQL({ length: prop.length });
  }

  override compareAsType(): string {
    return 'Date';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
