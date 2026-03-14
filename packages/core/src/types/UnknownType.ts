import type { EntityProperty } from '../typings.js';
import type { Platform } from '../platforms/Platform.js';
import { Type } from './Type.js';

/** Passthrough type that performs no conversion, used when the column type is unknown or unrecognized. */
export class UnknownType extends Type<unknown | null | undefined, unknown | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
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
