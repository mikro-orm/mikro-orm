import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class IntegerType extends Type<number | null | undefined, number | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getIntegerTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'number';
  }

}
