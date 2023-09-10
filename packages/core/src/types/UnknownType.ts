import type { Platform } from '../platforms/Platform';
import type { EntityProperty } from '../typings';
import { StringType } from './StringType';

export class UnknownType extends StringType {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return prop.columnTypes?.[0] ?? platform.getVarcharTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'unknown';
  }
}
