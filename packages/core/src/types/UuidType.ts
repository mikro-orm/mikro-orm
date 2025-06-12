import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class UuidType extends Type<string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'any';
  }

  override convertToDatabaseValue(value: string | null | undefined, platform: Platform): string | null {
    if (!value) {
      return value!;
    }

    return platform.convertUuidToDatabaseValue(value) as string;
  }

  override convertToJSValue(value: string | null | undefined, platform: Platform): string | null | undefined {
    if (!value) {
      return value;
    }

    return platform.convertUuidToJSValue(value) as string;
  }

  override ensureComparable(): boolean {
    return false;
  }

}
