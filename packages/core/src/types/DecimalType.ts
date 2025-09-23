import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * Type that maps an SQL DECIMAL to a JS string or number.
 */
export class DecimalType<Mode extends 'number' | 'string' = 'string'> extends Type<JSTypeByMode<Mode>, string> {

  constructor(public mode?: Mode) {
    super();
  }

  override convertToJSValue(value: string): JSTypeByMode<Mode> {
    if ((this.mode ?? this.prop?.runtimeType) === 'number') {
      return +value as JSTypeByMode<Mode>;
    }

    return String(value) as JSTypeByMode<Mode>;
  }

  override compareValues(a: string, b: string): boolean {
    return this.format(a) === this.format(b);
  }

  private format(val: string | number) {
    /* istanbul ignore next */
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

type JSTypeByMode<Mode extends 'number' | 'string'> = Mode extends 'number' ? number : string;
