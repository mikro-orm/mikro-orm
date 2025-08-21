import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * Type that maps an SQL DOUBLE to a JS string or number.
 */
export class DoubleType extends Type<number | string, string> {

  override convertToJSValue(value: string): number | string {
    if (this.prop?.runtimeType === 'number') {
      return +value;
    }

    return String(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDoubleDeclarationSQL();
  }

  override compareAsType(): string {
    return this.prop?.runtimeType ?? 'number';
  }

}
