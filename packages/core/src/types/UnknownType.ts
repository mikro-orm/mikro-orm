import type { EntityProperty } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import { Type } from './Type.js';

export class UnknownType extends Type<unknown | null | undefined, unknown | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return prop.columnTypes?.[0] ?? platform.getVarcharTypeDeclarationSQL(prop);
  }

  override get runtimeType(): string {
    return 'unknown';
  }

  override compareAsType(): string {
    return 'unknown';
  }

  override ensureComparable(): boolean {
    return false;
  }

}
