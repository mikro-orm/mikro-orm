import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class IntervalType extends Type<string | null | undefined, string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getIntervalTypeDeclarationSQL(prop);
  }

  override convertToJSValue(value: string | null | undefined, platform: Platform): string | null | undefined {
    return platform.convertIntervalToJSValue(value!) as string;
  }

  override convertToDatabaseValue(value: string | null | undefined, platform: Platform): string | null | undefined {
    return platform.convertIntervalToDatabaseValue(value) as string;
  }

  override getDefaultLength(platform: Platform): number {
    return platform.getDefaultDateTimeLength();
  }

}
