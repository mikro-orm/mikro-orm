import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class DoubleType extends Type<string | null | undefined, string | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getDoubleDeclarationSQL();
  }

  compareAsType(): string {
    return 'string';
  }

}
