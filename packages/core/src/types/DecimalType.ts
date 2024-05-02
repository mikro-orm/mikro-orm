import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * Type that maps an SQL DECIMAL to a JS string or number.
 */
export class DecimalType extends Type<string | number, string> {

  constructor(public mode?: 'number' | 'string') {
    super();
  }

  override convertToJSValue(value: string): number | string {
    if ((this.mode ?? this.prop?.runtimeType) === 'number') {
      return +value;
    }

    return value;
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDecimalTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? this.prop?.runtimeType ?? 'string';
  }

}
