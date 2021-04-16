import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class UuidType extends Type<string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getUuidTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
