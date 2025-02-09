import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/**
 * Type that maps an SQL DOUBLE to a JS string or number.
 */
export class DoubleType extends Type<number | string, string> {

  /* v8 ignore next 7 */
  override convertToJSValue(value: string): number | string {
    if (this.prop?.runtimeType === 'number') {
      return +value;
    }

    return value;
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDoubleDeclarationSQL();
  }

  override compareAsType(): string {
    return this.prop?.runtimeType ?? 'number';
  }

}
