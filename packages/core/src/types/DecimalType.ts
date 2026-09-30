import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

function normalizeDecimal(value: unknown): string | undefined {
  const match = typeof value === 'string' ? /^(-?)(\d+)(?:\.(\d+))?$/.exec(value) : null;

  if (!match) {
    return undefined;
  }

  const int = match[2].replace(/^0+(?=\d)/, '');
  const fraction = (match[3] ?? '').replace(/0+$/, '');
  const sign = match[1] && /[1-9]/.test(int + fraction) ? '-' : '';

  return sign + int + (fraction ? `.${fraction}` : '');
}

/**
 * Type that maps an SQL DECIMAL to a JS string or number.
 */
export class DecimalType<Mode extends 'number' | 'string' = 'string'> extends Type<JSTypeByMode<Mode>, string> {
  constructor(public mode?: Mode) {
    super();
  }

  /* v8 ignore next */
  override convertToJSValue(value: string): JSTypeByMode<Mode> {
    if ((this.mode ?? this.prop?.runtimeType) === 'number') {
      return +value as JSTypeByMode<Mode>;
    }

    return String(value) as JSTypeByMode<Mode>;
  }

  override compareValues(a: string, b: string): boolean {
    if (this.platform!.formatDecimal(a, this.prop?.scale) !== this.platform!.formatDecimal(b, this.prop?.scale)) {
      return false;
    }

    // doubles keep only ~15 significant digits, so two decimal strings can round to the same number and still differ
    const [normalizedA, normalizedB] = [normalizeDecimal(a), normalizeDecimal(b)];
    return normalizedA == null || normalizedB == null || normalizedA === normalizedB;
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDecimalTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return this.mode ?? this.prop?.runtimeType ?? 'string';
  }
}

type JSTypeByMode<Mode extends 'number' | 'string'> = Mode extends 'number' ? number : string;
