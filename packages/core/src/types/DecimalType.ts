import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/**
 * Type that maps an SQL DECIMAL to a JS string or number.
 */
export class DecimalType extends Type<string | number, string> {

  constructor(public mode?: 'number' | 'string') {
    super();
  }

  /* v8 ignore next 7 */
  override convertToJSValue(value: string): number | string {
    if ((this.mode ?? this.prop?.runtimeType) === 'number') {
      return +value;
    }

    return value;
  }

  override compareValues(a: string, b: string): boolean {
    return this.format(a) === this.format(b);
  }

  private format(val: string | number) {
    /* v8 ignore next 3 */
    if (this.prop?.scale == null) {
      return +val;
    }

    const base = Math.pow(10, this.prop.scale);
    return Math.round((+val + Number.EPSILON) * base) / base;
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDecimalTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? this.prop?.runtimeType ?? 'string';
  }

}
