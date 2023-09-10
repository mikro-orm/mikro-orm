import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

export class EnumType extends Type<string | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return prop.columnTypes?.[0] ?? platform.getEnumTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

  override ensureComparable(): boolean {
    return false;
  }
}
