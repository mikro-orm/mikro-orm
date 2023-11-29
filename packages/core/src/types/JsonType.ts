import { Type, type TransformContext } from './Type';
import type { Platform } from '../platforms';
import type { EntityMetadata, EntityProperty } from '../typings';

export class JsonType extends Type<unknown, string | null> {

  override convertToDatabaseValue(value: unknown, platform: Platform, context?: TransformContext): string | null {
    if (value == null) {
      return value as null;
    }

    return platform.convertJsonToDatabaseValue(value, context) as string;
  }

  override convertToJSValueSQL(key: string, platform: Platform): string {
    return key + platform.castJsonValue(this.prop);
  }

  override convertToDatabaseValueSQL(key: string, platform: Platform): string {
    return key + platform.castColumn(this.prop);
  }

  override convertToJSValue(value: string | unknown, platform: Platform): unknown {
    return platform.convertJsonToJSValue(value);
  }

  override getColumnType(prop: EntityProperty, platform: Platform): string {
    return platform.getJsonDeclarationSQL();
  }

  override ensureComparable<T extends object>(meta: EntityMetadata<T>, prop: EntityProperty<T>): boolean {
    return !prop.embedded || !meta.properties[prop.embedded[0]].object;
  }

  override compareAsType(): string {
    return 'any';
  }

  override get runtimeType(): string {
    return 'object';
  }

}
