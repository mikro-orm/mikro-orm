import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class EnumType extends Type<string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getEnumTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
