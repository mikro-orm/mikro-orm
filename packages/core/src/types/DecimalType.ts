import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/** Scales a plain decimal string to an integer rounded half away from zero at `scale`, like the DB does. */
function toScaledInteger(value: unknown, scale: number): bigint | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const negative = value.startsWith('-');
  const [int, fraction = ''] = (negative ? value.slice(1) : value).split('.');
  const digits = int + fraction;

  for (let i = 0; i < digits.length; i++) {
    const code = digits.charCodeAt(i);

    if (code < 48 || code > 57) {
      return undefined;
    }
  }

  let scaled = BigInt('0' + int + fraction.slice(0, scale).padEnd(scale, '0'));

  if (fraction.charCodeAt(scale) >= 53) {
    scaled++;
  }

  return negative ? -scaled : scaled;
}

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
    if (a === b) {
      return true;
    }

    if (this.format(a) !== this.format(b)) {
      return false;
    }

    const scale = this.prop?.scale;

    // doubles are exact only up to 15 significant digits, so only higher precision strings can differ past the numeric check
    if ((this.prop?.precision ?? 0) <= 15 || this.compareAsType() !== 'string') {
      return true;
    }

    const scaledA = toScaledInteger(a, scale ?? 0);
    const scaledB = toScaledInteger(b, scale ?? 0);

    return scaledA == null || scaledB == null || scaledA === scaledB;
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
