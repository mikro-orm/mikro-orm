import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/**
 * Type that maps an SQL DOUBLE to a JS number (default) or string.
 */
export class DoubleType<Mode extends 'number' | 'string' = 'number'> extends Type<JSTypeByMode<Mode>, string> {
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

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getDoubleDeclarationSQL();
  }

  override compareAsType(): string {
    return this.mode ?? this.prop?.runtimeType ?? 'number';
  }
}

type JSTypeByMode<Mode extends 'number' | 'string'> = Mode extends 'number' ? number : string;
