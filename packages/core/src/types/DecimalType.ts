import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

/**
 * Type that maps an SQL DECIMAL to a JS string.
 */
export class DecimalType extends Type<string | null | undefined, string | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDecimalTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }
}
