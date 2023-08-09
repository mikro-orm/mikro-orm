import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class EnumType extends Type<string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return prop.columnTypes?.[0] ?? platform.getEnumTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

  ensureComparable(): boolean {
    return false;
  }

}
