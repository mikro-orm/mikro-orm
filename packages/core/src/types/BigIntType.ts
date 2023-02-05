import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

/**
 * This type will automatically convert string values returned from the database to native JS bigints.
 */
export class BigIntType extends Type<string | bigint | null | undefined, string | null | undefined> {

  override convertToDatabaseValue(value: string | bigint | null | undefined): string | null | undefined {
    if (!value) {
      return value as null | undefined;
    }

    return '' + value;
  }

  override convertToJSValue(value: string | bigint | null | undefined): string | null | undefined {
    if (!value) {
      return value as null | undefined;
    }

    return '' + value;
  }

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

}
