import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

export class EnumType extends Type<string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    if (prop.nativeEnumName) {
      return prop.nativeEnumName;
    }

    return prop.columnTypes?.[0] ?? platform.getEnumTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
