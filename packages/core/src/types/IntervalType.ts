import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

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

}
