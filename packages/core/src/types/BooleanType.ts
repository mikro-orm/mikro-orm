import { Type } from './Type';
import { Platform } from '../platforms';
import { EntityProperty } from '../typings';

export class BooleanType extends Type<number | null | undefined, number | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getBooleanTypeDeclarationSQL();
  }

  compareAsType(): string {
    return 'boolean';
  }

}
