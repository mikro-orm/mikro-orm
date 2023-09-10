import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';
import { Type } from './Type';

export class DoubleType extends Type<string | null | undefined, string | null | undefined> {
  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDoubleDeclarationSQL();
  }

  override compareAsType(): string {
    return 'string';
  }
}
