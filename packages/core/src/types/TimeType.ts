import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';
import { ValidationError } from '../errors';

export class TimeType extends Type {

  convertToDatabaseValue(value: any, platform: Platform): string {
    if (value && !value.toString().match(/^\d{2,}:(?:[0-5]\d):(?:[0-5]\d)$/)) {
      throw ValidationError.invalidType(TimeType, value, 'JS');
    }

    return super.convertToDatabaseValue(value, platform);
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTimeTypeDeclarationSQL(prop.length);
  }

}
