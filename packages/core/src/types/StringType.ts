import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class StringType extends Type<string | null | undefined, string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getVarcharTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'string';
  }

}
