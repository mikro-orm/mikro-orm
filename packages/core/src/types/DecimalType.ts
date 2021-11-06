import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * Type that maps an SQL DECIMAL to a JS string.
 */
export class DecimalType extends Type<string | null | undefined, string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDecimalTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
