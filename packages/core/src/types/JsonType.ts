import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';
import { Utils } from '../utils';

export class JsonType extends Type<object, string | null> {

  convertToDatabaseValue(value: object, platform: Platform): string | null {
    if (platform.convertsJsonAutomatically(true) || value === null) {
      return value as unknown as string;
    }

    return JSON.stringify(value);
  }

  convertToJSValue(value: string | object, platform: Platform): object {
    if (!platform.convertsJsonAutomatically() && Utils.isString(value)) {
      return JSON.parse(value);
    }

    return value as object;
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getJsonDeclarationSQL();
  }

}
