import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class DateType extends Type<string | null | undefined, string | null | undefined> {

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }

  override convertToJSValue(value: any, platform: Platform): string | null | undefined {
    return platform.convertDateToJSValue(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDateTypeDeclarationSQL(prop.length);
  }

  override getDefaultLength(platform: Platform): number {
    return 0;
  }

}
