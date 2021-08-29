import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class StringType extends Type<string | null | undefined, string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getVarcharTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
