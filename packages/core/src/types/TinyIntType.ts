import { Type } from './Type';
import type { Platform } from '../platforms';
import type { EntityProperty } from '../typings';

export class TinyIntType extends Type<number | null | undefined, number | null | undefined> {

  getColumnType(prop: EntityProperty, platform: Platform) {
    return platform.getTinyIntTypeDeclarationSQL(prop);
  }

  compareAsType(): string {
    return 'number';
  }

}
