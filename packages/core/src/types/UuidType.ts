import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class UuidType extends Type<string | null | undefined> {

  override getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL(prop);
  }

  override compareAsType(): string {
    return 'string';
  }

}
