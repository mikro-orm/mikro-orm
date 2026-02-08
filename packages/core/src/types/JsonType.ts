import { Type, type TransformContext } from './Type.js';
import type { Platform } from '../platforms/Platform.js';
import type { EntityMetadata, EntityProperty } from '../typings.js';

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

  override convertToJSValue(value: string | unknown, platform: Platform, context?: TransformContext): unknown {
    const isJsonColumn = ['json', 'jsonb', platform.getJsonDeclarationSQL()].includes(this.prop!.columnTypes[0]);
    const isObjectEmbedded = this.prop!.embedded && this.prop!.object;

    if ((platform.convertsJsonAutomatically() || isObjectEmbedded) && isJsonColumn && !context?.force) {
      return value;
    }

    return platform.convertJsonToJSValue(value, context);
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
    return 'any';
  }
}
