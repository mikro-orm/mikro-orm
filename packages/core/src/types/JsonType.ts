import type { TransformContext } from './Type';
import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityMetadata, EntityProperty } from '../typings';

export class JsonType extends Type<unknown, string | null> {

  // TODO v6: remove the boolean variant
  convertToDatabaseValue(value: unknown, platform: Platform, context?: TransformContext | boolean): string | null {
    if (value == null) {
      return value as null;
    }

    return platform.convertJsonToDatabaseValue(value, typeof context === 'boolean' ? { fromQuery: context } : context) as string;
  }

  convertToJSValue(value: string | unknown, platform: Platform): unknown {
    return platform.convertJsonToJSValue(value);
  }

  getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getJsonDeclarationSQL();
  }

  ensureComparable<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T>): boolean {
    return !prop.embedded || !meta.properties[prop.embedded[0]].object;
  }

}
