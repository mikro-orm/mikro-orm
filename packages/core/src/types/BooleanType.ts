import { Type } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityProperty } from '../typings.js';

/** Maps a database BOOLEAN/TINYINT(1) column to a JS `boolean`. */
export class BooleanType extends Type<boolean | null | undefined, boolean | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getBooleanTypeDeclarationSQL();
  }

  override compareAsType(): string {
    return 'boolean';
  }

  override convertToJSValue(value: boolean | null | undefined): boolean | null | undefined {
    return Boolean(value);
  }

  override ensureComparable(): boolean {
    return false;
  }
}
