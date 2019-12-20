import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';
import { ValidationError } from '../utils';

export class DateType extends Type {

  convertToDatabaseValue(value: any, platform: Platform): any {
    if (value instanceof Date) {
      return value.toISOString().substr(0, 10);
    }

    if (!value || value.toString().match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }

    throw ValidationError.invalidType(DateType, value, 'JS');
  }

  convertToJSValue(value: any, platform: Platform): any {
    if (!value || value instanceof Date) {
      return value;
    }

    const date = new Date(value);

    if (date.toString() === 'Invalid Date') {
      throw ValidationError.invalidType(DateType, value, 'database');
    }

    return date;
  }

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDateTypeDeclarationSQL(prop.length);
  }

}
