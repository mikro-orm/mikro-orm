import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class DoubleType extends Type<string | null | undefined, string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDoubleDeclarationSQL();
  }

  override compareAsType(): string {
    return 'string';
  }

}
