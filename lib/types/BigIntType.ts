import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

/**
 * This type will automatically convert string values returned from the database to native JS bigints.
 */
export class BigIntType extends Type {

  convertToDatabaseValue(value: any, platform: Platform): any {
    return '' + value;
  }

  convertToJSValue(value: any, platform: Platform): any {
    return '' + value;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBigIntTypeDeclarationSQL();
  }

}
