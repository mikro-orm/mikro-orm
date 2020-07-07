import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

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
    return platform.getBigIntTypeDeclarationSQL();
  }

}
