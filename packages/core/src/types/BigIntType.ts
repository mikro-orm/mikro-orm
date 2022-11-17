import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * This type will automatically convert string values returned from the database to native JS bigints.
 */
export class BigIntType extends Type<string | bigint | null | undefined, string | null | undefined> {

  convertToDatabaseValue(value: string | bigint | null | undefined): string | null | undefined {
    if (!value) {
      return value as null | undefined;
    }

    return '' + value;
  }

  convertToJSValue(value: string | bigint | null | undefined): string | null | undefined {
    if (!value) {
      return value as null | undefined;
    }

    return '' + value;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
