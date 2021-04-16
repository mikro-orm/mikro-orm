import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

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
