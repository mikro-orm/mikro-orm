import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

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
